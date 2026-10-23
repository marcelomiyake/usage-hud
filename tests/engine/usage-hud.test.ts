// Runs the built plugin inside Claude Code's own engine: `npm run test:plugin`.
// The behaviour itself is covered by the vitest *.spec suites; these check
// that the bundle loads, reads the engine's figures, and pins its line.
import type { On, SessionUsage } from 'claude-code'
import { describe, expect, mock, test, type Engine } from 'claude-code/testing'

const NOW = Date.parse('2026-10-23T12:00:00Z')
const USAGE: SessionUsage = {
  startedAt: NOW,
  context: { window: 1_000_000, tokens: 45_213, percent: 5 },
  rateLimits: [
    { kind: 'five_hour', percentUsed: 23.4, resetsAt: '2026-10-23T15:00:00Z' },
    { kind: 'seven_day', percentUsed: 41, resetsAt: '2026-10-28T09:00:00Z' },
  ],
}

/** Answers what the engine would beneath the plugin, records the status line, and starts the session. */
async function boot($: Engine, on: On, usage: SessionUsage): Promise<{ readonly lines: (string | undefined)[] }> {
  const lines: (string | undefined)[] = []
  const clock = mock.clock(on, { now: NOW })
  on('session.usage', () => ({ value: usage }))
  on('ui.status', (_, e) => {
    lines.push(e.text)
    return { value: undefined }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.measure', (_, e) => ({ changed: e.changed }))
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
  await clock.settle()
  return { lines }
}

describe('the status line', () => {
  test('shows the context window, 5-hour and weekly usage as icons, with the time to each reset', async ($, on) => {
    const { lines } = await boot($, on, USAGE)

    expect(lines.at(-1)).toBe('🪟 45.2k/1M  🕔 23% ↻3h  📅 41% ↻4d21h')
  })

  test('shows only the window size off a subscription, before the first response', async ($, on) => {
    const { lines } = await boot($, on, { startedAt: NOW, context: { window: 200_000 }, rateLimits: [] })

    expect(lines.at(-1)).toBe('🪟 —/200k')
  })

  test('follows the figures the engine pushes after a turn', async ($, on) => {
    const { lines } = await boot($, on, USAGE)

    await $.session.measure({
      context: { window: 1_000_000, tokens: 120_400, percent: 12 },
      rateLimits: [
        { kind: 'five_hour', percentUsed: 31, resetsAt: '2026-10-23T15:00:00Z' },
        { kind: 'seven_day', percentUsed: 42.2 },
      ],
      changed: ['context', 'rateLimits'],
    })

    expect(lines.at(-1)).toBe('🪟 120k/1M  🕔 31% ↻3h  📅 42%')
  })
})

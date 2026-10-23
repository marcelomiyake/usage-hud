import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeEngine } from '../../support/fake-engine'

const IN_THREE_HOURS = new Date(2026, 9, 23, 15, 0).toISOString()

let engine: FakeEngine

async function load(): Promise<void> {
  vi.resetModules()
  const { register } = await import('../../../src/infrastructure/claude-code/register')
  engine = new FakeEngine()
  register(engine.on as never)
}

beforeEach(async () => {
  await load()
})

describe('when the session starts', () => {
  it('shows the window size before the first response', async () => {
    await engine.dispatch('session.start', { source: 'startup' })

    expect(engine.statuses).toEqual(['🪟 —/1M'])
  })

  it('passes the start on to the engine', async () => {
    const started = await engine.dispatch('session.start', { source: 'startup' }, () => ({ cwd: '/work' }))

    expect(started).toEqual({ cwd: '/work' })
  })

  it('judges the line again every minute', async () => {
    await engine.dispatch('session.start', { source: 'startup' })

    expect(engine.runningIntervals.map(interval => interval.ms)).toEqual([60_000])
  })

  it('keeps one refresh when the session starts over', async () => {
    await engine.dispatch('session.start', { source: 'startup' })
    await engine.dispatch('session.start', { source: 'clear' })

    expect(engine.runningIntervals).toHaveLength(1)
  })

  it('leaves the line as it was when the figures cannot be read', async () => {
    engine.usageFault = new Error('no session bound')

    await engine.dispatch('session.start', { source: 'startup' })

    expect(engine.statuses).toEqual([])
  })
})

describe('when the engine measures the session', () => {
  it('shows the figures it pushed', async () => {
    const measured = await engine.dispatch('session.measure', {
      context: { window: 1_000_000, tokens: 45_213, percent: 5 },
      rateLimits: [
        { kind: 'five_hour', percentUsed: 23.4, resetsAt: IN_THREE_HOURS },
        { kind: 'seven_day', percentUsed: 41 },
      ],
      changed: ['context', 'rateLimits'],
    })

    expect(engine.lastStatus).toBe('🪟 45.2k/1M  🕔 23%  📅 41%')
    expect(measured).toMatchObject({ changed: ['context', 'rateLimits'] })
  })
})

describe('between turns', () => {
  it('drops a window to 0% once it resets', async () => {
    engine.usage = {
      context: { window: 200_000, tokens: 64_000 },
      rateLimits: [{ kind: 'five_hour', percentUsed: 97, resetsAt: IN_THREE_HOURS }],
    }
    await engine.dispatch('session.start', { source: 'startup' })
    expect(engine.lastStatus).toBe('🪟 64k/200k  🕔 97%')

    engine.now = new Date(2026, 9, 23, 15, 1).getTime()
    await engine.tick()

    expect(engine.lastStatus).toBe('🪟 64k/200k  🕔 0%')
  })
})

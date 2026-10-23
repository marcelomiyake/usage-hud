import { describe, expect, it } from 'vitest'
import { readingOf } from '../../../src/infrastructure/claude-code/session-usage'

describe('readingOf', () => {
  it('reads the context window and the 5-hour and weekly windows', () => {
    const reading = readingOf({
      context: { window: 1_000_000, tokens: 45_213, percent: 5 },
      rateLimits: [
        { kind: 'five_hour', percentUsed: 23.5, resetsAt: '2026-10-23T15:00:00Z' },
        { kind: 'seven_day', percentUsed: 41 },
      ],
    })

    expect(reading).toEqual({
      context: { size: 1_000_000, used: 45_213 },
      limits: [
        { period: 'session', percentUsed: 23.5, resetsAt: '2026-10-23T15:00:00Z' },
        { period: 'weekly', percentUsed: 41, resetsAt: undefined },
      ],
    })
  })

  it('leaves the fill unknown before the first response', () => {
    expect(readingOf({ context: { window: 200_000 }, rateLimits: [] }).context).toEqual({
      size: 200_000,
      used: undefined,
    })
  })

  it('leaves out the windows the line does not show', () => {
    const reading = readingOf({
      context: { window: 200_000 },
      rateLimits: [
        { kind: 'seven_day_opus', percentUsed: 70 },
        { kind: 'spend_limit', percentUsed: 12 },
        { kind: 'constructor', percentUsed: 1 },
      ],
    })

    expect(reading.limits).toEqual([])
  })

  it('reports no reset offer, since Claude Code gives a mod none', () => {
    expect(readingOf({ context: { window: 200_000 }, rateLimits: [] }).resetOffers).toBeUndefined()
  })
})

import { describe, expect, it } from 'vitest'
import { UsageLimit } from '../../../src/core/domain/usage-limit'

const NOW = new Date('2026-10-23T12:00:00Z')
const LATER = new Date('2026-10-23T15:00:00Z')
const EARLIER = new Date('2026-10-23T09:00:00Z')

describe('UsageLimit', () => {
  it('reads the share used while the window runs', () => {
    const limit = UsageLimit.of({ period: 'session', percentUsed: 23.5, resetsAt: LATER })

    expect(limit.percentUsedAt(NOW)).toBe(23.5)
  })

  it('reads nothing used once the window has reset', () => {
    const limit = UsageLimit.of({ period: 'session', percentUsed: 80, resetsAt: EARLIER })

    expect(limit.percentUsedAt(NOW)).toBe(0)
    expect(limit.wholePercentAt(NOW)).toBe(0)
  })

  it('keeps the share when the reset time is unknown', () => {
    expect(UsageLimit.of({ period: 'weekly', percentUsed: 41 }).percentUsedAt(NOW)).toBe(41)
  })

  it.each([
    [0, 0],
    [7, 7],
    [23.4, 23],
    [23.5, 24],
    [99.4, 99],
    [99.6, 99],
    [100, 100],
    [104.6, 105],
  ])('shows %f%% as %i%%', (percentUsed, whole) => {
    expect(UsageLimit.of({ period: 'weekly', percentUsed }).wholePercentAt(NOW)).toBe(whole)
  })

  it('keeps the reading that has used more', () => {
    const low = UsageLimit.of({ period: 'weekly', percentUsed: 10 })
    const high = UsageLimit.of({ period: 'weekly', percentUsed: 30 })

    expect(low.moreUsedOf(high)).toBe(high)
    expect(high.moreUsedOf(low)).toBe(high)
  })

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('refuses a share of %s', percentUsed => {
    expect(() => UsageLimit.of({ period: 'session', percentUsed })).toThrow(RangeError)
  })

  it('refuses an invalid reset date', () => {
    expect(() => UsageLimit.of({ period: 'session', percentUsed: 1, resetsAt: new Date('soon') })).toThrow(RangeError)
  })
})

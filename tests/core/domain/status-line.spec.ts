import { describe, expect, it } from 'vitest'
import { ContextWindow } from '../../../src/core/domain/context-window'
import { ResetOffer } from '../../../src/core/domain/reset-offer'
import { ICONS, StatusLine } from '../../../src/core/domain/status-line'
import { UsageLimit } from '../../../src/core/domain/usage-limit'
import { UsageSnapshot } from '../../../src/core/domain/usage-snapshot'

/** Local dates, so the month and day read the same in every time zone. */
const NOW = new Date(2026, 9, 23, 12, 0)
const IN_THREE_HOURS = new Date(2026, 9, 23, 15, 0)
const TWO_HOURS_AGO = new Date(2026, 9, 23, 10, 0)
const NEXT_WEEK = new Date(2026, 9, 30, 9, 0)

const CONTEXT = ContextWindow.of({ size: 1_000_000, used: 45_213 })
const SESSION = UsageLimit.of({ period: 'session', percentUsed: 23.4, resetsAt: IN_THREE_HOURS })
const WEEKLY = UsageLimit.of({ period: 'weekly', percentUsed: 41 })

describe('StatusLine', () => {
  it('shows every figure behind its icon, in order', () => {
    const snapshot = UsageSnapshot.of({
      context: CONTEXT,
      limits: [WEEKLY, SESSION],
      resetOffers: [ResetOffer.of(NEXT_WEEK)],
    })

    const line = StatusLine.of(snapshot, NOW)

    expect(line.text).toBe('🪟 45.2k/1M  🕔 23%  📅 41%  🎁 Oct 30')
    expect(line.segments.map(segment => segment.kind)).toEqual(['context', 'session', 'weekly', 'reset'])
  })

  it('names each figure by an icon alone', () => {
    expect(ICONS).toEqual({ context: '🪟', session: '🕔', weekly: '📅', reset: '🎁' })
  })

  it('shows the window size with an unknown fill before the first answer', () => {
    const snapshot = UsageSnapshot.of({ context: ContextWindow.of({ size: 200_000 }) })

    expect(StatusLine.of(snapshot, NOW).text).toBe('🪟 —/200k')
  })

  it('leaves out the windows off a subscription', () => {
    expect(StatusLine.of(UsageSnapshot.of({ context: CONTEXT }), NOW).text).toBe('🪟 45.2k/1M')
  })

  it('shows a window that has reset as unused', () => {
    const reset = UsageLimit.of({ period: 'session', percentUsed: 97, resetsAt: TWO_HOURS_AGO })

    expect(StatusLine.of(UsageSnapshot.of({ limits: [reset] }), NOW).text).toBe('🕔 0%')
  })

  it('shows the gift only while a reset is open', () => {
    const snapshot = UsageSnapshot.of({ limits: [WEEKLY], resetOffers: [ResetOffer.of(TWO_HOURS_AGO)] })

    expect(StatusLine.of(snapshot, NOW).text).toBe('📅 41%')
  })

  it('is empty when nothing is known', () => {
    const line = StatusLine.of(UsageSnapshot.of({}), NOW)

    expect(line.isEmpty()).toBe(true)
    expect(line.text).toBe('')
  })
})

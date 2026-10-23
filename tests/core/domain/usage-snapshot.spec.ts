import { describe, expect, it } from 'vitest'
import { ResetOffer } from '../../../src/core/domain/reset-offer'
import { UsageLimit } from '../../../src/core/domain/usage-limit'
import { UsageSnapshot } from '../../../src/core/domain/usage-snapshot'

const NOW = new Date('2026-10-23T12:00:00Z')

describe('UsageSnapshot', () => {
  it('sorts the limits into the 5-hour and weekly windows', () => {
    const session = UsageLimit.of({ period: 'session', percentUsed: 23 })
    const weekly = UsageLimit.of({ period: 'weekly', percentUsed: 41 })

    const snapshot = UsageSnapshot.of({ limits: [weekly, session] })

    expect(snapshot.session).toBe(session)
    expect(snapshot.weekly).toBe(weekly)
  })

  it('reads a window reported twice at its higher figure', () => {
    const low = UsageLimit.of({ period: 'weekly', percentUsed: 12 })
    const high = UsageLimit.of({ period: 'weekly', percentUsed: 48 })

    expect(UsageSnapshot.of({ limits: [low, high] }).weekly).toBe(high)
  })

  it('knows nothing it was not given', () => {
    const snapshot = UsageSnapshot.of({})

    expect(snapshot.context).toBeUndefined()
    expect(snapshot.session).toBeUndefined()
    expect(snapshot.weekly).toBeUndefined()
    expect(snapshot.firstOpenResetOfferAt(NOW)).toBeUndefined()
  })

  it('offers the open reset that expires first', () => {
    const expired = ResetOffer.of(new Date('2026-10-22T00:00:00Z'))
    const later = ResetOffer.of(new Date('2026-11-06T00:00:00Z'))
    const sooner = ResetOffer.of(new Date('2026-10-30T00:00:00Z'))

    for (const resetOffers of [
      [expired, later, sooner],
      [sooner, expired, later],
    ]) {
      expect(UsageSnapshot.of({ resetOffers }).firstOpenResetOfferAt(NOW)).toBe(sooner)
    }
  })

  it('offers no reset once every one has expired', () => {
    const snapshot = UsageSnapshot.of({ resetOffers: [ResetOffer.of(new Date('2026-10-22T00:00:00Z'))] })

    expect(snapshot.firstOpenResetOfferAt(NOW)).toBeUndefined()
  })
})

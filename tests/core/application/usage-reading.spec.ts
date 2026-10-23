import { describe, expect, it } from 'vitest'
import { snapshotOf } from '../../../src/core/application/usage-reading'

const NOW = new Date('2026-10-23T12:00:00Z')

describe('snapshotOf', () => {
  it('builds the snapshot a full reading describes', () => {
    const snapshot = snapshotOf({
      context: { size: 1_000_000, used: 45_213 },
      limits: [
        { period: 'session', percentUsed: 23.5, resetsAt: '2026-10-23T15:00:00Z' },
        { period: 'weekly', percentUsed: 41 },
      ],
      resetOffers: [{ expiresAt: '2026-10-30T00:00:00Z' }],
    })

    expect(snapshot.context?.used?.value).toBe(45_213)
    expect(snapshot.session?.percentUsed).toBe(23.5)
    expect(snapshot.session?.resetsAt?.toISOString()).toBe('2026-10-23T15:00:00.000Z')
    expect(snapshot.weekly?.resetsAt).toBeUndefined()
    expect(snapshot.firstOpenResetOfferAt(NOW)?.expiresAt.toISOString()).toBe('2026-10-30T00:00:00.000Z')
  })

  it('makes an empty snapshot of an empty reading', () => {
    const snapshot = snapshotOf({})

    expect(snapshot.context).toBeUndefined()
    expect(snapshot.session).toBeUndefined()
    expect(snapshot.resetOffers).toEqual([])
  })

  it('leaves out each figure that is not valid and keeps the rest', () => {
    const snapshot = snapshotOf({
      context: { size: 0 },
      limits: [
        { period: 'session', percentUsed: Number.NaN },
        { period: 'weekly', percentUsed: 12, resetsAt: 'next week' },
        { period: 'weekly', percentUsed: 9 },
      ],
      resetOffers: [{ expiresAt: 'whenever' }],
    })

    expect(snapshot.context).toBeUndefined()
    expect(snapshot.session).toBeUndefined()
    expect(snapshot.weekly?.percentUsed).toBe(9)
    expect(snapshot.resetOffers).toEqual([])
  })

  it('does not hide a fault other than a refused figure', () => {
    const faulty = {
      get period(): 'session' {
        throw new TypeError('reading fault')
      },
      percentUsed: 1,
    }

    expect(() => snapshotOf({ limits: [faulty] })).toThrow(TypeError)
  })
})

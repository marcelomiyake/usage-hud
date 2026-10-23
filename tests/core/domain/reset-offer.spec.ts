import { describe, expect, it } from 'vitest'
import { ResetOffer } from '../../../src/core/domain/reset-offer'

const NOW = new Date('2026-10-23T12:00:00Z')

describe('ResetOffer', () => {
  it('is available until it expires', () => {
    expect(ResetOffer.of(new Date('2026-10-30T00:00:00Z')).isAvailableAt(NOW)).toBe(true)
  })

  it('is gone from the moment it expires', () => {
    expect(ResetOffer.of(NOW).isAvailableAt(NOW)).toBe(false)
    expect(ResetOffer.of(new Date('2026-10-22T00:00:00Z')).isAvailableAt(NOW)).toBe(false)
  })

  it('refuses an invalid expiry', () => {
    expect(() => ResetOffer.of(new Date('never'))).toThrow(RangeError)
  })
})

import { describe, expect, it } from 'vitest'
import { TokenCount } from '../../../src/core/domain/token-count'

describe('TokenCount', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1_000, '1k'],
    [4_520, '4.5k'],
    [45_213, '45.2k'],
    [99_960, '100k'],
    [128_000, '128k'],
    [451_600, '452k'],
    [999_499, '999k'],
    [999_500, '1M'],
    [1_000_000, '1M'],
    [1_540_000, '1.5M'],
    [200_000_000, '200M'],
  ])('formats %i as %s', (value, text) => {
    expect(TokenCount.of(value).format()).toBe(text)
  })

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('refuses %s', value => {
    expect(() => TokenCount.of(value)).toThrow(RangeError)
  })
})

import { describe, expect, it } from 'vitest'
import { Countdown } from '../../../src/core/domain/countdown'

const NOW = new Date('2026-10-23T12:00:00Z')
const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function left(ms: number): string | undefined {
  return Countdown.until(new Date(NOW.getTime() + ms), NOW)?.format()
}

describe('Countdown', () => {
  it.each([
    [30 * SECOND, '<1m'],
    [MINUTE, '1m'],
    [45 * MINUTE + 59 * SECOND, '45m'],
    [HOUR, '1h'],
    [2 * HOUR + 13 * MINUTE, '2h13m'],
    [4 * HOUR + 59 * MINUTE + 59 * SECOND, '4h59m'],
    [DAY, '1d'],
    [DAY + 30 * MINUTE, '1d'],
    [4 * DAY + 21 * HOUR + 5 * MINUTE, '4d21h'],
  ])('counts %i ms down as %s', (ms, text) => {
    expect(left(ms)).toBe(text)
  })

  it('is over once the moment has come', () => {
    expect(left(0)).toBeUndefined()
    expect(left(-MINUTE)).toBeUndefined()
  })

  it('keeps the time left', () => {
    expect(Countdown.until(new Date(NOW.getTime() + HOUR), NOW)?.ms).toBe(HOUR)
  })
})

import { describe, expect, it } from 'vitest'
import { ContextWindow } from '../../../src/core/domain/context-window'

describe('ContextWindow', () => {
  it('holds its size and fill', () => {
    const window = ContextWindow.of({ size: 1_000_000, used: 45_213 })

    expect(window.size.value).toBe(1_000_000)
    expect(window.used?.value).toBe(45_213)
  })

  it('leaves the fill unknown before the first answer', () => {
    expect(ContextWindow.of({ size: 200_000 }).used).toBeUndefined()
  })

  it('refuses a window of no tokens', () => {
    expect(() => ContextWindow.of({ size: 0 })).toThrow(RangeError)
  })

  it('refuses a fill that is not a token count', () => {
    expect(() => ContextWindow.of({ size: 200_000, used: -3 })).toThrow(RangeError)
  })
})

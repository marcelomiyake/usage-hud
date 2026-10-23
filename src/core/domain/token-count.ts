const THOUSAND = 1_000
const MILLION = 1_000_000

/** A number of tokens: a whole count, never negative. */
export class TokenCount {
  private constructor(readonly value: number) {}

  static of(value: number): TokenCount {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`A token count is a whole number of 0 or more, not ${value}`)
    }
    return new TokenCount(value)
  }

  /**
   * The count as a status line shows it: `999`, `4.5k`, `45.2k`, `452k`,
   * `1M`, `1.5M`. One decimal under a hundred of the unit, none above.
   */
  format(): string {
    if (this.value < THOUSAND) {
      return String(this.value)
    }
    const thousands = rounded(this.value / THOUSAND)
    if (thousands < THOUSAND) {
      return `${thousands}k`
    }
    return `${rounded(this.value / MILLION)}M`
  }
}

/** One decimal under 100, none from there; a trailing `.0` is dropped. */
function rounded(amount: number): number {
  const scale = amount < 100 ? 10 : 1
  return Math.round(amount * scale) / scale
}

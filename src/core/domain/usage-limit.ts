/** Which rolling window a usage limit counts over. */
export type UsagePeriod = 'session' | 'weekly'

const FULL = 100

/** How much of a rolling usage window the account has used, and when it starts over. */
export class UsageLimit {
  private constructor(
    readonly period: UsagePeriod,
    /** 0 to 100, with decimals; past 100 once exceeded. */
    readonly percentUsed: number,
    readonly resetsAt: Date | undefined,
  ) {}

  static of(args: {
    readonly period: UsagePeriod
    readonly percentUsed: number
    readonly resetsAt?: Date
  }): UsageLimit {
    if (!Number.isFinite(args.percentUsed) || args.percentUsed < 0) {
      throw new RangeError(`A usage percentage is 0 or more, not ${args.percentUsed}`)
    }
    if (args.resetsAt !== undefined && Number.isNaN(args.resetsAt.getTime())) {
      throw new RangeError('A usage limit resets at a valid date')
    }
    return new UsageLimit(args.period, args.percentUsed, args.resetsAt)
  }

  /** The share used at `now`: none once the window has reset since it was read. */
  percentUsedAt(now: Date): number {
    if (this.resetsAt !== undefined && this.resetsAt.getTime() <= now.getTime()) {
      return 0
    }
    return this.percentUsed
  }

  /**
   * The share used at `now` as a whole percent. It reads 100 only once the
   * limit is reached, so 99.6 shows as 99, never as full.
   */
  wholePercentAt(now: Date): number {
    const percent = this.percentUsedAt(now)
    return percent >= FULL ? Math.round(percent) : Math.min(FULL - 1, Math.round(percent))
  }

  /** Of two readings of the same window, the one that has used more. */
  moreUsedOf(other: UsageLimit): UsageLimit {
    return other.percentUsed > this.percentUsed ? other : this
  }
}

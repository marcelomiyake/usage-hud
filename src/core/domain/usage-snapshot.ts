import type { ContextWindow } from './context-window'
import type { ResetOffer } from './reset-offer'
import type { UsageLimit, UsagePeriod } from './usage-limit'

/** Everything known about the session's usage at one reading. */
export class UsageSnapshot {
  private constructor(
    /** Unknown where the host does not report it. */
    readonly context: ContextWindow | undefined,
    /** The 5-hour window; absent off a subscription. */
    readonly session: UsageLimit | undefined,
    /** The 7-day window; absent off a subscription. */
    readonly weekly: UsageLimit | undefined,
    readonly resetOffers: readonly ResetOffer[],
  ) {}

  static of(args: {
    readonly context?: ContextWindow
    readonly limits?: readonly UsageLimit[]
    readonly resetOffers?: readonly ResetOffer[]
  }): UsageSnapshot {
    const limits = args.limits ?? []
    return new UsageSnapshot(args.context, mostUsed(limits, 'session'), mostUsed(limits, 'weekly'), [
      ...(args.resetOffers ?? []),
    ])
  }

  /** The reset offer still open at `now` that expires first, if the account holds one. */
  firstOpenResetOfferAt(now: Date): ResetOffer | undefined {
    return this.resetOffers
      .filter(offer => offer.isAvailableAt(now))
      .reduce<ResetOffer | undefined>(
        (first, offer) =>
          first === undefined || offer.expiresAt.getTime() < first.expiresAt.getTime() ? offer : first,
        undefined,
      )
  }
}

/** A window reported twice is read at its higher figure, so usage is never understated. */
function mostUsed(limits: readonly UsageLimit[], period: UsagePeriod): UsageLimit | undefined {
  return limits
    .filter(limit => limit.period === period)
    .reduce<UsageLimit | undefined>((most, limit) => (most === undefined ? limit : most.moreUsedOf(limit)), undefined)
}

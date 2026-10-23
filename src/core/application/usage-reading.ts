import { ContextWindow } from '../domain/context-window'
import { ResetOffer } from '../domain/reset-offer'
import { UsageLimit, type UsagePeriod } from '../domain/usage-limit'
import { UsageSnapshot } from '../domain/usage-snapshot'

/** One usage window as a host reports it. */
export type LimitReading = {
  readonly period: UsagePeriod
  /** 0 to 100, decimals allowed. */
  readonly percentUsed: number
  /** ISO 8601. */
  readonly resetsAt?: string
}

/**
 * The usage figures a host reports, as plain data: what an adapter hands the
 * core. Nothing in it is trusted yet; `snapshotOf` keeps what is valid.
 */
export type UsageReading = {
  readonly context?: { readonly size: number; readonly used?: number }
  readonly limits?: readonly LimitReading[]
  /** Each reset the account holds, by when it expires (ISO 8601). */
  readonly resetOffers?: readonly { readonly expiresAt: string }[]
}

/** The snapshot a reading makes. A figure that is not valid is left out, so the rest still shows. */
export function snapshotOf(reading: UsageReading): UsageSnapshot {
  const { context } = reading
  return UsageSnapshot.of({
    context: context === undefined ? undefined : valid(() => ContextWindow.of(context)),
    limits: (reading.limits ?? []).map(limitOf).filter(isPresent),
    resetOffers: (reading.resetOffers ?? [])
      .map(offer => valid(() => ResetOffer.of(new Date(offer.expiresAt))))
      .filter(isPresent),
  })
}

function limitOf(limit: LimitReading): UsageLimit | undefined {
  return valid(() =>
    UsageLimit.of({
      period: limit.period,
      percentUsed: limit.percentUsed,
      resetsAt: limit.resetsAt === undefined ? undefined : new Date(limit.resetsAt),
    }),
  )
}

/** The value `make` builds, or undefined where the domain refuses its figures. */
function valid<T>(make: () => T): T | undefined {
  try {
    return make()
  } catch (error) {
    if (error instanceof RangeError) {
      return undefined
    }
    throw error
  }
}

function isPresent<T>(value: T | undefined): value is T {
  return value !== undefined
}

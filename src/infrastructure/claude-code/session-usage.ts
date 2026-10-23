import type { SessionContextUsage, SessionRateLimit } from 'claude-code'
import type { LimitReading, UsagePeriod, UsageReading } from '../../core'

/** The rate-limit windows the status line shows, by the kind Claude Code reports. */
const PERIODS: ReadonlyMap<string, UsagePeriod> = new Map([
  ['five_hour', 'session'],
  ['seven_day', 'weekly'],
])

/**
 * What Claude Code reports of the session's usage: the figures of
 * `$.session.usage()`, which `session.measure` pushes as they move.
 */
export type ClaudeCodeUsage = {
  readonly context: SessionContextUsage
  readonly rateLimits: readonly SessionRateLimit[]
}

/**
 * The core's reading of Claude Code's figures. Other windows (a model's own
 * weekly window, a gateway's spend limit) are left out.
 *
 * No reset offers: as of Claude Code 2.1.309 a mod is told of none. The
 * engine fetches them from claude.ai with the account's own credentials and
 * shows them only in its own `/limit-reset` notice, so the 🎁 stays hidden.
 */
export function readingOf(usage: ClaudeCodeUsage): UsageReading {
  return {
    context: { size: usage.context.window, used: usage.context.tokens },
    limits: usage.rateLimits.flatMap(limitOf),
  }
}

function limitOf(limit: SessionRateLimit): LimitReading[] {
  const period = PERIODS.get(limit.kind)
  if (period === undefined) {
    return []
  }
  return [{ period, percentUsed: limit.percentUsed, resetsAt: limit.resetsAt }]
}

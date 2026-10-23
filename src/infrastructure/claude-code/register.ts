import type { EngineInterface, On, Timer } from 'claude-code'
import { ShowUsage, type ShowUsageOutcome, type UsageSource } from '../../core'
import { readingOf } from './session-usage'

/** How often the line is judged again between turns, so a window that has reset reads 0%. */
const REFRESH_MS = 60_000

let refreshing: Timer | undefined

export function register(on: On): void {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    refreshing?.cancel()
    refreshing = $.clock.every(REFRESH_MS, () => void showUsage($, sessionUsage($)))
    await showUsage($, sessionUsage($))
    return started
  })

  on('session.measure', async ($, e, next) => {
    await showUsage($, { read: async () => readingOf(e) })
    return next(e)
  })
}

/** Shows `usage` on this mod's status line, judged at the engine's clock. */
function showUsage($: EngineInterface, usage: UsageSource): Promise<ShowUsageOutcome> {
  return new ShowUsage({
    usage,
    clock: { now: async () => new Date(await $.clock.now()) },
    display: { show: text => $.ui.status(text) },
  }).execute()
}

/** The figures as the engine has them now: free to read, no request is sent. */
function sessionUsage($: EngineInterface): UsageSource {
  return { read: async () => readingOf(await $.session.usage()) }
}

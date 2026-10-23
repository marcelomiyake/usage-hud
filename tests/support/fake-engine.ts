// A stand-in for Claude Code's engine: just enough of `on` and `$` for the
// mod's hooks to run in vitest, with every effect recorded for asserts.
import type { SessionContextUsage, SessionRateLimit } from 'claude-code'

type Hook = (...args: unknown[]) => unknown
type Interval = { readonly ms: number; readonly fn: () => void; isCancelled: boolean }

export type EngineUsage = {
  context: SessionContextUsage
  rateLimits: SessionRateLimit[]
}

export class FakeEngine {
  readonly hooks = new Map<string, Hook>()
  /** Every line `$.ui.status` was handed, in order; undefined for a clear. */
  readonly statuses: (string | undefined)[] = []
  readonly intervals: Interval[] = []
  usage: EngineUsage = { context: { window: 1_000_000 }, rateLimits: [] }
  /** What `$.session.usage()` throws instead of answering, when set. */
  usageFault: Error | undefined
  now = new Date(2026, 9, 23, 12, 0).getTime()

  readonly on = (event: string, hook: Hook) => {
    this.hooks.set(event, hook)
    return { catch: () => undefined }
  }

  readonly $ = {
    clock: {
      now: async () => this.now,
      every: (ms: number, fn: () => void) => {
        const interval: Interval = { ms, fn, isCancelled: false }
        this.intervals.push(interval)
        return {
          cancel: () => {
            interval.isCancelled = true
          },
        }
      },
    },
    session: {
      usage: async () => {
        if (this.usageFault !== undefined) {
          throw this.usageFault
        }
        return structuredClone(this.usage)
      },
    },
    ui: {
      status: (text: string | undefined) => {
        this.statuses.push(text)
      },
    },
  }

  get lastStatus(): string | undefined {
    return this.statuses.at(-1)
  }

  get runningIntervals(): Interval[] {
    return this.intervals.filter(interval => !interval.isCancelled)
  }

  /** Raises `event` through the mod's hook, with `bottom` as the engine's answer beneath it. */
  async dispatch(event: string, e: Record<string, unknown>, bottom: (e: unknown) => unknown = next => next) {
    const hook = this.hooks.get(event)
    if (hook === undefined) {
      return bottom(e)
    }
    return hook(this.$, e, async (next: unknown) => bottom(next))
  }

  /** Fires each running interval once and lets its work settle. */
  async tick(): Promise<void> {
    for (const interval of this.runningIntervals) {
      interval.fn()
    }
    await settle()
  }
}

/** Lets promise chains started without an await run to their end. */
export async function settle(): Promise<void> {
  for (let round = 0; round < 10; round += 1) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

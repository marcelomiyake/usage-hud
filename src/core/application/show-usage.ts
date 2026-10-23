import { StatusLine } from '../domain/status-line'
import type { Clock } from './ports/clock'
import type { StatusDisplay } from './ports/status-display'
import type { UsageSource } from './ports/usage-source'
import { snapshotOf } from './usage-reading'

export type ShowUsagePorts = {
  readonly usage: UsageSource
  readonly clock: Clock
  readonly display: StatusDisplay
}

export type ShowUsageOutcome =
  | { readonly status: 'shown'; readonly line: StatusLine }
  /** Nothing is known yet: the line is cleared. */
  | { readonly status: 'cleared' }
  /** The figures could not be read: the line keeps what it showed. */
  | { readonly status: 'unread'; readonly reason: string }

/** Reads the session's usage and shows it on the status line. */
export class ShowUsage {
  constructor(private readonly ports: ShowUsagePorts) {}

  async execute(): Promise<ShowUsageOutcome> {
    const read = await this.ports.usage.read().then(
      reading => ({ isRead: true, reading }) as const,
      (error: unknown) => ({ isRead: false, reason: error instanceof Error ? error.message : String(error) }) as const,
    )
    if (!read.isRead) {
      return { status: 'unread', reason: read.reason }
    }
    const line = StatusLine.of(snapshotOf(read.reading), await this.ports.clock.now())
    if (line.isEmpty()) {
      this.ports.display.show(undefined)
      return { status: 'cleared' }
    }
    this.ports.display.show(line.text)
    return { status: 'shown', line }
  }
}

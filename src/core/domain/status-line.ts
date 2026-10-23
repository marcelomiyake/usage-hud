import type { ContextWindow } from './context-window'
import type { UsageLimit } from './usage-limit'
import type { UsageSnapshot } from './usage-snapshot'

/** The icon that names each figure; the line carries no words of its own. */
export const ICONS = {
  context: '🪟',
  session: '🕔',
  weekly: '📅',
  reset: '🎁',
} as const

export type StatusSegmentKind = keyof typeof ICONS

/** One figure on the line: its icon and its value. */
export type StatusSegment = {
  readonly kind: StatusSegmentKind
  readonly icon: string
  readonly value: string
}

/** Marks the time left until a window resets, after its percentage: `23% ↻2h13m`. */
export const RESETS_IN = '↻'

const SEPARATOR = '  '
/** Stands for the context fill before the model has answered in the window. */
const UNKNOWN = '—'
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

/**
 * The usage figures as the status line shows them, in a fixed order:
 * context window, 5-hour window, weekly window, then a reset offer. Each
 * window shows its share used and, when known, the time until it resets.
 * A figure the snapshot lacks is left out, never shown as zero.
 */
export class StatusLine {
  readonly text: string

  private constructor(readonly segments: readonly StatusSegment[]) {
    this.text = segments.map(segment => `${segment.icon} ${segment.value}`).join(SEPARATOR)
  }

  static of(snapshot: UsageSnapshot, now: Date): StatusLine {
    const offer = snapshot.firstOpenResetOfferAt(now)
    const segments = [
      snapshot.context === undefined ? undefined : segment('context', contextValue(snapshot.context)),
      snapshot.session === undefined ? undefined : segment('session', percentValue(snapshot.session, now)),
      snapshot.weekly === undefined ? undefined : segment('weekly', percentValue(snapshot.weekly, now)),
      offer === undefined ? undefined : segment('reset', monthDay(offer.expiresAt)),
    ]
    return new StatusLine(segments.filter(isPresent))
  }

  isEmpty(): boolean {
    return this.segments.length === 0
  }
}

function segment(kind: StatusSegmentKind, value: string): StatusSegment {
  return { kind, icon: ICONS[kind], value }
}

function contextValue(context: ContextWindow): string {
  return `${context.used?.format() ?? UNKNOWN}/${context.size.format()}`
}

function percentValue(limit: UsageLimit, now: Date): string {
  const percent = `${limit.wholePercentAt(now)}%`
  const countdown = limit.countdownAt(now)
  return countdown === undefined ? percent : `${percent} ${RESETS_IN}${countdown.format()}`
}

/** `Oct 30`, in the local time zone. */
function monthDay(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}

function isPresent<T>(value: T | undefined): value is T {
  return value !== undefined
}

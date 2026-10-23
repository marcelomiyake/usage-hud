const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** The time left until a moment, counted down in whole minutes. */
export class Countdown {
  private constructor(readonly ms: number) {}

  /** The time from `now` until `then`; undefined once `then` has come. */
  static until(then: Date, now: Date): Countdown | undefined {
    const ms = then.getTime() - now.getTime()
    return ms > 0 ? new Countdown(ms) : undefined
  }

  /**
   * The two largest units left, the smaller dropped when it is zero:
   * `4d21h`, `4d`, `2h13m`, `2h`, `45m`, and `<1m` for the last minute.
   */
  format(): string {
    if (this.ms < MINUTE) {
      return '<1m'
    }
    const days = Math.floor(this.ms / DAY)
    const hours = Math.floor((this.ms % DAY) / HOUR)
    const minutes = Math.floor((this.ms % HOUR) / MINUTE)
    if (days > 0) {
      return pair(days, 'd', hours, 'h')
    }
    if (hours > 0) {
      return pair(hours, 'h', minutes, 'm')
    }
    return `${minutes}m`
  }
}

function pair(major: number, majorUnit: string, minor: number, minorUnit: string): string {
  return minor === 0 ? `${major}${majorUnit}` : `${major}${majorUnit}${minor}${minorUnit}`
}

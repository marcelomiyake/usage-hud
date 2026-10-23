/** The host's clock. */
export interface Clock {
  now(): Promise<Date>
}

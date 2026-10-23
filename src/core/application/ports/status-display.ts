/** The host's status line. */
export interface StatusDisplay {
  /** Shows `text` in place of what was there; undefined clears the line. */
  show(text: string | undefined): void
}

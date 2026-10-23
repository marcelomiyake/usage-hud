import { TokenCount } from './token-count'

/** The session's context window: how large it is, and how much of it is in use. */
export class ContextWindow {
  private constructor(
    readonly size: TokenCount,
    /** Unknown until the model has answered once in this window. */
    readonly used: TokenCount | undefined,
  ) {}

  static of(args: { readonly size: number; readonly used?: number }): ContextWindow {
    const size = TokenCount.of(args.size)
    if (size.value === 0) {
      throw new RangeError('A context window holds at least one token')
    }
    return new ContextWindow(size, args.used === undefined ? undefined : TokenCount.of(args.used))
  }
}

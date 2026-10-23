/** A usage-limit reset the account holds, to use before it expires. */
export class ResetOffer {
  private constructor(readonly expiresAt: Date) {}

  static of(expiresAt: Date): ResetOffer {
    if (Number.isNaN(expiresAt.getTime())) {
      throw new RangeError('A reset offer expires at a valid date')
    }
    return new ResetOffer(expiresAt)
  }

  isAvailableAt(now: Date): boolean {
    return this.expiresAt.getTime() > now.getTime()
  }
}

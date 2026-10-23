import type { UsageReading } from '../usage-reading'

/** Where the usage figures come from: the host the core runs in. */
export interface UsageSource {
  read(): Promise<UsageReading>
}

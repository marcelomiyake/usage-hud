import { describe, expect, it } from 'vitest'
import { ShowUsage } from '../../../src/core/application/show-usage'
import type { UsageReading } from '../../../src/core/application/usage-reading'

const NOW = new Date(2026, 9, 23, 12, 0)

/** The ports, answered in memory, with every line the display was asked to show. */
function harness(read: () => Promise<UsageReading>) {
  const shown: (string | undefined)[] = []
  const showUsage = new ShowUsage({
    usage: { read },
    clock: { now: async () => NOW },
    display: { show: text => void shown.push(text) },
  })
  return { showUsage, shown }
}

describe('ShowUsage', () => {
  it('shows the figures it reads', async () => {
    const { showUsage, shown } = harness(async () => ({
      context: { size: 200_000, used: 64_000 },
      limits: [
        { period: 'session', percentUsed: 12 },
        { period: 'weekly', percentUsed: 3 },
      ],
    }))

    const outcome = await showUsage.execute()

    expect(outcome.status).toBe('shown')
    expect(shown).toEqual(['🪟 64k/200k  🕔 12%  📅 3%'])
  })

  it('judges each window at the clock’s time', async () => {
    const { showUsage, shown } = harness(async () => ({
      limits: [{ period: 'session', percentUsed: 88, resetsAt: new Date(2026, 9, 23, 11, 0).toISOString() }],
    }))

    await showUsage.execute()

    expect(shown).toEqual(['🕔 0%'])
  })

  it('clears the line while nothing is known', async () => {
    const { showUsage, shown } = harness(async () => ({}))

    const outcome = await showUsage.execute()

    expect(outcome).toEqual({ status: 'cleared' })
    expect(shown).toEqual([undefined])
  })

  it('leaves the line alone when the figures cannot be read', async () => {
    const { showUsage, shown } = harness(() => Promise.reject(new Error('no session')))

    const outcome = await showUsage.execute()

    expect(outcome).toEqual({ status: 'unread', reason: 'no session' })
    expect(shown).toEqual([])
  })

  it('says why when the source fails with something other than an Error', async () => {
    const { showUsage } = harness(() => Promise.reject('offline'))

    expect(await showUsage.execute()).toEqual({ status: 'unread', reason: 'offline' })
  })
})

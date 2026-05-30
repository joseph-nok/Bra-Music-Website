import { describe, expect, it } from 'vitest'
import { getCountdownParts } from './countdown'

describe('getCountdownParts', () => {
  it('returns zeroed countdown when target is in the past', () => {
    const now = new Date('2026-01-01T12:00:00Z')
    const target = new Date('2025-01-01T12:00:00Z')
    expect(getCountdownParts(target, now)).toEqual([
      ['0', 'Days'],
      ['00', 'Hours'],
      ['00', 'Mins'],
      ['00', 'Secs'],
    ])
  })

  it('pads hours minutes and seconds', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    const target = new Date('2026-01-02T01:02:03Z')
    const parts = getCountdownParts(target, now)
    expect(parts[0]).toEqual(['1', 'Days'])
    expect(parts[1]).toEqual(['01', 'Hours'])
    expect(parts[2]).toEqual(['02', 'Mins'])
    expect(parts[3]).toEqual(['03', 'Secs'])
  })
})

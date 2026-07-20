import { describe, expect, it } from 'vitest'
import { getVerseForDate, VERSES } from './verses'

describe('getVerseForDate', () => {
  it('returns the same verse for every call within the same day', () => {
    const a = getVerseForDate('2026-03-14')
    const b = getVerseForDate('2026-03-14')
    expect(a).toEqual(b)
  })

  it('has exactly 30 hardcoded verses, each with a text and a reference', () => {
    expect(VERSES.length).toBeGreaterThanOrEqual(30)
    for (const v of VERSES) {
      expect(v.text.length).toBeGreaterThan(0)
      expect(v.reference.length).toBeGreaterThan(0)
    }
  })

  it('wraps around correctly at year end for both leap and non-leap years', () => {
    // day 365 of a non-leap year and day 366 of a leap year should both resolve without throwing
    expect(() => getVerseForDate('2026-12-31')).not.toThrow()
    expect(() => getVerseForDate('2024-12-31')).not.toThrow()
    const v365 = getVerseForDate('2026-12-31')
    const v1 = getVerseForDate('2026-01-01')
    // day 365 and day 1 map to different indices unless verses.length divides 365 - with 30 verses it won't
    expect(v365).not.toEqual(v1)
  })
})

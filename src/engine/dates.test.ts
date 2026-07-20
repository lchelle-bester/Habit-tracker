import { describe, expect, it } from 'vitest'
import { addDays, dayOfYear, diffDays, isBefore, isoWeekStart, isoWeekEnd, weekdayOf } from './dates'

describe('dates', () => {
  it('adds and subtracts days across month/year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(diffDays('2026-02-01', '2026-01-31')).toBe(1)
  })

  it('computes the Monday-start week for any weekday, including a Sunday', () => {
    // 2026-01-05 is a Monday
    expect(weekdayOf('2026-01-05')).toBe(1)
    expect(isoWeekStart('2026-01-05')).toBe('2026-01-05')
    expect(isoWeekStart('2026-01-08')).toBe('2026-01-05') // Thursday same week
    expect(isoWeekStart('2026-01-11')).toBe('2026-01-05') // Sunday belongs to the PRECEDING Monday's week
    expect(isoWeekEnd('2026-01-05')).toBe('2026-01-11')
  })

  it('handles a week spanning a calendar-year boundary', () => {
    // 2025-12-29 is a Monday
    expect(isoWeekStart('2025-12-29')).toBe('2025-12-29')
    expect(isoWeekStart('2026-01-01')).toBe('2025-12-29')
    expect(isoWeekEnd('2025-12-29')).toBe('2026-01-04')
  })

  it('computes day-of-year correctly for leap and non-leap years', () => {
    expect(dayOfYear('2026-01-01')).toBe(1)
    expect(dayOfYear('2026-12-31')).toBe(365) // 2026 is not a leap year
    expect(dayOfYear('2024-12-31')).toBe(366) // 2024 is a leap year
    expect(dayOfYear('2024-03-01')).toBe(61) // Jan(31) + Feb(29 in leap year) + 1
  })

  it('zero-pads the year so string comparison stays valid for a triple-digit year', () => {
    // Regression: an un-padded year (e.g. '99-12-31') would sort lexically
    // AFTER a 4-digit year like '2026-07-20', silently breaking every
    // isBefore/isAfter comparison for any code path that walks far enough
    // back in time (see pushback.test.ts's brand-new-install regression).
    // (Years 0-99 hit JS Date's legacy "2-digit year means 1900+year"
    // behavior, which is a separate, irrelevant-for-this-app quirk, so this
    // only checks a year that JS Date itself treats literally.)
    expect(addDays('0100-01-01', -1)).toBe('0099-12-31')
    expect(isBefore('0099-12-31', '2026-07-20')).toBe(true)
  })
})

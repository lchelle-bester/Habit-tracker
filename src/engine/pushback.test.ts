import { describe, expect, it } from 'vitest'
import { evaluatePushbackFlags, __testables } from './pushback'
import { buildSeedGoals } from './seed'
import type { AppData, Entry, Goal } from './types'

const INSTALL = '2026-01-01'

function baseAppData(entries: Entry[] = []): AppData {
  return {
    schemaVersion: 1,
    goals: buildSeedGoals(INSTALL),
    entries,
    settings: { theme: 'system' },
    meta: { installedAt: INSTALL },
  }
}

function goalNamed(goals: Goal[], name: string): Goal {
  const g = goals.find((g) => g.name === name)
  if (!g) throw new Error(`missing goal ${name}`)
  return g
}

function sleepEntry(goalId: string, date: string, actualTime: string): Entry {
  return { type: 'daily_time', goalId, date, actualTime }
}

describe('evaluatePushbackFlags', () => {
  it('flags 3 consecutive late nights, naming the boxing consequence', () => {
    const appData = baseAppData()
    const sleep = goalNamed(appData.goals, 'Sleep')
    const today = '2026-01-10'
    appData.entries = [
      sleepEntry(sleep.id, '2026-01-07', '23:20'),
      sleepEntry(sleep.id, '2026-01-08', '22:50'), // Thursday override 22:30, so this is late too
      sleepEntry(sleep.id, '2026-01-09', '23:30'),
    ]
    const flag = evaluatePushbackFlags(appData, today)
    expect(flag?.id).toBe('bedtime_3_nights')
    expect(flag?.message).toContain('Boxing')
  })

  it('does not flag bedtime if there is a gap in the 3-night run', () => {
    const appData = baseAppData()
    const sleep = goalNamed(appData.goals, 'Sleep')
    const today = '2026-01-10'
    appData.entries = [
      sleepEntry(sleep.id, '2026-01-07', '23:20'),
      // 01-08 missing: breaks the unbroken run
      sleepEntry(sleep.id, '2026-01-09', '23:30'),
    ]
    expect(__testables.checkBedtime3Nights(appData, today)).toBeNull()
  })

  it('flags boxing floor risk only with exactly one scheduled day left, not 0 or 2', () => {
    // Week of 2026-01-05 (Mon) .. 01-11 (Sun). Boxing scheduled Mon/Tue/Wed/Fri = 05,06,07,09
    const makeData = (doneDates: string[]) => {
      const appData = baseAppData()
      const boxing = goalNamed(appData.goals, 'Boxing')
      appData.entries = doneDates.map((date) => ({ type: 'weekly_count', goalId: boxing.id, date, done: true }) as Entry)
      return appData
    }

    // Today = Wed 01-07, only Monday done (1/3 so far) -> 2 remaining (Wed itself unlogged + Fri) -> not urgent yet
    const twoRemaining = makeData(['2026-01-05'])
    expect(__testables.checkBoxingFloorRisk(twoRemaining, '2026-01-07')).toBeNull()

    // Today = Fri 01-09, Mon+Tue done (2), below floor of 3, exactly 1 remaining (today, Friday) -> fixable, flag
    const oneRemaining = makeData(['2026-01-05', '2026-01-06'])
    const flag = __testables.checkBoxingFloorRisk(oneRemaining, '2026-01-09')
    expect(flag?.id).toBe('boxing_floor_risk')

    // Today = Sat 01-10, week over, no scheduled days left at all -> too late to call "fixable", no flag
    const zeroRemaining = makeData(['2026-01-05', '2026-01-06'])
    expect(__testables.checkBoxingFloorRisk(zeroRemaining, '2026-01-10')).toBeNull()
  })

  it('flags scripture missed 3+ consecutive days', () => {
    const appData = baseAppData()
    // No entries at all for scripture since install -> every scheduled day before today fails
    const flag = __testables.checkScriptureStreak(appData, '2026-01-05')
    expect(flag?.id).toBe('scripture_streak_broken')
  })

  it('does not flag scripture if fewer than 3 consecutive misses', () => {
    const appData = baseAppData()
    const scripture = goalNamed(appData.goals, 'Scripture')
    const today = '2026-01-05'
    appData.entries = [
      { type: 'daily_duration', goalId: scripture.id, date: '2026-01-04', actualMinutes: 15 },
      { type: 'daily_duration', goalId: scripture.id, date: '2026-01-03', actualMinutes: 15 },
    ]
    expect(__testables.checkScriptureStreak(appData, today)).toBeNull()
  })

  it('flags scrolling rate up week-on-week, comparing the same elapsed-day window', () => {
    const appData = baseAppData()
    const scrolling = goalNamed(appData.goals, 'No scrolling')
    // This week (Jan 5 Mon..): 2 occurrences by Wednesday. Last week (Dec 29 Mon..): 0 by the same point.
    const today = '2026-01-07' // Wednesday, elapsed days Mon-Wed = 3
    appData.entries = [
      { type: 'inverted_binary', goalId: scrolling.id, date: '2026-01-05', occurred: true },
      { type: 'inverted_binary', goalId: scrolling.id, date: '2026-01-06', occurred: true },
    ]
    const flag = __testables.checkScrollingUp(appData, today)
    expect(flag?.id).toBe('scrolling_up')
    expect(flag?.message).toContain('2')
  })

  it('flags Thursday-evening bedtime drift only on Thursday evening with a worsening trend', () => {
    const appData = baseAppData()
    const sleep = goalNamed(appData.goals, 'Sleep')
    const thursday = '2026-01-08'
    appData.entries = [
      sleepEntry(sleep.id, '2026-01-06', '22:20'), // Tue: on time (default 23:00)
      sleepEntry(sleep.id, '2026-01-07', '23:10'), // Wed: 10 min late, worse than Tuesday
    ]
    const eveningMinutes = 19 * 60
    const flag = __testables.checkThursdayDrift(appData, thursday, eveningMinutes)
    expect(flag?.id).toBe('thursday_drift')

    const morningMinutes = 8 * 60
    expect(__testables.checkThursdayDrift(appData, thursday, morningMinutes)).toBeNull()
    expect(__testables.checkThursdayDrift(appData, '2026-01-07', eveningMinutes)).toBeNull() // not Thursday
  })

  it('never returns more than one flag: priority order picks the highest even when several conditions are true', () => {
    const appData = baseAppData()
    const sleep = goalNamed(appData.goals, 'Sleep')
    const boxing = goalNamed(appData.goals, 'Boxing')
    const today = '2026-01-09' // Friday

    // Bedtime 3 nights running late (highest priority)...
    appData.entries.push(
      sleepEntry(sleep.id, '2026-01-06', '23:20'),
      sleepEntry(sleep.id, '2026-01-07', '23:15'),
      sleepEntry(sleep.id, '2026-01-08', '23:30'),
    )
    // ...AND boxing floor risk simultaneously true (Mon+Tue done, Fri is the one remaining day)
    appData.entries.push(
      { type: 'weekly_count', goalId: boxing.id, date: '2026-01-05', done: true },
      { type: 'weekly_count', goalId: boxing.id, date: '2026-01-06', done: true },
    )

    const flag = evaluatePushbackFlags(appData, today)
    expect(flag?.id).toBe('bedtime_3_nights') // higher priority wins, boxing flag is suppressed
  })

  it('never flags a brand-new install: goals with activeFrom = today have no history to judge', () => {
    // Regression test: the scripture-streak scan used to walk backward with
    // no lower bound, running past the goal's activeFrom into dates where it
    // didn't exist yet (and, before a date-string zero-padding fix, wrapping
    // around after ~2000 iterations into single/double-digit years whose
    // unpadded string sorted "after" the real activeFrom, so it looked
    // "scheduled" again and falsely accumulated 3 fails).
    const t = '2026-03-01'
    const appData: AppData = {
      schemaVersion: 1,
      goals: buildSeedGoals(t),
      entries: [],
      settings: { theme: 'system' },
      meta: { installedAt: t },
    }
    expect(evaluatePushbackFlags(appData, t)).toBeNull()
  })

  it('returns null when nothing warrants a flag', () => {
    const appData = baseAppData()
    const scripture = goalNamed(appData.goals, 'Scripture')
    appData.entries = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04'].map((date) => ({
      type: 'daily_duration',
      goalId: scripture.id,
      date,
      actualMinutes: 15,
    }))
    expect(evaluatePushbackFlags(appData, '2026-01-04')).toBeNull()
  })
})

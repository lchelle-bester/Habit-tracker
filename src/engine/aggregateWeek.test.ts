import { describe, expect, it } from 'vitest'
import { aggregateWeek } from './aggregateWeek'
import type { Entry, Goal } from './types'

// Week of 2026-01-05 (Mon) .. 2026-01-11 (Sun). Boxing scheduled Mon/Tue/Wed/Fri = 05,06,07,09
function boxingGoal(): Goal & { type: 'weekly_count' } {
  return {
    id: 'boxing',
    name: 'Boxing',
    type: 'weekly_count',
    schedule: [1, 2, 3, 5],
    activeFrom: '2026-01-01',
    activeTo: null,
    archived: false,
    targetVersions: [{ id: 'v1', effectiveFrom: '2026-01-01', target: 4, floor: 3 }],
  }
}

function doneEntry(date: string): Entry {
  return { type: 'weekly_count', goalId: 'boxing', date, done: true }
}

describe('aggregateWeek (weekly_count)', () => {
  const weekStart = '2026-01-05'

  it('is "full" when count meets target', () => {
    const entries = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-09'].map(doneEntry)
    const agg = aggregateWeek(boxingGoal(), weekStart, entries, '2026-01-12')
    expect(agg.status).toBe('full')
    expect(agg.count).toBe(4)
  })

  it('is "floor" when count is exactly at the floor but below target', () => {
    const entries = ['2026-01-05', '2026-01-06', '2026-01-07'].map(doneEntry)
    const agg = aggregateWeek(boxingGoal(), weekStart, entries, '2026-01-12')
    expect(agg.status).toBe('floor')
  })

  it('is "pending" mid-week while the floor is still mathematically reachable', () => {
    // Only Monday done, but Tue/Wed/Fri remain scheduled and unlogged — floor of 3 still reachable
    const entries = [doneEntry('2026-01-05')]
    const agg = aggregateWeek(boxingGoal(), weekStart, entries, '2026-01-06') // "today" = Tuesday
    expect(agg.status).toBe('pending')
  })

  it('is "fail" once the floor can no longer be reached even before the week ends', () => {
    // By Friday (the last scheduled day), only Monday is done and today's Friday session isn't logged yet
    // count=1, remaining scheduled (Fri, today, unlogged) = 1 -> 1+1=2 < floor(3) -> fail
    const entries = [doneEntry('2026-01-05')]
    const agg = aggregateWeek(boxingGoal(), weekStart, entries, '2026-01-09')
    expect(agg.status).toBe('fail')
  })

  it('is "fail" once the week is fully over and floor was not met', () => {
    const entries = [doneEntry('2026-01-05'), doneEntry('2026-01-06')]
    const agg = aggregateWeek(boxingGoal(), weekStart, entries, '2026-01-13') // next week already
    expect(agg.status).toBe('fail')
  })
})

describe('aggregateWeek (weekly_duration)', () => {
  function readingGoal(): Goal & { type: 'weekly_duration' } {
    return {
      id: 'reading',
      name: 'Reading',
      type: 'weekly_duration',
      schedule: [0],
      activeFrom: '2026-01-01',
      activeTo: null,
      archived: false,
      targetVersions: [{ id: 'v1', effectiveFrom: '2026-01-01', targetMinutes: 30 }],
    }
  }

  it('stays "pending" before the single scheduled day of the week has been logged', () => {
    const agg = aggregateWeek(readingGoal(), '2026-01-05', [], '2026-01-08') // today = Thursday, Sunday not yet here
    expect(agg.status).toBe('pending')
  })

  it('is "fail" once the scheduled day has passed unlogged', () => {
    const agg = aggregateWeek(readingGoal(), '2026-01-05', [], '2026-01-13')
    expect(agg.status).toBe('fail')
  })
})

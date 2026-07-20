import { describe, expect, it } from 'vitest'
import { computeStreak } from './streaks'
import type { Entry, Goal } from './types'

function journalGoal(): Goal & { type: 'daily_binary' } {
  return {
    id: 'journal',
    name: 'Journal',
    type: 'daily_binary',
    schedule: [0, 1, 2, 3, 4, 5, 6],
    activeFrom: '2026-01-01',
    activeTo: null,
    archived: false,
    targetVersions: [{ id: 'v1', effectiveFrom: '2026-01-01' }],
  }
}

function scrollingGoal(): Goal & { type: 'inverted_binary' } {
  return {
    id: 'scrolling',
    name: 'No scrolling',
    type: 'inverted_binary',
    schedule: [0, 1, 2, 3, 4, 5, 6],
    activeFrom: '2026-01-01',
    activeTo: null,
    archived: false,
    targetVersions: [{ id: 'v1', effectiveFrom: '2026-01-01' }],
  }
}

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

describe('computeStreak', () => {
  it('returns null for inverted_binary, always', () => {
    const goal = scrollingGoal()
    const entries: Entry[] = [{ type: 'inverted_binary', goalId: 'scrolling', date: '2026-01-05', occurred: false }]
    expect(computeStreak(goal, entries, '2026-01-10')).toBeNull()
  })

  it('an unlogged today does not zero out the current daily streak', () => {
    const goal = journalGoal()
    const entries: Entry[] = ['2026-01-01', '2026-01-02', '2026-01-03'].map((date) => ({
      type: 'daily_binary',
      goalId: 'journal',
      date,
      done: true,
    }))
    const result = computeStreak(goal, entries, '2026-01-03') // today itself unlogged in this window's tail? no, 01-03 IS logged
    expect(result?.current).toBe(3)

    // now make today (01-04) genuinely unlogged and confirm it doesn't reset current to 0
    const result2 = computeStreak(goal, entries, '2026-01-04')
    expect(result2?.current).toBe(3)
  })

  it('a genuinely missed day breaks the current streak', () => {
    const goal = journalGoal()
    const entries: Entry[] = [
      { type: 'daily_binary', goalId: 'journal', date: '2026-01-01', done: true },
      { type: 'daily_binary', goalId: 'journal', date: '2026-01-02', done: false },
      { type: 'daily_binary', goalId: 'journal', date: '2026-01-03', done: true },
    ]
    const result = computeStreak(goal, entries, '2026-01-03')
    expect(result?.current).toBe(1)
    expect(result?.longest).toBe(1)
  })

  it('weekly streak: a "floor" week maintains the streak, only a "fail" week breaks it', () => {
    const goal = boxingGoal()
    // Week 1 (Jan 5-11): floor met (3 of 4). Week 2 (Jan 12-18): fail (only 1). Week 3 (Jan 19-25): full (4 of 4).
    const entries: Entry[] = [
      { type: 'weekly_count', goalId: 'boxing', date: '2026-01-05', done: true },
      { type: 'weekly_count', goalId: 'boxing', date: '2026-01-06', done: true },
      { type: 'weekly_count', goalId: 'boxing', date: '2026-01-07', done: true },
      { type: 'weekly_count', goalId: 'boxing', date: '2026-01-13', done: true },
      { type: 'weekly_count', goalId: 'boxing', date: '2026-01-19', done: true },
      { type: 'weekly_count', goalId: 'boxing', date: '2026-01-20', done: true },
      { type: 'weekly_count', goalId: 'boxing', date: '2026-01-21', done: true },
      { type: 'weekly_count', goalId: 'boxing', date: '2026-01-23', done: true },
    ]
    const result = computeStreak(goal, entries, '2026-01-26')
    expect(result?.current).toBe(1) // only week 3 (full) counts after week 2's fail broke the streak
    expect(result?.longest).toBe(1)
  })

  it('an in-progress current week does not reset the current streak to 0', () => {
    const goal = boxingGoal()
    const entries: Entry[] = [
      { type: 'weekly_count', goalId: 'boxing', date: '2026-01-05', done: true },
      { type: 'weekly_count', goalId: 'boxing', date: '2026-01-06', done: true },
      { type: 'weekly_count', goalId: 'boxing', date: '2026-01-07', done: true },
    ]
    // "today" is Tuesday of week 2 — week 2 is still pending, should be excluded, not counted as a break
    const result = computeStreak(goal, entries, '2026-01-13')
    expect(result?.current).toBe(1)
  })
})

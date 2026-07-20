import { describe, expect, it } from 'vitest'
import { clockTimeDeltaMinutes, evaluateDay } from './evaluateDay'
import type { Entry, Goal } from './types'

function sleepGoal(): Goal & { type: 'daily_time' } {
  return {
    id: 'sleep',
    name: 'Sleep',
    type: 'daily_time',
    schedule: [0, 1, 2, 3, 4, 5, 6],
    activeFrom: '2026-01-01',
    activeTo: null,
    archived: false,
    targetVersions: [{ id: 'v1', effectiveFrom: '2026-01-01', defaultTime: '23:00', overrides: { 4: '22:30' } }],
  }
}

function scriptureGoal(): Goal & { type: 'daily_duration' } {
  return {
    id: 'scripture',
    name: 'Scripture',
    type: 'daily_duration',
    schedule: [0, 1, 2, 3, 4, 5, 6],
    activeFrom: '2026-01-01',
    activeTo: null,
    archived: false,
    targetVersions: [{ id: 'v1', effectiveFrom: '2026-01-01', targetMinutes: 15 }],
  }
}

describe('clockTimeDeltaMinutes', () => {
  it('is positive (early/on-time) when actual is before an evening target', () => {
    expect(clockTimeDeltaMinutes('23:00', '22:45')).toBe(15)
  })
  it('is negative (late) when actual is after an evening target same night', () => {
    expect(clockTimeDeltaMinutes('23:00', '23:15')).toBe(-15)
  })
  it('treats an after-midnight actual as rolled past midnight relative to an evening target', () => {
    // 00:20 against a 23:00 target is ~65 minutes late, not "on time" because 00:20 is numerically small
    expect(clockTimeDeltaMinutes('23:00', '00:20')).toBe(-80)
  })
})

describe('evaluateDay', () => {
  const today = '2026-01-10'

  it('daily_time: passes on-time, fails late, using the Thursday override', () => {
    const goal = sleepGoal()
    const passEntry: Entry = { type: 'daily_time', goalId: 'sleep', date: '2026-01-07', actualTime: '22:20' } // Wed, default 23:00
    expect(evaluateDay(goal, passEntry, '2026-01-07', today)).toBe('pass')

    // 2026-01-08 is a Thursday; override target is 22:30
    const failEntry: Entry = { type: 'daily_time', goalId: 'sleep', date: '2026-01-08', actualTime: '22:45' }
    expect(evaluateDay(goal, failEntry, '2026-01-08', today)).toBe('fail')
    const passOnOverride: Entry = { type: 'daily_time', goalId: 'sleep', date: '2026-01-08', actualTime: '22:15' }
    expect(evaluateDay(goal, passOnOverride, '2026-01-08', today)).toBe('pass')
  })

  it('daily_time: unlogged today or future is pending, unlogged past day is fail', () => {
    const goal = sleepGoal()
    expect(evaluateDay(goal, undefined, today, today)).toBe('pending')
    expect(evaluateDay(goal, undefined, '2026-01-05', today)).toBe('fail')
    // Regression: a future day hasn't happened yet — it must never read as a
    // fail just because it's unlogged (this broke the Week view, which
    // evaluates the whole current week including days still ahead).
    expect(evaluateDay(goal, undefined, '2026-01-12', today)).toBe('pending')
  })

  it('daily_duration: pass at or above target, fail below', () => {
    const goal = scriptureGoal()
    const at: Entry = { type: 'daily_duration', goalId: 'scripture', date: '2026-01-05', actualMinutes: 15 }
    const below: Entry = { type: 'daily_duration', goalId: 'scripture', date: '2026-01-05', actualMinutes: 10 }
    expect(evaluateDay(goal, at, '2026-01-05', today)).toBe('pass')
    expect(evaluateDay(goal, below, '2026-01-05', today)).toBe('fail')
  })

  it('inverted_binary: absence of an entry is success for today-or-past, occurred is fail, and a future day is pending (not a premature pass)', () => {
    const goal: Goal & { type: 'inverted_binary' } = {
      id: 'scrolling',
      name: 'No scrolling',
      type: 'inverted_binary',
      schedule: [0, 1, 2, 3, 4, 5, 6],
      activeFrom: '2026-01-01',
      activeTo: null,
      archived: false,
      targetVersions: [{ id: 'v1', effectiveFrom: '2026-01-01' }],
    }
    expect(evaluateDay(goal, undefined, today, today)).toBe('pass')
    expect(evaluateDay(goal, undefined, '2026-01-05', today)).toBe('pass') // unlogged past day: clean by default
    const occurred: Entry = { type: 'inverted_binary', goalId: 'scrolling', date: today, occurred: true }
    expect(evaluateDay(goal, occurred, today, today)).toBe('fail')
    const notOccurred: Entry = { type: 'inverted_binary', goalId: 'scrolling', date: today, occurred: false }
    expect(evaluateDay(goal, notOccurred, today, today)).toBe('pass')
    // Regression: a future day hadn't happened yet — it must not already
    // count as a "clean" pass (this inflated Patterns completion-rate charts
    // to 100% for a goal with zero real history).
    expect(evaluateDay(goal, undefined, '2026-01-12', today)).toBe('pending')
  })

  it('returns not_scheduled outside the weekday schedule or activeFrom/activeTo range', () => {
    const goal = scriptureGoal()
    goal.schedule = [1, 2, 3, 5] // no Sunday
    expect(evaluateDay(goal, undefined, '2026-01-11', today)).toBe('not_scheduled') // a Sunday
    goal.activeTo = '2026-01-03'
    expect(evaluateDay(goal, undefined, '2026-01-05', today)).toBe('not_scheduled')
  })
})

import type { Goal, LogEntry } from '../types';
import { addDays, compareISO, datesInRange, startOfWeek, todayISO } from './date';
import { evaluateDay, evaluateWeek } from './evaluate';
import { isScheduledOn } from './schedule';

export interface StreakResult {
  current: number;
  longest: number;
}

const EMPTY: StreakResult = { current: 0, longest: 0 };

/** Current and longest runs for positive goals. inverted_binary is excluded
 * by design — the spec is explicit: no streaks, ever, for a negative goal. */
export function computeStreak(goal: Goal, logs: LogEntry[]): StreakResult {
  if (goal.type === 'inverted_binary') return EMPTY;
  if (goal.type === 'weekly_count' || goal.type === 'weekly_duration') {
    return computeWeeklyStreak(goal, logs);
  }
  return computeDailyStreak(goal, logs);
}

function computeDailyStreak(goal: Goal, logs: LogEntry[]): StreakResult {
  const today = todayISO();
  const from = goal.activeFrom;
  const to = compareISO(goal.activeTo ?? today, today) < 0 ? goal.activeTo! : today;
  if (compareISO(from, to) > 0) return EMPTY;

  const evaluated: Array<'pass' | 'fail'> = [];
  for (const date of datesInRange(from, to)) {
    if (!isScheduledOn(goal, date)) continue;
    const status = evaluateDay(goal, date, logs);
    if (status === 'pending' || status === 'not_scheduled') continue;
    evaluated.push(status === 'pass' ? 'pass' : 'fail');
  }

  let longest = 0;
  let run = 0;
  for (const s of evaluated) {
    if (s === 'pass') {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  let current = 0;
  for (let i = evaluated.length - 1; i >= 0; i -= 1) {
    if (evaluated[i] === 'pass') current += 1;
    else break;
  }

  return { current, longest };
}

function computeWeeklyStreak(goal: Goal, logs: LogEntry[]): StreakResult {
  const today = todayISO();
  const from = startOfWeek(goal.activeFrom);
  const currentWeekStart = startOfWeek(today);

  const weeks: Array<'pass' | 'fail' | 'pending'> = [];
  let cursor = from;
  while (compareISO(cursor, currentWeekStart) <= 0) {
    const evalResult = evaluateWeek(goal, cursor, logs);
    if (evalResult && evalResult.scheduledDates.length > 0) {
      if (evalResult.status === 'pass' || evalResult.status === 'floor') weeks.push('pass');
      else if (evalResult.status === 'pending') weeks.push('pending');
      else weeks.push('fail');
    }
    cursor = addDays(cursor, 7);
  }

  let longest = 0;
  let run = 0;
  for (const w of weeks) {
    if (w === 'pass') {
      run += 1;
      longest = Math.max(longest, run);
    } else if (w === 'fail') {
      run = 0;
    }
    // pending weeks don't break or extend the run
  }

  let current = 0;
  for (let i = weeks.length - 1; i >= 0; i -= 1) {
    if (weeks[i] === 'pending') continue;
    if (weeks[i] === 'pass') current += 1;
    else break;
  }

  return { current, longest };
}

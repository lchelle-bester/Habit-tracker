import type { Goal, LogEntry } from '../types/goal';
import { addDays, dateRange, weekStart } from '../utils/date';
import { evaluateDay, evaluateWeek, isActiveOn, isPositiveGoal } from './goalEngine';

export interface RunResult {
  current: number;
  longest: number;
  unit: 'days' | 'weeks';
}

function dailyRun(goal: Goal, logs: LogEntry[], todayISO: string): RunResult {
  const start = goal.activeFrom;
  const end = todayISO < (goal.activeTo ?? todayISO) ? todayISO : (goal.activeTo ?? todayISO);
  const days = dateRange(start, end);

  let longest = 0;
  let running = 0;
  for (const d of days) {
    const r = evaluateDay(goal, d, logs, todayISO);
    if (r.status === 'not_scheduled' || r.status === 'inactive') continue;
    if (r.status === 'pass') {
      running += 1;
      longest = Math.max(longest, running);
    } else if (r.status === 'pending') {
      // today, not yet logged — doesn't break or extend the run
    } else {
      running = 0;
    }
  }

  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const d = days[i];
    const r = evaluateDay(goal, d, logs, todayISO);
    if (r.status === 'not_scheduled' || r.status === 'inactive') continue;
    if (r.status === 'pending') continue;
    if (r.status === 'pass') current += 1;
    else break;
  }

  return { current, longest, unit: 'days' };
}

function weeklyRun(goal: Goal, logs: LogEntry[], todayISO: string): RunResult {
  const firstWeek = weekStart(goal.activeFrom);
  const lastWeek = weekStart(todayISO);
  const weeks: string[] = [];
  let cur = firstWeek;
  while (cur <= lastWeek) {
    weeks.push(cur);
    cur = addDays(cur, 7);
  }

  const results = weeks.map((w) => evaluateWeek(goal, w, logs, todayISO)).filter((r): r is NonNullable<typeof r> => !!r);

  let longest = 0;
  let running = 0;
  for (const r of results) {
    if (r.status === 'pass' || r.status === 'floor') {
      running += 1;
      longest = Math.max(longest, running);
    } else if (r.status === 'in_progress') {
      // current week, not resolved yet
    } else {
      running = 0;
    }
  }

  let current = 0;
  for (let i = results.length - 1; i >= 0; i--) {
    const r = results[i];
    if (r.status === 'in_progress') continue;
    if (r.status === 'pass' || r.status === 'floor') current += 1;
    else break;
  }

  return { current, longest, unit: 'weeks' };
}

export function computeRun(goal: Goal, logs: LogEntry[], todayISO: string): RunResult | null {
  if (!isPositiveGoal(goal)) return null;
  if (!isActiveOn(goal, todayISO) && todayISO < goal.activeFrom) return null;
  if (goal.type === 'weekly_count' || goal.type === 'weekly_duration') {
    return weeklyRun(goal, logs, todayISO);
  }
  return dailyRun(goal, logs, todayISO);
}

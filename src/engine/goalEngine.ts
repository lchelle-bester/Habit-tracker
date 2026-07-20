import type { Goal, GoalVersion, LogEntry, LogValue, Weekday } from '../types/goal';
import { isoWeekday, timeDeltaMinutes, weekEnd, weekStart, dateRange } from '../utils/date';

export function versionForDate(goal: Goal, date: string): GoalVersion | null {
  let found: GoalVersion | null = null;
  for (const v of goal.versions) {
    if (v.effectiveFrom <= date) found = v;
    else break;
  }
  return found;
}

export function isActiveOn(goal: Goal, date: string): boolean {
  if (date < goal.activeFrom) return false;
  if (goal.activeTo && date > goal.activeTo) return false;
  return true;
}

export function isScheduledOn(goal: Goal, date: string): boolean {
  if (!isActiveOn(goal, date)) return false;
  const version = versionForDate(goal, date);
  if (!version) return false;
  return version.schedule.includes(isoWeekday(date));
}

export function logFor(goalId: string, date: string, logs: LogEntry[]): LogEntry | undefined {
  return logs.find((l) => l.goalId === goalId && l.date === date);
}

export function logsFor(goalId: string, logs: LogEntry[]): LogEntry[] {
  return logs.filter((l) => l.goalId === goalId);
}

/** Target clock time for daily_time goals, honoring per-weekday overrides. */
export function targetTimeFor(version: GoalVersion, date: string): string {
  if (version.config.kind !== 'daily_time') throw new Error('not a daily_time goal');
  const wd = isoWeekday(date);
  return version.config.overrides?.[wd] ?? version.config.time;
}

export type DayStatus = 'pass' | 'fail' | 'floor' | 'pending' | 'not_scheduled' | 'inactive';

export interface DayResult {
  date: string;
  goalId: string;
  status: DayStatus;
  /** minutes late (daily_time), minutes logged (durations), etc. */
  detail?: number;
  occurred?: boolean; // inverted_binary
  time?: string; // inverted_binary, time of slip
}

/**
 * Evaluate a single calendar day for a goal. For weekly_count / weekly_duration
 * this reflects only that day's log (done or not), not the week's aggregate —
 * use evaluateWeek for the rollup.
 */
export function evaluateDay(goal: Goal, date: string, logs: LogEntry[], todayISO: string): DayResult {
  if (!isActiveOn(goal, date)) return { date, goalId: goal.id, status: 'inactive' };
  const version = versionForDate(goal, date);
  if (!version) return { date, goalId: goal.id, status: 'inactive' };
  const scheduled = version.schedule.includes(isoWeekday(date));
  const log = logFor(goal.id, date, logs);
  const isToday = date === todayISO;
  const isFuture = date > todayISO;

  if (goal.type === 'inverted_binary') {
    // Success is absence: no log, or a log explicitly marking non-occurrence, both pass.
    if (!scheduled) return { date, goalId: goal.id, status: 'not_scheduled' };
    if (isFuture) return { date, goalId: goal.id, status: 'pending' };
    if (log && log.value.kind === 'inverted_binary' && log.value.occurred) {
      return { date, goalId: goal.id, status: 'fail', occurred: true, time: log.value.time };
    }
    return { date, goalId: goal.id, status: 'pass', occurred: false };
  }

  if (!scheduled) return { date, goalId: goal.id, status: 'not_scheduled' };
  if (isFuture) return { date, goalId: goal.id, status: 'pending' };

  if (!log) {
    return { date, goalId: goal.id, status: isToday ? 'pending' : 'fail' };
  }

  switch (goal.type) {
    case 'weekly_count': {
      if (log.value.kind !== 'weekly_count') break;
      return { date, goalId: goal.id, status: log.value.done ? 'pass' : 'fail' };
    }
    case 'daily_time': {
      if (log.value.kind !== 'daily_time') break;
      const target = targetTimeFor(version, date);
      const delta = timeDeltaMinutes(target, log.value.actual);
      return { date, goalId: goal.id, status: delta <= 0 ? 'pass' : 'fail', detail: delta };
    }
    case 'daily_duration': {
      if (log.value.kind !== 'daily_duration') break;
      if (version.config.kind !== 'daily_duration') break;
      const ok = log.value.minutes >= version.config.minutes;
      return { date, goalId: goal.id, status: ok ? 'pass' : 'fail', detail: log.value.minutes };
    }
    case 'daily_binary': {
      if (log.value.kind !== 'daily_binary') break;
      return { date, goalId: goal.id, status: log.value.done ? 'pass' : 'fail' };
    }
    case 'weekly_duration': {
      if (log.value.kind !== 'weekly_duration') break;
      return { date, goalId: goal.id, status: log.value.minutes > 0 ? 'pass' : 'fail', detail: log.value.minutes };
    }
  }
  return { date, goalId: goal.id, status: 'pending' };
}

export interface WeekResult {
  weekStart: string;
  weekEnd: string;
  goalId: string;
  scheduledDates: string[];
  count: number; // occurrences (weekly_count) or minutes (weekly_duration)
  target: number;
  floor: number; // equals target when goal type has no floor concept
  status: 'pass' | 'floor' | 'fail' | 'in_progress';
  remainingScheduled: string[]; // scheduled dates that are still today-or-future
}

export function evaluateWeek(goal: Goal, anyDateInWeek: string, logs: LogEntry[], todayISO: string): WeekResult | null {
  if (goal.type !== 'weekly_count' && goal.type !== 'weekly_duration') return null;
  const ws = weekStart(anyDateInWeek);
  const we = weekEnd(anyDateInWeek);
  const scheduledDates = dateRange(ws, we).filter((d) => isScheduledOn(goal, d));

  let count = 0;
  let target = 0;
  let floor = 0;
  for (const d of scheduledDates) {
    const version = versionForDate(goal, d);
    if (!version) continue;
    if (version.config.kind === 'weekly_count') {
      target = version.config.target;
      floor = version.config.floor;
      const log = logFor(goal.id, d, logs);
      if (log?.value.kind === 'weekly_count' && log.value.done) count += 1;
    } else if (version.config.kind === 'weekly_duration') {
      target = version.config.minutes;
      floor = version.config.minutes;
      const log = logFor(goal.id, d, logs);
      if (log?.value.kind === 'weekly_duration') count += log.value.minutes;
    }
  }

  const remainingScheduled = scheduledDates.filter((d) => d >= todayISO);
  const weekClosed = we < todayISO;

  let status: WeekResult['status'];
  if (count >= target) status = 'pass';
  else if (count >= floor && floor < target) status = 'floor';
  else if (weekClosed) status = 'fail';
  else status = 'in_progress';

  return { weekStart: ws, weekEnd: we, goalId: goal.id, scheduledDates, count, target, floor, status, remainingScheduled };
}

export function emptyLogValue(goal: Goal): LogValue {
  switch (goal.type) {
    case 'weekly_count':
      return { kind: 'weekly_count', done: true };
    case 'daily_time':
      return { kind: 'daily_time', actual: '23:00' };
    case 'daily_duration':
      return { kind: 'daily_duration', minutes: 0 };
    case 'daily_binary':
      return { kind: 'daily_binary', done: true };
    case 'weekly_duration':
      return { kind: 'weekly_duration', minutes: 0 };
    case 'inverted_binary':
      return { kind: 'inverted_binary', occurred: true };
  }
}

export function isPositiveGoal(goal: Goal): boolean {
  return goal.type !== 'inverted_binary';
}

/** Weekdays (7 slots) — true if goal is scheduled on that weekday under its current version. */
export function currentSchedule(goal: Goal): Weekday[] {
  const latest = goal.versions[goal.versions.length - 1];
  return latest ? latest.schedule : [];
}

export function currentConfig(goal: Goal) {
  const latest = goal.versions[goal.versions.length - 1];
  return latest ? latest.config : null;
}

import type { Goal, LogEntry } from '../types';
import { addDays, compareISO, endOfWeek, startOfWeek, timeToMinutes, todayISO } from './date';
import { isScheduledOn } from './schedule';
import { targetForDate } from './targets';

export type DayStatus = 'pass' | 'floor' | 'fail' | 'pending' | 'not_scheduled';

export function logFor(logs: LogEntry[], goalId: string, date: string): LogEntry | undefined {
  return logs.find((l) => l.goalId === goalId && l.date === date);
}

export function logsForGoal(logs: LogEntry[], goalId: string): LogEntry[] {
  return logs.filter((l) => l.goalId === goalId);
}

export function timeTargetForDate(goal: Goal, date: string): string | undefined {
  const t = targetForDate(goal, date);
  if (!t || t.value.type !== 'daily_time') return undefined;
  const wd = new Date(date).getDay();
  return t.value.overrides?.[wd as 0 | 1 | 2 | 3 | 4 | 5 | 6] ?? t.value.time;
}

/**
 * Evaluate a single date for a daily-granularity goal (daily_binary,
 * daily_duration, daily_time, inverted_binary). Weekly goals should use
 * evaluateWeek instead — daily status for them only reflects whether a
 * session/log was recorded that day, not pass/fail.
 */
export function evaluateDay(goal: Goal, date: string, logs: LogEntry[]): DayStatus {
  if (!isScheduledOn(goal, date)) return 'not_scheduled';
  const target = targetForDate(goal, date);
  if (!target) return 'not_scheduled';
  const log = logFor(logs, goal.id, date);
  const isFuture = compareISO(date, todayISO()) > 0;
  const isToday = date === todayISO();

  switch (goal.type) {
    case 'daily_binary': {
      if (log?.done) return 'pass';
      if (isFuture || isToday) return 'pending';
      return 'fail';
    }
    case 'daily_duration': {
      if (target.value.type !== 'daily_duration') return 'not_scheduled';
      if (log && log.minutes !== undefined) {
        return log.minutes >= target.value.minutes ? 'pass' : 'fail';
      }
      return isFuture || isToday ? 'pending' : 'fail';
    }
    case 'daily_time': {
      const targetTime = timeTargetForDate(goal, date);
      if (!targetTime) return 'not_scheduled';
      if (log?.time) {
        return timeToMinutes(log.time) <= timeToMinutes(targetTime) ? 'pass' : 'fail';
      }
      return isFuture || isToday ? 'pending' : 'fail';
    }
    case 'inverted_binary': {
      // Absence of a log is success. Only an explicit incident count > 0 fails.
      const count = log?.count ?? 0;
      if (count > 0) return 'fail';
      return isFuture ? 'pending' : 'pass';
    }
    default:
      return 'not_scheduled';
  }
}

export interface WeekEvaluation {
  weekStart: string;
  weekEnd: string;
  scheduledDates: string[];
  actual: number; // sessions done, or minutes logged
  target: number;
  floor?: number;
  status: DayStatus; // pass / floor / fail / pending
  isComplete: boolean; // week has fully elapsed
}

/** Evaluate the week containing `date` for a weekly_count or weekly_duration goal. */
export function evaluateWeek(goal: Goal, date: string, logs: LogEntry[]): WeekEvaluation | null {
  if (goal.type !== 'weekly_count' && goal.type !== 'weekly_duration') return null;
  const weekStart = startOfWeek(date);
  const weekEnd = endOfWeek(date);
  const target = targetForDate(goal, weekStart) ?? targetForDate(goal, date);
  const scheduledDates: string[] = [];
  for (let d = weekStart; compareISO(d, weekEnd) <= 0; d = addDays(d, 1)) {
    if (isScheduledOn(goal, d)) scheduledDates.push(d);
  }

  let actual = 0;
  if (goal.type === 'weekly_count') {
    actual = scheduledDates.filter((d) => logFor(logs, goal.id, d)?.done).length;
  } else {
    actual = scheduledDates.reduce((sum, d) => sum + (logFor(logs, goal.id, d)?.minutes ?? 0), 0);
  }

  const targetValue =
    target?.value.type === 'weekly_count'
      ? target.value.count
      : target?.value.type === 'weekly_duration'
        ? target.value.minutes
        : 0;
  const floor = target?.value.type === 'weekly_count' ? target.value.floor : undefined;

  const today = todayISO();
  const isComplete = compareISO(weekEnd, today) < 0;
  const remainingScheduled = scheduledDates.filter((d) => compareISO(d, today) > 0).length;

  let status: DayStatus;
  if (actual >= targetValue) status = 'pass';
  else if (floor !== undefined && actual >= floor) status = 'floor';
  else if (!isComplete && (remainingScheduled > 0 || compareISO(weekEnd, today) >= 0)) status = 'pending';
  else status = 'fail';

  return { weekStart, weekEnd, scheduledDates, actual, target: targetValue, floor, status, isComplete };
}

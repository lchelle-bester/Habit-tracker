import type { Goal, LogEntry } from '../types';
import { addDays, compareISO, datesInRange, getWeekday, startOfWeek, timeToMinutes, todayISO } from './date';
import { evaluateDay, evaluateWeek, logFor, timeTargetForDate } from './evaluate';
import { isScheduledOn } from './schedule';
import { computeStreak, type StreakResult } from './streaks';

export function earliestActiveFrom(goals: Goal[]): string {
  if (goals.length === 0) return todayISO();
  return goals.reduce((min, g) => (compareISO(g.activeFrom, min) < 0 ? g.activeFrom : min), goals[0].activeFrom);
}

export interface SleepDeltaPoint {
  date: string;
  delta: number | null; // minutes late (+) or early (-); null if unlogged
}

export function sleepDeltaSeries(goal: Goal, logs: LogEntry[], days: number): SleepDeltaPoint[] {
  const today = todayISO();
  const from = addDays(today, -(days - 1));
  return datesInRange(from, today).map((date) => {
    if (!isScheduledOn(goal, date)) return { date, delta: null };
    const log = logFor(logs, goal.id, date);
    const targetTime = timeTargetForDate(goal, date);
    if (!log?.time || !targetTime) return { date, delta: null };
    return { date, delta: timeToMinutes(log.time) - timeToMinutes(targetTime) };
  });
}

/** For each non-sleep, non-inverted goal, which of the given dates failed —
 * used to overlay against the sleep line so the leading-indicator relationship is visible. */
export function overlayFailMarks(
  goals: Goal[],
  logs: LogEntry[],
  dates: string[]
): Array<{ goal: Goal; fails: boolean[] }> {
  const overlayGoals = goals.filter((g) => g.type !== 'daily_time' && !g.archived);
  return overlayGoals.map((goal) => ({
    goal,
    fails: dates.map((date) => {
      if (goal.type === 'weekly_count' || goal.type === 'weekly_duration') {
        if (!isScheduledOn(goal, date)) return false;
        const log = logFor(logs, goal.id, date);
        const has = goal.type === 'weekly_count' ? !!log?.done : (log?.minutes ?? 0) > 0;
        return !has && compareISO(date, todayISO()) < 0;
      }
      const status = evaluateDay(goal, date, logs);
      return status === 'fail';
    }),
  }));
}

export interface BedTimeCorrelation {
  onTargetRate: number | null; // 0-1
  lateRate: number | null;
  onTargetN: number;
  lateN: number;
}

/** Completion rate on days following an on-target vs a late bed time. */
export function bedTimeCorrelation(sleepGoal: Goal, otherGoals: Goal[], logs: LogEntry[]): BedTimeCorrelation {
  const today = todayISO();
  const from = addDays(sleepGoal.activeFrom, 1);
  let onTargetSum = 0;
  let onTargetN = 0;
  let lateSum = 0;
  let lateN = 0;

  const trackable = otherGoals.filter((g) => g.type !== 'weekly_count' && g.type !== 'weekly_duration');

  for (const date of datesInRange(from, today)) {
    const prev = addDays(date, -1);
    if (!isScheduledOn(sleepGoal, prev)) continue;
    const prevStatus = evaluateDay(sleepGoal, prev, logs);
    if (prevStatus !== 'pass' && prevStatus !== 'fail') continue;

    const scheduledToday = trackable.filter((g) => isScheduledOn(g, date));
    if (scheduledToday.length === 0) continue;
    const passes = scheduledToday.filter((g) => {
      const s = evaluateDay(g, date, logs);
      return s === 'pass' || s === 'floor';
    }).length;
    const rate = passes / scheduledToday.length;

    if (prevStatus === 'pass') {
      onTargetSum += rate;
      onTargetN += 1;
    } else {
      lateSum += rate;
      lateN += 1;
    }
  }

  return {
    onTargetRate: onTargetN > 0 ? onTargetSum / onTargetN : null,
    lateRate: lateN > 0 ? lateSum / lateN : null,
    onTargetN,
    lateN,
  };
}

/** Fail rate per weekday (0=Sun..6=Sat) across all history for a goal. */
export function dayOfWeekFailRates(goal: Goal, logs: LogEntry[]): number[] {
  const today = todayISO();
  const scheduled: number[] = [0, 0, 0, 0, 0, 0, 0];
  const failed: number[] = [0, 0, 0, 0, 0, 0, 0];
  const isWeekly = goal.type === 'weekly_count' || goal.type === 'weekly_duration';

  for (const date of datesInRange(goal.activeFrom, today)) {
    if (!isScheduledOn(goal, date) || date === today) continue;
    const wd = getWeekday(date);
    scheduled[wd] += 1;
    if (isWeekly) {
      const log = logFor(logs, goal.id, date);
      const has = goal.type === 'weekly_count' ? !!log?.done : (log?.minutes ?? 0) > 0;
      if (!has) failed[wd] += 1;
    } else {
      const status = evaluateDay(goal, date, logs);
      if (status === 'fail') failed[wd] += 1;
    }
  }

  return scheduled.map((n, i) => (n > 0 ? failed[i] / n : 0));
}

export interface DayCount {
  date: string;
  count: number;
}

export function incidenceByDay(goal: Goal, logs: LogEntry[], days: number): DayCount[] {
  const today = todayISO();
  const from = addDays(today, -(days - 1));
  return datesInRange(from, today).map((date) => ({ date, count: logFor(logs, goal.id, date)?.count ?? 0 }));
}

/** Incident counts bucketed into 4 parts of the day, from any logged timesOfDay. */
export function incidenceByTimeOfDay(goal: Goal, logs: LogEntry[]): Array<{ label: string; count: number }> {
  const buckets = [
    { label: 'night', from: 0, to: 6, count: 0 },
    { label: 'morning', from: 6, to: 12, count: 0 },
    { label: 'afternoon', from: 12, to: 18, count: 0 },
    { label: 'evening', from: 18, to: 24, count: 0 },
  ];
  for (const log of logs) {
    if (log.goalId !== goal.id) continue;
    for (const t of log.timesOfDay ?? []) {
      const hour = Number(t.split(':')[0]);
      const bucket = buckets.find((b) => hour >= b.from && hour < b.to);
      if (bucket) bucket.count += 1;
    }
  }
  return buckets.map((b) => ({ label: b.label, count: b.count }));
}

export interface WeeklyCompletionPoint {
  weekStart: string;
  rate: number | null;
}

/** 8-week rolling completion rate for a goal (fraction of scheduled days/target met per week). */
export function weeklyCompletionTrend(goal: Goal, logs: LogEntry[], weeks: number): WeeklyCompletionPoint[] {
  const today = todayISO();
  const thisWeekStart = startOfWeek(today);
  const points: WeeklyCompletionPoint[] = [];

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const weekStart = addDays(thisWeekStart, -7 * i);
    if (goal.type === 'weekly_count' || goal.type === 'weekly_duration') {
      const week = evaluateWeek(goal, weekStart, logs);
      if (!week || week.scheduledDates.length === 0) {
        points.push({ weekStart, rate: null });
      } else {
        points.push({ weekStart, rate: Math.min(1, week.actual / Math.max(1, week.target)) });
      }
      continue;
    }
    let scheduled = 0;
    let passed = 0;
    for (let d = 0; d < 7; d += 1) {
      const date = addDays(weekStart, d);
      if (compareISO(date, today) > 0) continue;
      if (!isScheduledOn(goal, date)) continue;
      scheduled += 1;
      const status = evaluateDay(goal, date, logs);
      if (status === 'pass' || status === 'floor') passed += 1;
    }
    points.push({ weekStart, rate: scheduled > 0 ? passed / scheduled : null });
  }
  return points;
}

export interface BoxingWeekPoint {
  weekStart: string;
  sessions: number;
  avgSleepDelta: number | null;
}

export function boxingVsSleep(boxingGoal: Goal, sleepGoal: Goal | undefined, logs: LogEntry[], weeks: number): BoxingWeekPoint[] {
  const today = todayISO();
  const thisWeekStart = startOfWeek(today);
  const points: BoxingWeekPoint[] = [];

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const weekStart = addDays(thisWeekStart, -7 * i);
    const week = evaluateWeek(boxingGoal, weekStart, logs);
    const sessions = week?.actual ?? 0;

    let avgSleepDelta: number | null = null;
    if (sleepGoal) {
      const deltas: number[] = [];
      for (let d = 0; d < 7; d += 1) {
        const date = addDays(weekStart, d);
        if (compareISO(date, today) > 0) continue;
        if (!isScheduledOn(sleepGoal, date)) continue;
        const log = logFor(logs, sleepGoal.id, date);
        const targetTime = timeTargetForDate(sleepGoal, date);
        if (log?.time && targetTime) deltas.push(timeToMinutes(log.time) - timeToMinutes(targetTime));
      }
      if (deltas.length > 0) avgSleepDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    }

    points.push({ weekStart, sessions, avgSleepDelta });
  }
  return points;
}

export interface GoalStreak {
  goal: Goal;
  streak: StreakResult;
}

export function allStreaks(goals: Goal[], logs: LogEntry[]): GoalStreak[] {
  return goals
    .filter((g) => g.type !== 'inverted_binary' && !g.archived)
    .map((g) => ({ goal: g, streak: computeStreak(g, logs) }));
}

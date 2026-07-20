import type { Goal, LogEntry, Weekday } from '../types/goal';
import { WEEKDAYS } from '../types/goal';
import { addDays, dateRange, isoWeekday, weekStart } from '../utils/date';
import { evaluateDay, evaluateWeek, isScheduledOn, logFor } from './goalEngine';

export interface SleepDeltaPoint {
  date: string;
  delta: number | null; // minutes late; null = not logged / not scheduled
  others: { goalId: string; pass: boolean | null }[];
}

export function sleepDeltaSeries(sleepGoal: Goal, otherGoals: Goal[], logs: LogEntry[], days: number, todayISO: string): SleepDeltaPoint[] {
  const start = addDays(todayISO, -(days - 1));
  return dateRange(start, todayISO).map((d) => {
    const r = evaluateDay(sleepGoal, d, logs, todayISO);
    const delta = r.status === 'pass' || r.status === 'fail' ? (r.detail ?? 0) : null;
    const others = otherGoals.map((g) => {
      const rr = evaluateDay(g, d, logs, todayISO);
      return { goalId: g.id, pass: rr.status === 'pass' ? true : rr.status === 'fail' ? false : null };
    });
    return { date: d, delta, others };
  });
}

export interface Correlation {
  onTimeRate: number | null;
  lateRate: number | null;
  onTimeN: number;
  lateN: number;
}

/** Completion rate on the day following an on-target vs. a late bed time. */
export function bedtimeCorrelation(sleepGoal: Goal, otherGoals: Goal[], logs: LogEntry[], todayISO: string): Correlation {
  const start = sleepGoal.activeFrom;
  let onTimeSum = 0;
  let onTimeN = 0;
  let lateSum = 0;
  let lateN = 0;

  for (const d of dateRange(start, addDays(todayISO, -1))) {
    const sleepR = evaluateDay(sleepGoal, d, logs, todayISO);
    if (sleepR.status !== 'pass' && sleepR.status !== 'fail') continue;
    const nextDay = addDays(d, 1);
    let scheduled = 0;
    let passed = 0;
    for (const g of otherGoals) {
      const rr = evaluateDay(g, nextDay, logs, todayISO);
      if (rr.status === 'pass' || rr.status === 'fail') {
        scheduled += 1;
        if (rr.status === 'pass') passed += 1;
      }
    }
    if (scheduled === 0) continue;
    const rate = passed / scheduled;
    if (sleepR.status === 'pass') {
      onTimeSum += rate;
      onTimeN += 1;
    } else {
      lateSum += rate;
      lateN += 1;
    }
  }

  return {
    onTimeRate: onTimeN ? Math.round((onTimeSum / onTimeN) * 100) : null,
    lateRate: lateN ? Math.round((lateSum / lateN) * 100) : null,
    onTimeN,
    lateN,
  };
}

/** Failure rate per weekday (0-100), over all resolved scheduled days in the goal's history. */
export function dayOfWeekFailureRates(goal: Goal, logs: LogEntry[], todayISO: string): Record<Weekday, number | null> {
  const totals: Record<Weekday, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  const fails: Record<Weekday, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };

  for (const d of dateRange(goal.activeFrom, todayISO)) {
    const r = evaluateDay(goal, d, logs, todayISO);
    if (r.status !== 'pass' && r.status !== 'fail') continue;
    const wd = isoWeekday(d);
    totals[wd] += 1;
    if (r.status === 'fail') fails[wd] += 1;
  }

  const out = {} as Record<Weekday, number | null>;
  for (const wd of WEEKDAYS) {
    out[wd] = totals[wd] > 0 ? Math.round((fails[wd] / totals[wd]) * 100) : null;
  }
  return out;
}

export interface ScrollingIncidence {
  byWeekday: Record<Weekday, number>;
  byHour: number[]; // 24 buckets, only counts entries with a logged time
  totalLogged: number;
  totalWithTime: number;
}

export function scrollingIncidence(goal: Goal, logs: LogEntry[]): ScrollingIncidence {
  const byWeekday: Record<Weekday, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  const byHour = new Array(24).fill(0);
  let totalLogged = 0;
  let totalWithTime = 0;

  for (const l of logs) {
    if (l.goalId !== goal.id || l.value.kind !== 'inverted_binary' || !l.value.occurred) continue;
    totalLogged += 1;
    byWeekday[isoWeekday(l.date)] += 1;
    if (l.value.time) {
      const hour = Number(l.value.time.split(':')[0]);
      byHour[hour] += 1;
      totalWithTime += 1;
    }
  }

  return { byWeekday, byHour, totalLogged, totalWithTime };
}

export interface WeekPoint {
  weekStart: string;
  rate: number | null; // 0-100
}

/** 8-week (default) rolling completion trend, most recent week last. */
export function weeklyCompletionTrend(goal: Goal, logs: LogEntry[], todayISO: string, weeks = 8): WeekPoint[] {
  const points: WeekPoint[] = [];
  const currentWeekStart = weekStart(todayISO);

  for (let i = weeks - 1; i >= 0; i--) {
    const ws = addDays(currentWeekStart, -7 * i);
    if (ws < weekStart(goal.activeFrom)) {
      points.push({ weekStart: ws, rate: null });
      continue;
    }
    if (goal.type === 'weekly_count' || goal.type === 'weekly_duration') {
      const w = evaluateWeek(goal, ws, logs, todayISO);
      points.push({ weekStart: ws, rate: w && w.target > 0 ? Math.min(100, Math.round((w.count / w.target) * 100)) : null });
    } else {
      const days = dateRange(ws, addDays(ws, 6));
      let total = 0;
      let pass = 0;
      for (const d of days) {
        const r = evaluateDay(goal, d, logs, todayISO);
        if (r.status !== 'pass' && r.status !== 'fail') continue;
        total += 1;
        if (r.status === 'pass') pass += 1;
      }
      points.push({ weekStart: ws, rate: total > 0 ? Math.round((pass / total) * 100) : null });
    }
  }
  return points;
}

export interface BoxingSleekPoint {
  weekStart: string;
  sessions: number;
  avgSleepDelta: number | null;
}

export function boxingVsSleep(boxingGoal: Goal, sleepGoal: Goal, logs: LogEntry[], todayISO: string, weeks = 12): BoxingSleekPoint[] {
  const currentWeekStart = weekStart(todayISO);
  const points: BoxingSleekPoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const ws = addDays(currentWeekStart, -7 * i);
    const we = addDays(ws, 6);
    const week = evaluateWeek(boxingGoal, ws, logs, todayISO);
    const sessions = week ? week.count : 0;

    let sum = 0;
    let n = 0;
    for (const d of dateRange(ws, we)) {
      const log = logFor(sleepGoal.id, d, logs);
      if (!log || log.value.kind !== 'daily_time') continue;
      const r = evaluateDay(sleepGoal, d, logs, todayISO);
      if (r.detail !== undefined) {
        sum += r.detail;
        n += 1;
      }
    }
    points.push({ weekStart: ws, sessions, avgSleepDelta: n > 0 ? Math.round(sum / n) : null });
  }
  return points;
}

export function isGoalScheduledAnyDayInWeek(goal: Goal, ws: string): boolean {
  return dateRange(ws, addDays(ws, 6)).some((d) => isScheduledOn(goal, d));
}

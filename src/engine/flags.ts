import type { Goal, LogEntry } from '../types/goal';
import { addDays } from '../utils/date';
import { evaluateDay, evaluateWeek, isScheduledOn } from './goalEngine';

export interface Flag {
  id: string;
  text: string;
}

function goalOfType(goals: Goal[], type: Goal['type']): Goal | undefined {
  return goals.find((g) => g.type === type && !g.archived);
}

/** Consecutive fails walking backward from `from` (inclusive) over scheduled days only. */
function consecutiveFailsBackward(goal: Goal, from: string, logs: LogEntry[], todayISO: string): number {
  let count = 0;
  let cursor = from;
  for (let i = 0; i < 30; i++) {
    if (cursor < goal.activeFrom) break;
    if (!isScheduledOn(goal, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    const r = evaluateDay(goal, cursor, logs, todayISO);
    if (r.status === 'fail') {
      count += 1;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return count;
}

function flagLateSleep(goals: Goal[], logs: LogEntry[], todayISO: string): Flag | null {
  const sleep = goalOfType(goals, 'daily_time');
  if (!sleep) return null;
  const from = evaluateDay(sleep, todayISO, logs, todayISO).status === 'pending' ? addDays(todayISO, -1) : todayISO;
  const streak = consecutiveFailsBackward(sleep, from, logs, todayISO);
  if (streak >= 3) {
    const boxing = goalOfType(goals, 'weekly_count');
    const consequence = boxing ? ` ${boxing.name} usually goes next.` : '';
    return { id: 'sleep-late-streak', text: `Bed time has been past target ${streak} nights running.${consequence}` };
  }
  return null;
}

function flagBoxingFloor(goals: Goal[], logs: LogEntry[], todayISO: string): Flag | null {
  const boxing = goalOfType(goals, 'weekly_count');
  if (!boxing) return null;
  const week = evaluateWeek(boxing, todayISO, logs, todayISO);
  if (!week) return null;
  if (week.remainingScheduled.length === 1 && week.count < week.floor && week.count + 1 >= week.floor) {
    return {
      id: 'boxing-floor-risk',
      text: `${boxing.name} is at ${week.count} of ${week.floor} for the week with one scheduled day left.`,
    };
  }
  return null;
}

function flagScripture(goals: Goal[], logs: LogEntry[], todayISO: string): Flag | null {
  const scripture = goalOfType(goals, 'daily_duration');
  if (!scripture) return null;
  const from = evaluateDay(scripture, todayISO, logs, todayISO).status === 'pending' ? addDays(todayISO, -1) : todayISO;
  const streak = consecutiveFailsBackward(scripture, from, logs, todayISO);
  if (streak >= 3) {
    return { id: 'scripture-missed', text: `${scripture.name} missed ${streak} days running.` };
  }
  return null;
}

function flagScrolling(goals: Goal[], logs: LogEntry[], todayISO: string): Flag | null {
  const scrolling = goalOfType(goals, 'inverted_binary');
  if (!scrolling) return null;
  // Compare occurrences so far this week against the same number of days last week.
  let daysIntoWeek = 1;
  let cursor = todayISO;
  while (true) {
    const wd = new Date(cursor).getDay();
    if (wd === 1) break; // Monday
    cursor = addDays(cursor, -1);
    daysIntoWeek += 1;
    if (daysIntoWeek > 7) break;
  }
  const thisWeekStart = addDays(todayISO, -(daysIntoWeek - 1));
  const lastWeekStart = addDays(thisWeekStart, -7);

  let thisWeekCount = 0;
  let lastWeekCount = 0;
  for (let i = 0; i < daysIntoWeek; i++) {
    const d1 = addDays(thisWeekStart, i);
    const d2 = addDays(lastWeekStart, i);
    if (isScheduledOn(scrolling, d1) && evaluateDay(scrolling, d1, logs, todayISO).status === 'fail') thisWeekCount += 1;
    if (isScheduledOn(scrolling, d2)) {
      const r = evaluateDay(scrolling, d2, logs, todayISO);
      if (r.status === 'fail') lastWeekCount += 1;
    }
  }

  if (thisWeekCount > lastWeekCount) {
    return {
      id: 'scrolling-up',
      text: `${scrolling.name.replace(/^No /, '')} is up this week: ${thisWeekCount} so far against ${lastWeekCount} over the same days last week.`,
    };
  }
  return null;
}

function flagThursdayDrift(goals: Goal[], logs: LogEntry[], todayISO: string): Flag | null {
  const sleep = goalOfType(goals, 'daily_time');
  if (!sleep) return null;
  const now = new Date();
  const isThursday = now.getDay() === 4;
  if (!isThursday || now.getHours() < 18) return null;
  const yesterday = addDays(todayISO, -1);
  const twoAgo = addDays(todayISO, -2);
  const r1 = evaluateDay(sleep, yesterday, logs, todayISO);
  const r2 = evaluateDay(sleep, twoAgo, logs, todayISO);
  if (r1.status === 'fail' && r2.status === 'fail') {
    return { id: 'thursday-drift', text: `Bed time has been drifting. Friday 06:00 depends on it.` };
  }
  return null;
}

/** Returns at most one flag — the most consequential — never stacked. */
export function computeFlag(goals: Goal[], logs: LogEntry[], todayISO: string): Flag | null {
  const checks = [flagLateSleep, flagBoxingFloor, flagScripture, flagScrolling, flagThursdayDrift];
  for (const check of checks) {
    const flag = check(goals, logs, todayISO);
    if (flag) return flag;
  }
  return null;
}

import type { Goal, LogEntry } from '../types';
import { addDays, compareISO, getWeekday, startOfWeek, todayISO, WEEKDAY_LABELS_LONG } from './date';
import { evaluateDay, evaluateWeek, logFor } from './evaluate';
import { isScheduledOn, isCurrentlyActive } from './schedule';

export interface Flag {
  id: string;
  message: string;
}

function activeGoalsOfType(goals: Goal[], type: Goal['type'], today: string): Goal[] {
  return goals.filter((g) => g.type === type && isCurrentlyActive(g, today));
}

/** Consecutive scheduled days ending the day before `today` that evaluated
 * to `fail`. Stops counting at the first non-fail. */
function consecutiveFailsBeforeToday(goal: Goal, logs: LogEntry[], today: string): number {
  let count = 0;
  let cursor = addDays(today, -1);
  // Cap the walk-back so a goal with no history doesn't loop forever.
  for (let i = 0; i < 60; i += 1) {
    if (!isScheduledOn(goal, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    const status = evaluateDay(goal, cursor, logs);
    if (status === 'fail') {
      count += 1;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return count;
}

function boxingFloorFlag(goals: Goal[], logs: LogEntry[], today: string): Flag | null {
  for (const goal of activeGoalsOfType(goals, 'weekly_count', today)) {
    const week = evaluateWeek(goal, today, logs);
    if (!week || week.floor === undefined) continue;
    const remaining = week.scheduledDates.filter((d) => compareISO(d, today) >= 0).length;
    const alreadyAtFloor = week.actual >= week.floor;
    if (remaining === 1 && !alreadyAtFloor && week.actual + remaining >= week.floor) {
      return {
        id: `boxing-floor-${goal.id}`,
        message: `${goal.name} is ${week.actual} of ${week.target} this week with one session left. Miss it and the week drops below the floor of ${week.floor}.`,
      };
    }
  }
  return null;
}

function bedTimeStreakFlag(goals: Goal[], logs: LogEntry[], today: string): Flag | null {
  for (const sleepGoal of activeGoalsOfType(goals, 'daily_time', today)) {
    const fails = consecutiveFailsBeforeToday(sleepGoal, logs, today);
    if (fails >= 3) {
      const weeklyGoal = activeGoalsOfType(goals, 'weekly_count', today)[0];
      const consequence = weeklyGoal ? ` ${weeklyGoal.name} usually goes next.` : '';
      return {
        id: `bedtime-streak-${sleepGoal.id}`,
        message: `Bed time has been past target ${fails} nights running.${consequence}`,
      };
    }
  }
  return null;
}

function thursdayDriftFlag(goals: Goal[], logs: LogEntry[], today: string): Flag | null {
  if (getWeekday(today) !== 4) return null; // Thursday only
  for (const sleepGoal of activeGoalsOfType(goals, 'daily_time', today)) {
    const tomorrow = addDays(today, 1);
    if (!isScheduledOn(sleepGoal, tomorrow)) continue;
    const d1 = addDays(today, -1);
    const d2 = addDays(today, -2);
    if (!isScheduledOn(sleepGoal, d1) || !isScheduledOn(sleepGoal, d2)) continue;
    const s1 = evaluateDay(sleepGoal, d1, logs);
    const s2 = evaluateDay(sleepGoal, d2, logs);
    if (s1 !== 'fail' || s2 !== 'fail') continue;
    const l1 = logFor(logs, sleepGoal.id, d1);
    const l2 = logFor(logs, sleepGoal.id, d2);
    if (!l1?.time || !l2?.time) continue;
    if (l1.time >= l2.time) {
      const tomorrowLabel = WEEKDAY_LABELS_LONG[getWeekday(tomorrow)];
      return {
        id: `thursday-drift-${sleepGoal.id}`,
        message: `Bed time has drifted later each of the past two nights. ${tomorrowLabel}'s early start depends on tonight.`,
      };
    }
  }
  return null;
}

function scriptureMissFlag(goals: Goal[], logs: LogEntry[], today: string): Flag | null {
  for (const goal of activeGoalsOfType(goals, 'daily_duration', today)) {
    const fails = consecutiveFailsBeforeToday(goal, logs, today);
    if (fails >= 3) {
      return {
        id: `duration-miss-${goal.id}`,
        message: `${goal.name} has been missed ${fails} days running.`,
      };
    }
  }
  return null;
}

function scrollingRateFlag(goals: Goal[], logs: LogEntry[], today: string): Flag | null {
  for (const goal of activeGoalsOfType(goals, 'inverted_binary', today)) {
    const thisWeekStart = startOfWeek(today);
    const daysElapsed = compareISO(today, thisWeekStart) + 1;
    const lastWeekStart = addDays(thisWeekStart, -7);

    let thisWeekCount = 0;
    let lastWeekCount = 0;
    for (let i = 0; i < daysElapsed; i += 1) {
      const d1 = addDays(thisWeekStart, i);
      const d2 = addDays(lastWeekStart, i);
      thisWeekCount += logFor(logs, goal.id, d1)?.count ?? 0;
      lastWeekCount += logFor(logs, goal.id, d2)?.count ?? 0;
    }
    if (thisWeekCount > lastWeekCount && daysElapsed >= 2) {
      return {
        id: `scrolling-rate-${goal.id}`,
        message: `${goal.name} incidents are up this week: ${thisWeekCount} versus ${lastWeekCount} by this point last week.`,
      };
    }
  }
  return null;
}

/** One flag, most consequential first. Never more than one — the app states
 * an observation and stops rather than stacking warnings. */
export function getActiveFlag(goals: Goal[], logs: LogEntry[], today: string = todayISO()): Flag | null {
  const checks = [boxingFloorFlag, bedTimeStreakFlag, thursdayDriftFlag, scriptureMissFlag, scrollingRateFlag];
  for (const check of checks) {
    const flag = check(goals, logs, today);
    if (flag) return flag;
  }
  return null;
}

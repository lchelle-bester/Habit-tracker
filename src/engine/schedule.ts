import type { Goal } from '../types';
import { compareISO, getWeekday, isWithinRange } from './date';

/** Whether the goal is scheduled to apply on the given date at all
 * (weekday matches, date within active range). Ignores archived status. */
export function isScheduledOn(goal: Goal, date: string): boolean {
  if (!isWithinRange(date, goal.activeFrom, goal.activeTo)) return false;
  const wd = getWeekday(date);
  return goal.schedule.includes(wd);
}

/** Whether the goal should currently be shown/interacted with (not archived,
 * or archived only after this date). */
export function isVisibleOn(goal: Goal, date: string): boolean {
  if (goal.archived && compareISO(goal.activeTo ?? date, date) < 0) return false;
  return isScheduledOn(goal, date);
}

export function isCurrentlyActive(goal: Goal, today: string): boolean {
  return !goal.archived && isWithinRange(today, goal.activeFrom, goal.activeTo);
}

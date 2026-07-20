import type { Goal, TargetValue, TargetVersion } from '../types';
import { addDays, compareISO, isWithinRange } from './date';

/** The target version in force on a given date, or undefined if none covers it. */
export function targetForDate(goal: Goal, date: string): TargetVersion | undefined {
  return goal.targets.find((t) => isWithinRange(date, t.from, t.to));
}

/** The current (open-ended, or most recent) target version. */
export function currentTarget(goal: Goal): TargetVersion | undefined {
  const open = goal.targets.find((t) => t.to === null);
  if (open) return open;
  return [...goal.targets].sort((a, b) => compareISO(b.from, a.from))[0];
}

/**
 * Apply a new target value effective from `effectiveFrom` onward. Closes the
 * previously-open version the day before, and never mutates past history —
 * days already evaluated under the old target keep reading as they did.
 */
export function applyNewTarget(
  goal: Goal,
  value: TargetValue,
  effectiveFrom: string
): Goal {
  const targets = [...goal.targets];
  const openIdx = targets.findIndex((t) => t.to === null);
  if (openIdx !== -1 && compareISO(targets[openIdx].from, effectiveFrom) < 0) {
    targets[openIdx] = { ...targets[openIdx], to: addDays(effectiveFrom, -1) };
  } else if (openIdx !== -1) {
    // New target starts on or before the currently open version's start:
    // the open version never actually took effect, so replace it outright.
    targets.splice(openIdx, 1);
  }
  targets.push({
    id: crypto.randomUUID(),
    from: effectiveFrom,
    to: null,
    value,
  });
  targets.sort((a, b) => compareISO(a.from, b.from));
  return { ...goal, targets };
}

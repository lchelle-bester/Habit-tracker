import type { AppData, Goal, LogEntry, TargetValue } from '../types';
import { buildSeedGoals } from '../data/seed';
import { applyNewTarget } from '../engine/targets';
import { addDays, todayISO } from '../engine/date';

const STORAGE_KEY = 'habit-tracker-data-v1';

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch {
    // fall through to seed
  }
  const seeded: AppData = { goals: buildSeedGoals(), logs: [] };
  saveData(seeded);
  return seeded;
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportJSON(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habit-tracker-export-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseImportedJSON(text: string): AppData {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.goals) || !Array.isArray(parsed.logs)) {
    throw new Error('File does not look like a habit tracker export.');
  }
  return parsed as AppData;
}

export function upsertLog(logs: LogEntry[], goalId: string, date: string, patch: Partial<LogEntry>): LogEntry[] {
  const idx = logs.findIndex((l) => l.goalId === goalId && l.date === date);
  if (idx === -1) {
    return [...logs, { id: crypto.randomUUID(), goalId, date, ...patch }];
  }
  const next = [...logs];
  next[idx] = { ...next[idx], ...patch };
  return next;
}

export function createGoal(input: {
  name: string;
  type: Goal['type'];
  schedule: Goal['schedule'];
  value: TargetValue;
  activeFrom?: string;
}): Goal {
  const from = input.activeFrom ?? todayISO();
  return {
    id: crypto.randomUUID(),
    name: input.name,
    type: input.type,
    schedule: input.schedule,
    activeFrom: from,
    activeTo: null,
    archived: false,
    createdAt: new Date().toISOString(),
    targets: [{ id: crypto.randomUUID(), from, to: null, value: input.value }],
  };
}

export function updateGoalTarget(goal: Goal, value: TargetValue, effectiveFrom: string = todayISO()): Goal {
  return applyNewTarget(goal, value, effectiveFrom);
}

export function archiveGoal(goal: Goal, on: string = todayISO()): Goal {
  return { ...goal, archived: true, activeTo: on };
}

export function reactivateGoal(goal: Goal, on: string = todayISO()): Goal {
  // Reactivating starts a fresh active window from today; history under the
  // old window is untouched.
  return { ...goal, archived: false, activeTo: null, activeFrom: goal.archived ? on : goal.activeFrom };
}

export function renameOrReschedule(goal: Goal, patch: Partial<Pick<Goal, 'name' | 'schedule'>>): Goal {
  return { ...goal, ...patch };
}

export function dayBefore(iso: string): string {
  return addDays(iso, -1);
}

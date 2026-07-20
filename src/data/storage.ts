import type { AppData } from '../types/goal';
import { seedGoals } from './seed';
import { today } from '../utils/date';

const KEY = 'habit-tracker:data:v1';

export function loadData(): AppData {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as AppData;
    } catch {
      // fall through to seed
    }
  }
  const seeded: AppData = { goals: seedGoals(today()), logs: [] };
  saveData(seeded);
  return seeded;
}

export function saveData(data: AppData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function exportJSON(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habit-tracker-export-${today()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importJSON(json: string): AppData {
  const parsed = JSON.parse(json) as AppData;
  if (!parsed.goals || !parsed.logs) throw new Error('Invalid export file');
  return parsed;
}

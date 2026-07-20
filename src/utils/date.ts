import type { Weekday } from '../types/goal';

/** Format a Date as local-timezone ISO date string YYYY-MM-DD (no UTC shift). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return toISODate(new Date());
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isoWeekday(iso: string): Weekday {
  const day = parseISODate(iso).getDay(); // 0 = Sunday
  return (day === 0 ? 7 : day) as Weekday;
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Monday of the ISO week containing `iso`. */
export function weekStart(iso: string): string {
  const wd = isoWeekday(iso);
  return addDays(iso, -(wd - 1));
}

export function weekEnd(iso: string): string {
  return addDays(weekStart(iso), 6);
}

export function isBefore(a: string, b: string): boolean {
  return a < b;
}

export function isAfter(a: string, b: string): boolean {
  return a > b;
}

export function clampDate(iso: string, min: string, max: string): string {
  if (iso < min) return min;
  if (iso > max) return max;
  return iso;
}

/** Inclusive list of ISO dates from start to end. */
export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function formatDayLabel(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatShortDate(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Parse "HH:MM" into minutes since midnight. */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = Math.floor(mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** Signed delta in minutes between actual and target clock times, shortest direction. */
export function timeDeltaMinutes(target: string, actual: string): number {
  return timeToMinutes(actual) - timeToMinutes(target);
}

import type { Weekday } from '../types';

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

export const WEEKDAY_LABELS_LONG: Record<Weekday, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function getWeekday(iso: string): Weekday {
  return fromISODate(iso).getDay() as Weekday;
}

/** Monday-start week. Returns the ISO date of that week's Monday. */
export function startOfWeek(iso: string): string {
  const wd = getWeekday(iso);
  const diff = wd === 0 ? -6 : 1 - wd; // days to subtract to reach Monday
  return addDays(iso, diff);
}

export function endOfWeek(iso: string): string {
  return addDays(startOfWeek(iso), 6);
}

export function compareISO(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function isWithinRange(iso: string, from: string, to: string | null): boolean {
  if (compareISO(iso, from) < 0) return false;
  if (to !== null && compareISO(iso, to) > 0) return false;
  return true;
}

export function datesInRange(fromIso: string, toIso: string): string[] {
  const out: string[] = [];
  let cur = fromIso;
  while (compareISO(cur, toIso) <= 0) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function formatDayLabel(iso: string): string {
  const d = fromISODate(iso);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatShortDate(iso: string): string {
  const d = fromISODate(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Minutes since midnight for an "HH:MM" string. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToDelta(actual: string, target: string): number {
  return timeToMinutes(actual) - timeToMinutes(target);
}

export function formatMinutesDelta(mins: number): string {
  if (mins === 0) return 'on time';
  const sign = mins > 0 ? '+' : '−';
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const parts = h > 0 ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
  return `${sign}${parts}`;
}

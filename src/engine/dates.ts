import type { ClockTime, ISODate, Weekday } from './types'

// All calendar math below is done with Date.UTC (noon-free, no local timezone,
// no DST) so it is deterministic regardless of the host's timezone — the app
// only ever displays/receives 'YYYY-MM-DD' strings, and `Date` objects are
// purely an internal implementation detail of this module.

function parse(date: ISODate): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number)
  return { y, m, d }
}

function toUTC(date: ISODate): number {
  const { y, m, d } = parse(date)
  return Date.UTC(y, m - 1, d)
}

function fromUTC(ms: number): ISODate {
  const dt = new Date(ms)
  // Zero-pad the year too: an un-padded year (e.g. '9' instead of '0009')
  // would break lexical string comparison, which every date comparison in
  // this module relies on.
  const y = String(dt.getUTCFullYear()).padStart(4, '0')
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(dt.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromUTC(toUTC(date) + days * 86_400_000)
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(a) - toUTC(b)) / 86_400_000)
}

export function weekdayOf(date: ISODate): Weekday {
  return new Date(toUTC(date)).getUTCDay() as Weekday
}

/** Monday-start week: returns the ISO date of the Monday of the week containing `date`. */
export function isoWeekStart(date: ISODate): ISODate {
  const jsWeekday = weekdayOf(date) // 0=Sun..6=Sat
  const offsetFromMonday = (jsWeekday + 6) % 7
  return addDays(date, -offsetFromMonday)
}

export function isoWeekEnd(date: ISODate): ISODate {
  return addDays(isoWeekStart(date), 6)
}

export function isBefore(a: ISODate, b: ISODate): boolean {
  return a < b
}
export function isAfter(a: ISODate, b: ISODate): boolean {
  return a > b
}
export function isSameOrBefore(a: ISODate, b: ISODate): boolean {
  return a <= b
}
export function isSameOrAfter(a: ISODate, b: ISODate): boolean {
  return a >= b
}

export function isWithinRange(date: ISODate, from: ISODate, to: ISODate | null): boolean {
  if (isBefore(date, from)) return false
  if (to !== null && isAfter(date, to)) return false
  return true
}

export function dayOfYear(date: ISODate): number {
  const { y } = parse(date)
  return diffDays(date, `${y}-01-01`) + 1
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** The user's current local calendar day (not UTC) — what matters for a phone-first daily check-in. */
export function today(): ISODate {
  const dt = new Date()
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** The user's current local clock time as 'HH:mm'. */
export function nowClockTime(): ClockTime {
  const dt = new Date()
  const h = String(dt.getHours()).padStart(2, '0')
  const m = String(dt.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

/** Inclusive list of ISO dates from `start` to `end`. */
export function datesInRange(start: ISODate, end: ISODate): ISODate[] {
  const n = diffDays(end, start)
  const out: ISODate[] = []
  for (let i = 0; i <= n; i++) out.push(addDays(start, i))
  return out
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

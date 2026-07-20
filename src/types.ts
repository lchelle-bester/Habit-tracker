// Weekday convention matches Date#getDay(): 0 = Sunday ... 6 = Saturday.
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type GoalType =
  | 'weekly_count'
  | 'daily_time'
  | 'daily_duration'
  | 'daily_binary'
  | 'weekly_duration'
  | 'inverted_binary';

export interface WeeklyCountTarget {
  type: 'weekly_count';
  count: number;
  floor?: number;
}

export interface DailyTimeTarget {
  type: 'daily_time';
  time: string; // "HH:MM", 24h
  overrides?: Partial<Record<Weekday, string>>;
}

export interface DailyDurationTarget {
  type: 'daily_duration';
  minutes: number;
}

export interface DailyBinaryTarget {
  type: 'daily_binary';
}

export interface WeeklyDurationTarget {
  type: 'weekly_duration';
  minutes: number;
}

export interface InvertedBinaryTarget {
  type: 'inverted_binary';
}

export type TargetValue =
  | WeeklyCountTarget
  | DailyTimeTarget
  | DailyDurationTarget
  | DailyBinaryTarget
  | WeeklyDurationTarget
  | InvertedBinaryTarget;

/** A target value in force over a date range. Never mutated in place once
 * superseded — editing a goal closes the current version and opens a new one. */
export interface TargetVersion {
  id: string;
  from: string; // ISO date, inclusive
  to: string | null; // ISO date, inclusive; null = open-ended / current
  value: TargetValue;
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  schedule: Weekday[]; // weekdays this goal is scheduled/applicable
  activeFrom: string; // ISO date
  activeTo: string | null; // ISO date, null = still active
  archived: boolean;
  createdAt: string; // ISO datetime
  targets: TargetVersion[]; // sorted ascending by `from`, non-overlapping
}

/** A single day's logged entry for a goal. Shape depends on goal type. */
export interface LogEntry {
  id: string;
  goalId: string;
  date: string; // ISO date this entry applies to
  done?: boolean; // daily_binary, weekly_count (session happened that day)
  minutes?: number; // daily_duration, weekly_duration
  time?: string; // daily_time actual clock time "HH:MM"
  count?: number; // inverted_binary incident count for that day
  timesOfDay?: string[]; // inverted_binary, optional times incidents happened
}

export interface AppData {
  goals: Goal[];
  logs: LogEntry[];
}

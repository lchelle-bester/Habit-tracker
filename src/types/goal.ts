// Weekday indices follow ISO: 1 = Monday ... 7 = Sunday
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

export const WEEKDAY_LABEL_LONG: Record<Weekday, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export type GoalType =
  | 'weekly_count'
  | 'daily_time'
  | 'daily_duration'
  | 'daily_binary'
  | 'weekly_duration'
  | 'inverted_binary';

/** Type-specific target configuration. Versioned — never mutated in place. */
export type TargetConfig =
  | { kind: 'weekly_count'; target: number; floor: number }
  | { kind: 'daily_time'; time: string; overrides?: Partial<Record<Weekday, string>> }
  | { kind: 'daily_duration'; minutes: number }
  | { kind: 'daily_binary'; label?: string }
  | { kind: 'weekly_duration'; minutes: number }
  | { kind: 'inverted_binary' };

/**
 * A goal's target and schedule as they applied from a given date forward.
 * Editing a goal appends a new version rather than mutating the last one,
 * so historical evaluation always uses the version in force at the time.
 */
export interface GoalVersion {
  id: string;
  goalId: string;
  effectiveFrom: string; // ISO date, inclusive
  schedule: Weekday[];
  config: TargetConfig;
}

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  activeFrom: string; // ISO date
  activeTo: string | null; // ISO date, inclusive, or null = ongoing
  archived: boolean;
  createdAt: string;
  versions: GoalVersion[]; // sorted ascending by effectiveFrom
}

export type LogValue =
  | { kind: 'weekly_count'; done: boolean }
  | { kind: 'daily_time'; actual: string }
  | { kind: 'daily_duration'; minutes: number }
  | { kind: 'daily_binary'; done: boolean }
  | { kind: 'weekly_duration'; minutes: number }
  | { kind: 'inverted_binary'; occurred: boolean; time?: string };

export interface LogEntry {
  id: string;
  goalId: string;
  date: string; // ISO date this entry is for
  value: LogValue;
  createdAt: string;
}

export interface AppData {
  goals: Goal[];
  logs: LogEntry[];
}

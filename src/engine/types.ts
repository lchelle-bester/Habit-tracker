// Pure data types for the goal engine. No React, no DOM, no storage imports here.

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6 // Date.getDay() convention: 0 = Sunday

export type ISODate = string // 'YYYY-MM-DD'
export type ClockTime = string // 'HH:mm', 24h

export type GoalTypeId =
  | 'weekly_count'
  | 'daily_time'
  | 'daily_duration'
  | 'daily_binary'
  | 'weekly_duration'
  | 'inverted_binary'

export interface GoalBase {
  id: string
  name: string
  schedule: Weekday[]
  activeFrom: ISODate
  activeTo: ISODate | null
  archived: boolean
}

export interface TargetVersionBase {
  id: string
  effectiveFrom: ISODate // inclusive; effectiveTo is derived, never stored
}

export interface WeeklyCountTarget extends TargetVersionBase {
  target: number
  floor?: number
}
export interface DailyTimeTarget extends TargetVersionBase {
  defaultTime: ClockTime
  overrides?: Partial<Record<Weekday, ClockTime>>
}
export interface DailyDurationTarget extends TargetVersionBase {
  targetMinutes: number
}
export interface DailyBinaryTarget extends TargetVersionBase {}
export interface WeeklyDurationTarget extends TargetVersionBase {
  targetMinutes: number
}
export interface InvertedBinaryTarget extends TargetVersionBase {}

export interface TargetVersionMap {
  weekly_count: WeeklyCountTarget
  daily_time: DailyTimeTarget
  daily_duration: DailyDurationTarget
  daily_binary: DailyBinaryTarget
  weekly_duration: WeeklyDurationTarget
  inverted_binary: InvertedBinaryTarget
}

export type TargetVersion = TargetVersionMap[GoalTypeId]

export type Goal = {
  [K in GoalTypeId]: GoalBase & { type: K; targetVersions: TargetVersionMap[K][] }
}[GoalTypeId]

export interface EntryBase {
  goalId: string
  date: ISODate
}

export interface WeeklyCountEntry extends EntryBase {
  done: boolean
}
export interface DailyTimeEntry extends EntryBase {
  actualTime: ClockTime | null
}
export interface DailyDurationEntry extends EntryBase {
  actualMinutes: number | null
}
export interface DailyBinaryEntry extends EntryBase {
  done: boolean
}
export interface WeeklyDurationEntry extends EntryBase {
  actualMinutes: number | null
}
export interface InvertedBinaryEntry extends EntryBase {
  occurred: boolean
  occurredAt?: ClockTime
}

export interface EntryMap {
  weekly_count: WeeklyCountEntry
  daily_time: DailyTimeEntry
  daily_duration: DailyDurationEntry
  daily_binary: DailyBinaryEntry
  weekly_duration: WeeklyDurationEntry
  inverted_binary: InvertedBinaryEntry
}

export type Entry = {
  [K in GoalTypeId]: EntryMap[K] & { type: K }
}[GoalTypeId]

export type DayStatus = 'pass' | 'fail' | 'pending' | 'not_scheduled'
export type WeekStatus = 'full' | 'floor' | 'fail' | 'pending'

export interface WeekAggregate {
  weekStart: ISODate
  count: number
  target: number
  floor: number
  status: WeekStatus
}

export interface StreakResult {
  current: number
  longest: number
  unit: 'day' | 'week'
}

export type PushbackFlagId =
  | 'bedtime_3_nights'
  | 'boxing_floor_risk'
  | 'scripture_streak_broken'
  | 'scrolling_up'
  | 'thursday_drift'

export interface PushbackFlag {
  id: PushbackFlagId
  message: string
  goalIds: string[]
}

export interface Verse {
  text: string
  reference: string
}

export interface AppData {
  schemaVersion: number
  goals: Goal[]
  entries: Entry[]
  settings: {
    theme: 'system' | 'light' | 'dark'
  }
  meta: {
    installedAt: string
  }
}

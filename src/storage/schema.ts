import { today } from '../engine/dates'
import { buildSeedAppData } from '../engine/seed'
import type { AppData, GoalTypeId } from '../engine/types'

export const CURRENT_SCHEMA_VERSION = 1

const GOAL_TYPE_IDS: GoalTypeId[] = [
  'weekly_count',
  'daily_time',
  'daily_duration',
  'daily_binary',
  'weekly_duration',
  'inverted_binary',
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Migration = (old: any) => any

/** Add an entry here (keyed by the version migrating FROM) whenever the schema shape changes. */
const MIGRATIONS: Record<number, Migration> = {}

export function freshAppData(): AppData {
  return buildSeedAppData(today(), CURRENT_SCHEMA_VERSION)
}

/**
 * Runs `raw` through any migrations needed to reach CURRENT_SCHEMA_VERSION.
 * Throws if no migration path exists from the stored version — the caller
 * (storage.ts) treats that as corruption and falls back to a fresh seed
 * rather than risking a half-migrated shape reaching the UI.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateToCurrentSchema(raw: any): AppData {
  let data = raw
  let version = typeof data?.schemaVersion === 'number' ? data.schemaVersion : 0
  while (version < CURRENT_SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version]
    if (!migrate) throw new Error(`No migration path from schema version ${version}`)
    data = migrate(data)
    version += 1
  }
  return { ...data, schemaVersion: CURRENT_SCHEMA_VERSION }
}

/** Minimal structural validation — enough to catch corruption/hand-edited JSON before it reaches the store. */
export function isValidAppData(data: unknown): data is AppData {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  if (typeof d.schemaVersion !== 'number') return false
  if (!Array.isArray(d.goals) || !Array.isArray(d.entries)) return false
  if (!d.goals.every((g) => isValidGoalShape(g))) return false
  if (!d.entries.every((e) => isValidEntryShape(e))) return false
  const settings = d.settings as Record<string, unknown> | undefined
  if (!settings || !['system', 'light', 'dark'].includes(settings.theme as string)) return false
  return true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidGoalShape(g: any): boolean {
  return (
    typeof g?.id === 'string' &&
    typeof g?.name === 'string' &&
    GOAL_TYPE_IDS.includes(g?.type) &&
    Array.isArray(g?.schedule) &&
    Array.isArray(g?.targetVersions) &&
    typeof g?.activeFrom === 'string' &&
    typeof g?.archived === 'boolean'
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isValidEntryShape(e: any): boolean {
  return typeof e?.goalId === 'string' && typeof e?.date === 'string' && GOAL_TYPE_IDS.includes(e?.type)
}

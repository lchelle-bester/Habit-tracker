import { isValidAppData, migrateToCurrentSchema } from './schema'
import type { AppData } from '../engine/types'

export function exportAppDataAsFile(data: AppData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `goal-tracker-export-${data.meta.installedAt}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export class ImportValidationError extends Error {}

/**
 * Parses and validates an imported JSON payload without touching storage —
 * the caller decides when (and whether) to actually replace the store, so
 * an invalid file never corrupts existing data.
 */
export function parseImportedAppData(json: string): AppData {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new ImportValidationError('That file is not valid JSON.')
  }

  let migrated: unknown
  try {
    migrated = migrateToCurrentSchema(parsed)
  } catch {
    throw new ImportValidationError('That file uses an unrecognized data version.')
  }

  if (!isValidAppData(migrated)) {
    throw new ImportValidationError("That file doesn't look like a Goal Tracker export.")
  }
  return migrated
}

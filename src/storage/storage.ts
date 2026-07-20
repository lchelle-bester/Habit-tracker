import { freshAppData, isValidAppData, migrateToCurrentSchema } from './schema'
import type { AppData } from '../engine/types'

const STORAGE_KEY = 'goal-tracker:app-data'
const DEBOUNCE_MS = 400

let pendingWrite: AppData | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function writeNow(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    // Quota exceeded or storage disabled — surface via console rather than crashing the app.
    console.warn('Failed to persist app data to localStorage', err)
  }
  pendingWrite = null
}

/** Debounced write: rapid successive calls (typing, dragging a time input) coalesce into one localStorage.setItem. */
export function persistAppData(data: AppData): void {
  pendingWrite = data
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    if (pendingWrite) writeNow(pendingWrite)
  }, DEBOUNCE_MS)
}

/** Forces any pending debounced write out immediately — call on visibilitychange/beforeunload. */
export function flushPendingWrite(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  if (pendingWrite) writeNow(pendingWrite)
}

/**
 * Loads app data from localStorage, migrating if needed. Falls back to a
 * fresh seed (rather than throwing) if there is no stored data yet, or if
 * what's stored is corrupted/unparseable/invalid — a habit tracker must
 * never fail to boot.
 */
export function loadAppData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return freshAppData()

  try {
    const parsed = JSON.parse(raw)
    const migrated = migrateToCurrentSchema(parsed)
    if (!isValidAppData(migrated)) throw new Error('Stored data failed validation')
    return migrated
  } catch (err) {
    console.warn('Stored app data was corrupted or invalid; reseeding.', err)
    return freshAppData()
  }
}

export function clearStoredAppData(): void {
  localStorage.removeItem(STORAGE_KEY)
}

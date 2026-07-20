import { describe, expect, it } from 'vitest'
import { freshAppData, isValidAppData, migrateToCurrentSchema } from './schema'

describe('schema', () => {
  it('freshAppData produces the 6 seed goals with valid shape', () => {
    const data = freshAppData()
    expect(isValidAppData(data)).toBe(true)
    expect(data.goals).toHaveLength(6)
    expect(data.goals.map((g) => g.name).sort()).toEqual(
      ['Boxing', 'Journal', 'No scrolling', 'Reading', 'Scripture', 'Sleep'].sort(),
    )
  })

  it('rejects structurally invalid data', () => {
    expect(isValidAppData(null)).toBe(false)
    expect(isValidAppData({})).toBe(false)
    expect(isValidAppData({ schemaVersion: 1, goals: 'nope', entries: [], settings: { theme: 'system' } })).toBe(false)
    expect(isValidAppData({ schemaVersion: 1, goals: [{ type: 'not_a_real_type' }], entries: [], settings: { theme: 'system' } })).toBe(false)
  })

  it('migrateToCurrentSchema is a no-op when already current, and stamps schemaVersion', () => {
    const data = freshAppData()
    const migrated = migrateToCurrentSchema(data)
    expect(migrated.schemaVersion).toBe(data.schemaVersion)
    expect(migrated.goals).toEqual(data.goals)
  })

  it('throws when there is no migration path from an unknown older version', () => {
    expect(() => migrateToCurrentSchema({ schemaVersion: -1, goals: [], entries: [], settings: {} })).toThrow()
  })
})

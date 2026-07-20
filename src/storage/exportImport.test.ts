import { describe, expect, it } from 'vitest'
import { freshAppData } from './schema'
import { ImportValidationError, parseImportedAppData } from './exportImport'

describe('parseImportedAppData', () => {
  it('round-trips a valid export back to an identical AppData', () => {
    const original = freshAppData()
    const json = JSON.stringify(original)
    const reimported = parseImportedAppData(json)
    expect(reimported).toEqual(original)
  })

  it('rejects non-JSON content', () => {
    expect(() => parseImportedAppData('not json at all')).toThrow(ImportValidationError)
  })

  it('rejects JSON that is not a Goal Tracker export', () => {
    expect(() => parseImportedAppData(JSON.stringify({ hello: 'world' }))).toThrow(ImportValidationError)
  })
})

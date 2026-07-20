import { describe, expect, it } from 'vitest'
import { addOrReplaceTargetVersion, resolveTargetVersion } from './targetResolution'
import type { Goal } from './types'

function boxingGoal(): Goal & { type: 'weekly_count' } {
  return {
    id: 'boxing',
    name: 'Boxing',
    type: 'weekly_count',
    schedule: [1, 2, 3, 5],
    activeFrom: '2026-01-01',
    activeTo: null,
    archived: false,
    targetVersions: [{ id: 'v1', effectiveFrom: '2026-01-01', target: 4, floor: 3 }],
  }
}

describe('resolveTargetVersion', () => {
  it('returns null for a date before any version exists', () => {
    const g = boxingGoal()
    expect(resolveTargetVersion(g, '2025-12-31')).toBeNull()
  })

  it('resolves exactly on a version effectiveFrom date', () => {
    const g = boxingGoal()
    expect(resolveTargetVersion(g, '2026-01-01')?.target).toBe(4)
  })

  it('resolves strictly between two versions to the earlier one', () => {
    const g = addOrReplaceTargetVersion(boxingGoal(), { id: 'v2', effectiveFrom: '2026-09-01', target: 5, floor: 4 })
    // August still evaluates against the OLD target — the non-negotiable requirement.
    expect(resolveTargetVersion(g, '2026-08-15')?.target).toBe(4)
    expect(resolveTargetVersion(g, '2026-09-01')?.target).toBe(5)
    expect(resolveTargetVersion(g, '2026-12-31')?.target).toBe(5)
  })

  it('resolves correctly even when versions are stored out of chronological order', () => {
    const g = boxingGoal()
    g.targetVersions = [
      { id: 'v2', effectiveFrom: '2026-09-01', target: 5, floor: 4 },
      { id: 'v1', effectiveFrom: '2026-01-01', target: 4, floor: 3 },
    ]
    expect(resolveTargetVersion(g, '2026-08-15')?.target).toBe(4)
    expect(resolveTargetVersion(g, '2026-09-15')?.target).toBe(5)
  })

  it('editing a goal never mutates or removes prior versions', () => {
    const original = boxingGoal()
    const edited = addOrReplaceTargetVersion(original, { id: 'v2', effectiveFrom: '2026-09-01', target: 5, floor: 4 })
    expect(original.targetVersions).toHaveLength(1) // original untouched
    expect(edited.targetVersions).toHaveLength(2)
    expect(resolveTargetVersion(edited, '2026-01-15')?.target).toBe(4)
  })

  it('collapses same-day re-edits into a single version instead of an ambiguous duplicate', () => {
    let g = boxingGoal()
    g = addOrReplaceTargetVersion(g, { id: 'v2', effectiveFrom: '2026-09-01', target: 5, floor: 4 })
    g = addOrReplaceTargetVersion(g, { id: 'v3', effectiveFrom: '2026-09-01', target: 6, floor: 5 })
    expect(g.targetVersions).toHaveLength(2)
    expect(resolveTargetVersion(g, '2026-09-01')?.target).toBe(6)
  })
})

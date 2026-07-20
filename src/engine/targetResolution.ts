import type { Goal, GoalTypeId, ISODate, TargetVersion, TargetVersionMap } from './types'

/**
 * Finds the target version in force on `date`. Versions are never assumed to
 * be stored in order — editing a goal appends/replaces a version but never
 * re-sorts in place, so resolution always sorts first. Returns null if `date`
 * predates the goal's earliest version (the goal simply wasn't governed yet).
 *
 * The body operates on the flat `TargetVersion` union and casts back to the
 * caller's generic `K` at the end: TS cannot distribute a mapped-type lookup
 * over a still-abstract generic `K`, but the invariant — a goal's
 * `targetVersions` always match its own `type` — is enforced by construction
 * everywhere a `Goal` is built or edited (seed.ts, addOrReplaceTargetVersion).
 */
export function resolveTargetVersion<K extends GoalTypeId>(
  goal: Goal & { type: K },
  date: ISODate,
): TargetVersionMap[K] | null {
  const versions = goal.targetVersions as unknown as TargetVersion[]
  const sorted = [...versions].sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? -1 : 1))
  let candidate: TargetVersion | null = null
  for (const v of sorted) {
    if (v.effectiveFrom <= date) candidate = v
    else break
  }
  return candidate as TargetVersionMap[K] | null
}

/**
 * Appends a new target version, taking effect from `newVersion.effectiveFrom`
 * onward. Never mutates or removes prior versions — this is what makes past
 * evaluations immune to later edits. A version with the exact same
 * `effectiveFrom` as an existing one is replaced (same-day re-edits collapse
 * into one version rather than leaving ambiguous duplicates).
 */
export function addOrReplaceTargetVersion<K extends GoalTypeId>(
  goal: Goal & { type: K },
  newVersion: TargetVersionMap[K],
): Goal & { type: K } {
  const versions = goal.targetVersions as unknown as TargetVersion[]
  const withoutSameDay = versions.filter((v) => v.effectiveFrom !== newVersion.effectiveFrom)
  return {
    ...goal,
    targetVersions: [...withoutSameDay, newVersion],
  } as unknown as Goal & { type: K }
}

/** Derived only for display (e.g. Settings history) — never stored. */
export function effectiveToOf<K extends GoalTypeId>(
  goal: Goal & { type: K },
  version: TargetVersionMap[K],
): ISODate | null {
  const versions = goal.targetVersions as unknown as TargetVersion[]
  const sorted = [...versions].sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? -1 : 1))
  const idx = sorted.findIndex((v) => v.id === version.id)
  const next = sorted[idx + 1]
  return next ? next.effectiveFrom : null
}

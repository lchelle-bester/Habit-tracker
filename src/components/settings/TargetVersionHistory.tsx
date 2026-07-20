import { effectiveToOf } from '../../engine/targetResolution'
import { TabularNumber } from '../ui/TabularNumber'
import type { Goal } from '../../engine/types'

function describeVersion(goal: Goal, version: Goal['targetVersions'][number]): string {
  switch (goal.type) {
    case 'weekly_count': {
      const vv = version as { target: number; floor?: number }
      return `${vv.target}/week${vv.floor ? `, floor ${vv.floor}` : ''}`
    }
    case 'daily_time': {
      const vv = version as { defaultTime: string; overrides?: Record<number, string> }
      const overrideCount = vv.overrides ? Object.keys(vv.overrides).length : 0
      return `${vv.defaultTime}${overrideCount ? ` (${overrideCount} override${overrideCount > 1 ? 's' : ''})` : ''}`
    }
    case 'daily_duration':
    case 'weekly_duration': {
      const vv = version as { targetMinutes: number }
      return `${vv.targetMinutes} min`
    }
    case 'daily_binary':
    case 'inverted_binary':
      return 'done / not done'
  }
}

export function TargetVersionHistory({ goal }: { goal: Goal }) {
  const sorted = [...goal.targetVersions].sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? -1 : 1))
  if (sorted.length <= 1) return null

  return (
    <div className="version-history">
      <div className="version-history__label">History</div>
      {sorted.map((v) => {
        const to = effectiveToOf(goal as never, v as never)
        return (
          <div key={v.id} className="version-history__row">
            <TabularNumber>
              {v.effectiveFrom} – {to ?? 'now'}
            </TabularNumber>
            <span>{describeVersion(goal, v)}</span>
          </div>
        )
      })}
    </div>
  )
}

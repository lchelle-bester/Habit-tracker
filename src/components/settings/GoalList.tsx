import { useState } from 'react'
import { useAppStore } from '../../state/store'
import { GoalForm } from './GoalForm'
import { TargetVersionHistory } from './TargetVersionHistory'
import { Rule } from '../ui/Rule'
import { Button } from '../ui/Button'
import type { Goal } from '../../engine/types'

function targetSummary(goal: Goal): string {
  const latest = [...goal.targetVersions].sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? -1 : 1)).at(-1)
  if (!latest) return ''
  switch (goal.type) {
    case 'weekly_count': {
      const v = latest as { target: number; floor?: number }
      return `${v.target}/week${v.floor ? ` (floor ${v.floor})` : ''}`
    }
    case 'daily_time': {
      const v = latest as { defaultTime: string }
      return v.defaultTime
    }
    case 'daily_duration':
    case 'weekly_duration': {
      const v = latest as { targetMinutes: number }
      return `${v.targetMinutes} min`
    }
    default:
      return ''
  }
}

function GoalListItem({ goal }: { goal: Goal }) {
  const archiveGoal = useAppStore((s) => s.archiveGoal)
  const reactivateGoal = useAppStore((s) => s.reactivateGoal)
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="goal-list-item">
        <GoalForm mode="edit" goal={goal} onDone={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className="goal-list-item">
      <div className="goal-list-item__row">
        <div>
          <div className="goal-list-item__name">{goal.name}</div>
          <div className="goal-list-item__meta">
            {goal.schedule.length === 7 ? 'Daily' : `${goal.schedule.length}×/week`} · {targetSummary(goal)}
          </div>
        </div>
        <div className="goal-list-item__actions">
          <Button onClick={() => setEditing(true)}>Edit</Button>
          {goal.archived ? (
            <Button onClick={() => reactivateGoal(goal.id)}>Reactivate</Button>
          ) : (
            <Button onClick={() => archiveGoal(goal.id)}>Archive</Button>
          )}
        </div>
      </div>
      <TargetVersionHistory goal={goal} />
    </div>
  )
}

export function GoalList() {
  const goals = useAppStore((s) => s.goals)
  const [creating, setCreating] = useState(false)

  const active = goals.filter((g) => !g.archived)
  const archived = goals.filter((g) => g.archived)

  return (
    <div className="goal-settings-list">
      {active.map((goal, i) => (
        <div key={goal.id}>
          {i > 0 && <Rule />}
          <GoalListItem goal={goal} />
        </div>
      ))}

      {archived.length > 0 && (
        <>
          <div className="goal-settings-list__archived-label">Archived</div>
          {archived.map((goal) => (
            <div key={goal.id}>
              <Rule />
              <GoalListItem goal={goal} />
            </div>
          ))}
        </>
      )}

      <Rule strong />

      {creating ? (
        <GoalForm mode="create" onDone={() => setCreating(false)} />
      ) : (
        <Button variant="primary" onClick={() => setCreating(true)}>
          Add a goal
        </Button>
      )}
    </div>
  )
}

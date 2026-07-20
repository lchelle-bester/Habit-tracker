import { useState } from 'react'
import { useAppStore } from '../../state/store'
import { dailyTimeDelta } from '../../engine/evaluateDay'
import { resolveTargetVersion } from '../../engine/targetResolution'
import { weekdayOf } from '../../engine/dates'
import { TabularNumber } from '../ui/TabularNumber'
import type { Entry, Goal, ISODate } from '../../engine/types'

function formatDelta(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '−'
  const abs = Math.abs(minutes)
  return `${sign}${abs} min`
}

export function GoalRowTime({ goal, entry, date }: { goal: Goal & { type: 'daily_time' }; entry: Entry | undefined; date: ISODate }) {
  const upsertEntry = useAppStore((s) => s.upsertEntry)
  const e = entry as (Entry & { type: 'daily_time' }) | undefined
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const version = resolveTargetVersion(goal, date)
  const targetTime = version ? (version.overrides?.[weekdayOf(date)] ?? version.defaultTime) : null
  const delta = e?.actualTime ? dailyTimeDelta(goal, e, date) : null

  const startEditing = () => {
    setDraft(e?.actualTime ?? '')
    setEditing(true)
  }

  const commit = () => {
    upsertEntry({ type: 'daily_time', goalId: goal.id, date, actualTime: draft === '' ? null : draft })
    setEditing(false)
  }

  if (!editing) {
    return (
      <button type="button" className="goal-row" onClick={startEditing}>
        <div className="goal-row__name">{goal.name}</div>
        <div className="goal-row__status">
          {e?.actualTime ? (
            <TabularNumber>
              {e.actualTime} · {delta != null ? formatDelta(delta) : ''}
            </TabularNumber>
          ) : (
            <span className="goal-row__prompt">Log bedtime — target {targetTime ?? '—'}</span>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="goal-row goal-row--editing">
      <div className="goal-row__name">{goal.name}</div>
      <div className="ui-field">
        <label>Actual time</label>
        <input
          type="time"
          autoFocus
          value={draft}
          onChange={(ev) => setDraft(ev.target.value)}
          onBlur={commit}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') commit()
          }}
        />
      </div>
    </div>
  )
}

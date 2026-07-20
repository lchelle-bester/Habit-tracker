import { useState } from 'react'
import { useAppStore } from '../../state/store'
import { resolveTargetVersion } from '../../engine/targetResolution'
import { TabularNumber } from '../ui/TabularNumber'
import type { Entry, Goal, ISODate } from '../../engine/types'

export function GoalRowWeeklyDuration({ goal, entry, date }: { goal: Goal & { type: 'weekly_duration' }; entry: Entry | undefined; date: ISODate }) {
  const upsertEntry = useAppStore((s) => s.upsertEntry)
  const e = entry as (Entry & { type: 'weekly_duration' }) | undefined
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const target = resolveTargetVersion(goal, date)

  const startEditing = () => {
    setDraft(e?.actualMinutes != null ? String(e.actualMinutes) : '')
    setEditing(true)
  }

  const commit = () => {
    const minutes = draft === '' ? null : Number(draft)
    upsertEntry({ type: 'weekly_duration', goalId: goal.id, date, actualMinutes: minutes })
    setEditing(false)
  }

  if (!editing) {
    return (
      <button type="button" className="goal-row" onClick={startEditing}>
        <div className="goal-row__name">{goal.name}</div>
        <div className="goal-row__status">
          {e?.actualMinutes != null ? (
            <TabularNumber>
              {e.actualMinutes} / {target?.targetMinutes ?? '—'} min
            </TabularNumber>
          ) : (
            <span className="goal-row__prompt">Log minutes — target {target?.targetMinutes ?? '—'}</span>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="goal-row goal-row--editing">
      <div className="goal-row__name">{goal.name}</div>
      <div className="ui-field">
        <label>Minutes</label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
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

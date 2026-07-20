import { useState } from 'react'
import { useAppStore } from '../../state/store'
import { today } from '../../engine/dates'
import { WeekdayPicker } from './WeekdayPicker'
import { Button } from '../ui/Button'
import type { Goal, GoalTypeId, TargetVersionMap, Weekday } from '../../engine/types'

const TYPE_LABELS: Record<GoalTypeId, string> = {
  weekly_count: 'Weekly count',
  daily_time: 'Daily time target',
  daily_duration: 'Daily duration',
  daily_binary: 'Daily done/not done',
  weekly_duration: 'Weekly duration',
  inverted_binary: 'Negative goal (no streaks)',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function uuid(): string {
  return crypto.randomUUID()
}

interface GoalFormProps {
  mode: 'create' | 'edit'
  goal?: Goal
  onDone: () => void
}

export function GoalForm({ mode, goal, onDone }: GoalFormProps) {
  const addGoal = useAppStore((s) => s.addGoal)
  const renameGoal = useAppStore((s) => s.renameGoal)
  const updateSchedule = useAppStore((s) => s.updateSchedule)
  const editGoalTargetVersion = useAppStore((s) => s.editGoalTargetVersion)

  const [type, setType] = useState<GoalTypeId>(goal?.type ?? 'daily_binary')
  const [name, setName] = useState(goal?.name ?? '')
  const [schedule, setSchedule] = useState<Weekday[]>(goal?.schedule ?? [0, 1, 2, 3, 4, 5, 6])
  const [effectiveFrom, setEffectiveFrom] = useState(today())

  const latest = goal ? [...goal.targetVersions].sort((a, b) => (a.effectiveFrom < b.effectiveFrom ? -1 : 1)).at(-1) : undefined

  const [targetCount, setTargetCount] = useState((latest as { target?: number } | undefined)?.target ?? 4)
  const [floor, setFloor] = useState<number | null>((latest as { floor?: number } | undefined)?.floor ?? null)
  const [defaultTime, setDefaultTime] = useState((latest as { defaultTime?: string } | undefined)?.defaultTime ?? '23:00')
  const [overrides, setOverrides] = useState<Partial<Record<Weekday, string>>>(
    (latest as { overrides?: Partial<Record<Weekday, string>> } | undefined)?.overrides ?? {},
  )
  const [targetMinutes, setTargetMinutes] = useState((latest as { targetMinutes?: number } | undefined)?.targetMinutes ?? 15)

  const buildVersion = (versionId: string, versionEffectiveFrom: string): TargetVersionMap[GoalTypeId] => {
    switch (type) {
      case 'weekly_count':
        return { id: versionId, effectiveFrom: versionEffectiveFrom, target: targetCount, floor: floor ?? undefined }
      case 'daily_time':
        return { id: versionId, effectiveFrom: versionEffectiveFrom, defaultTime, overrides: overrides }
      case 'daily_duration':
      case 'weekly_duration':
        return { id: versionId, effectiveFrom: versionEffectiveFrom, targetMinutes }
      case 'daily_binary':
      case 'inverted_binary':
        return { id: versionId, effectiveFrom: versionEffectiveFrom }
    }
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!name.trim()) return

    if (mode === 'create') {
      const t = today()
      const newGoal = {
        id: uuid(),
        name: name.trim(),
        type,
        schedule,
        activeFrom: t,
        activeTo: null,
        archived: false,
        targetVersions: [buildVersion(uuid(), t)],
      } as unknown as Goal
      addGoal(newGoal)
    } else if (goal) {
      if (name.trim() !== goal.name) renameGoal(goal.id, name.trim())
      if (JSON.stringify(schedule) !== JSON.stringify(goal.schedule)) updateSchedule(goal.id, schedule)
      if (goal.type !== 'daily_binary' && goal.type !== 'inverted_binary') {
        editGoalTargetVersion(goal.id, buildVersion(uuid(), effectiveFrom) as never)
      }
    }
    onDone()
  }

  const showTargetFields = mode === 'create' ? type !== 'daily_binary' && type !== 'inverted_binary' : goal?.type !== 'daily_binary' && goal?.type !== 'inverted_binary'
  const effectiveType = mode === 'create' ? type : goal!.type

  return (
    <form className="goal-form" onSubmit={handleSubmit}>
      <div className="ui-field">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </div>

      {mode === 'create' && (
        <div className="ui-field">
          <label>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as GoalTypeId)}>
            {Object.entries(TYPE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="ui-field">
        <label>Schedule</label>
        <WeekdayPicker value={schedule} onChange={setSchedule} />
      </div>

      {mode === 'edit' && showTargetFields && (
        <div className="ui-field">
          <label>Change effective from</label>
          <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
        </div>
      )}

      {effectiveType === 'weekly_count' && (
        <>
          <div className="ui-field">
            <label>Target per week</label>
            <input type="number" min={1} value={targetCount} onChange={(e) => setTargetCount(Number(e.target.value))} />
          </div>
          <div className="ui-field">
            <label>Floor (optional — still counts as a pass)</label>
            <input
              type="number"
              min={0}
              value={floor ?? ''}
              onChange={(e) => setFloor(e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
        </>
      )}

      {effectiveType === 'daily_time' && (
        <>
          <div className="ui-field">
            <label>Default target time</label>
            <input type="time" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} />
          </div>
          <div className="ui-field">
            <label>Per-day overrides</label>
            <div className="overrides-grid">
              {schedule.map((d) => (
                <div key={d} className="overrides-grid__row">
                  <span>{DAY_NAMES[d]}</span>
                  <input
                    type="time"
                    value={overrides[d] ?? ''}
                    onChange={(e) =>
                      setOverrides((prev) => {
                        const next = { ...prev }
                        if (e.target.value === '') delete next[d]
                        else next[d] = e.target.value
                        return next
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {(effectiveType === 'daily_duration' || effectiveType === 'weekly_duration') && (
        <div className="ui-field">
          <label>Target minutes</label>
          <input type="number" min={1} value={targetMinutes} onChange={(e) => setTargetMinutes(Number(e.target.value))} />
        </div>
      )}

      <div className="goal-form__actions">
        <Button type="button" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save
        </Button>
      </div>
    </form>
  )
}

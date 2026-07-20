import { useAppStore } from '../../state/store'
import { Toggle } from '../ui/Toggle'
import type { Entry, Goal, ISODate } from '../../engine/types'

export function GoalRowBinary({ goal, entry, date }: { goal: Goal & { type: 'daily_binary' }; entry: Entry | undefined; date: ISODate }) {
  const upsertEntry = useAppStore((s) => s.upsertEntry)
  const e = entry as (Entry & { type: 'daily_binary' }) | undefined
  const done = e?.done ?? false

  return (
    <div className="goal-row">
      <div className="goal-row__name">{goal.name}</div>
      <Toggle
        label={done ? 'Done' : 'Not yet'}
        checked={done}
        onChange={(checked) => upsertEntry({ type: 'daily_binary', goalId: goal.id, date, done: checked })}
      />
    </div>
  )
}

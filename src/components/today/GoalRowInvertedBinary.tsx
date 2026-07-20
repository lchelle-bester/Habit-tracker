import { useAppStore } from '../../state/store'
import { Toggle } from '../ui/Toggle'
import type { Entry, Goal, ISODate } from '../../engine/types'

/** Negative goal: default/absent state is success. The toggle logs that it DID occur — never a streak, never framed as "done". */
export function GoalRowInvertedBinary({ goal, entry, date }: { goal: Goal & { type: 'inverted_binary' }; entry: Entry | undefined; date: ISODate }) {
  const upsertEntry = useAppStore((s) => s.upsertEntry)
  const e = entry as (Entry & { type: 'inverted_binary' }) | undefined
  const occurred = e?.occurred ?? false

  return (
    <div className="goal-row">
      <div className="goal-row__name">{goal.name}</div>
      <Toggle
        label={occurred ? 'Happened today' : 'Clean so far'}
        checked={!occurred}
        onChange={(checked) => upsertEntry({ type: 'inverted_binary', goalId: goal.id, date, occurred: !checked })}
      />
    </div>
  )
}

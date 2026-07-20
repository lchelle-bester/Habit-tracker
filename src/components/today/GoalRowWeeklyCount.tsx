import { useAppStore } from '../../state/store'
import { aggregateWeek } from '../../engine/aggregateWeek'
import { isoWeekStart } from '../../engine/dates'
import { Toggle } from '../ui/Toggle'
import { TabularNumber } from '../ui/TabularNumber'
import type { Entry, Goal, ISODate } from '../../engine/types'

/** Shows week-to-date progress ("3/4") rather than a daily checkbox — the weekly count is what actually matters. */
export function GoalRowWeeklyCount({ goal, entry, date }: { goal: Goal & { type: 'weekly_count' }; entry: Entry | undefined; date: ISODate }) {
  const upsertEntry = useAppStore((s) => s.upsertEntry)
  const allEntries = useAppStore((s) => s.entries)
  const e = entry as (Entry & { type: 'weekly_count' }) | undefined
  const done = e?.done ?? false

  const entriesForGoal = allEntries.filter((en) => en.goalId === goal.id)
  const agg = aggregateWeek(goal, isoWeekStart(date), entriesForGoal, date)

  return (
    <div className="goal-row">
      <div className="goal-row__name">{goal.name}</div>
      <div className="goal-row__meta">
        <TabularNumber>
          {agg.count}/{agg.target}
        </TabularNumber>
        <span className="goal-row__meta-label">this week</span>
      </div>
      <Toggle
        label={done ? 'Logged' : 'Log today'}
        checked={done}
        onChange={(checked) => upsertEntry({ type: 'weekly_count', goalId: goal.id, date, done: checked })}
      />
    </div>
  )
}

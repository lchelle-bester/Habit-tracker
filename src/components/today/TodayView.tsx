import { useMemo } from 'react'
import { useAppStore } from '../../state/store'
import { today as todayFn } from '../../engine/dates'
import { goalsScheduledOn } from '../../engine/selectors'
import { evaluatePushbackFlags } from '../../engine/pushback'
import { GoalRow } from './GoalRow'
import { VerseCard } from './VerseCard'
import { PushbackBanner } from './PushbackBanner'
import { Rule } from '../ui/Rule'
import type { AppData } from '../../engine/types'
import './today.css'

export function TodayView() {
  const goals = useAppStore((s) => s.goals)
  const entries = useAppStore((s) => s.entries)
  const settings = useAppStore((s) => s.settings)
  const meta = useAppStore((s) => s.meta)

  const date = todayFn()

  const appData: AppData = useMemo(
    () => ({ schemaVersion: 1, goals, entries, settings, meta }),
    [goals, entries, settings, meta],
  )

  const scheduledGoals = useMemo(() => goalsScheduledOn(appData, date), [appData, date])
  const flag = useMemo(() => evaluatePushbackFlags(appData, date), [appData, date])
  const entryByGoal = useMemo(() => new Map(entries.map((e) => [`${e.goalId}|${e.date}`, e])), [entries])

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="today-view">
      <h1 className="today-view__date">{formattedDate}</h1>

      <div className="goal-list">
        {scheduledGoals.length === 0 && <p className="today-view__empty">Nothing scheduled today.</p>}
        {scheduledGoals.map((goal, i) => (
          <div key={goal.id}>
            {i > 0 && <Rule />}
            <GoalRow goal={goal} entry={entryByGoal.get(`${goal.id}|${date}`)} date={date} />
          </div>
        ))}
      </div>

      <PushbackBanner flag={flag} />
      <VerseCard date={date} />
    </div>
  )
}

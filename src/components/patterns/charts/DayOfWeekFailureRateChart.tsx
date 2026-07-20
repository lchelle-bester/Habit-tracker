import { useMemo } from 'react'
import { useAppStore } from '../../../state/store'
import { datesInRange, today as todayFn, weekdayOf } from '../../../engine/dates'
import { dailySuccessProxy } from '../patternsSelectors'
import { BarChart } from '../chartPrimitives/BarChart'
import type { Goal } from '../../../engine/types'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MIN_SAMPLES_PER_GOAL = 4

function failureRateByWeekday(goal: Goal, entryByKey: Map<string, unknown>, todayDate: string): (number | null)[] {
  const days = datesInRange(goal.activeFrom, todayDate)
  const buckets: { fails: number; total: number }[] = Array.from({ length: 7 }, () => ({ fails: 0, total: 0 }))

  for (const d of days) {
    const entry = entryByKey.get(`${goal.id}|${d}`) as never
    const proxy = dailySuccessProxy(goal, entry, d, todayDate)
    if (proxy == null) continue
    // Convert JS weekday (0=Sun) to Mon-first index (0=Mon..6=Sun) matching DAY_LABELS.
    const idx = (weekdayOf(d) + 6) % 7
    buckets[idx].total++
    if (!proxy) buckets[idx].fails++
  }

  return buckets.map((b) => (b.total >= MIN_SAMPLES_PER_GOAL ? b.fails / b.total : null))
}

export function DayOfWeekFailureRateChart() {
  const goals = useAppStore((s) => s.goals)
  const entries = useAppStore((s) => s.entries)
  const todayDate = todayFn()

  const perGoal = useMemo(() => {
    const entryByKey = new Map(entries.map((e) => [`${e.goalId}|${e.date}`, e]))
    return goals
      .filter((g) => !g.archived)
      .map((g) => ({ goal: g, rates: failureRateByWeekday(g, entryByKey, todayDate) }))
  }, [goals, entries, todayDate])

  const anyData = perGoal.some(({ rates }) => rates.some((r) => r != null))

  return (
    <div className="pattern-section">
      <div className="pattern-section__question">Which days actually break?</div>
      <p className="pattern-section__note">Failure rate by day of week, across each goal's full history.</p>
      {anyData ? (
        <div className="small-multiples">
          {perGoal.map(({ goal, rates }) =>
            rates.some((r) => r != null) ? (
              <div key={goal.id}>
                <div className="small-multiple__label">{goal.name}</div>
                <BarChart bars={DAY_LABELS.map((label, i) => ({ label, value: rates[i] ?? 0 }))} valueFormat={(v) => `${Math.round(v * 100)}%`} />
              </div>
            ) : null,
          )}
        </div>
      ) : (
        <p className="pattern-section__empty">Not enough history yet — each day needs a few weeks of data before a rate means anything.</p>
      )}
    </div>
  )
}

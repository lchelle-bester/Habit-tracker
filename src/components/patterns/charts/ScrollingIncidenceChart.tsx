import { useMemo } from 'react'
import { useAppStore } from '../../../state/store'
import { datesInRange, today as todayFn, weekdayOf } from '../../../engine/dates'
import { findGoalByName } from '../../../engine/selectors'
import { BarChart } from '../chartPrimitives/BarChart'
import { timeToMinutes } from '../../../engine/dates'
import type { Entry } from '../../../engine/types'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HOUR_BUCKETS = [
  { label: 'Morning', from: 5, to: 12 },
  { label: 'Afternoon', from: 12, to: 17 },
  { label: 'Evening', from: 17, to: 22 },
  { label: 'Night', from: 22, to: 5 },
]

export function ScrollingIncidenceChart() {
  const goals = useAppStore((s) => s.goals)
  const entries = useAppStore((s) => s.entries)
  const todayDate = todayFn()

  const { byDay, byHour, occurredCount } = useMemo(() => {
    const goal = findGoalByName(goals, 'No scrolling')
    if (!goal) return { byDay: null, byHour: null, occurredCount: 0 }

    const goalEntries = entries.filter(
      (e): e is Entry & { type: 'inverted_binary' } => e.goalId === goal.id && e.type === 'inverted_binary',
    )
    const days = datesInRange(goal.activeFrom, todayDate)
    const occurredDates = new Set(goalEntries.filter((e) => e.occurred).map((e) => e.date))

    const dayBuckets = Array.from({ length: 7 }, () => ({ occurred: 0, total: 0 }))
    for (const d of days) {
      const idx = (weekdayOf(d) + 6) % 7
      dayBuckets[idx].total++
      if (occurredDates.has(d)) dayBuckets[idx].occurred++
    }
    const byDay = dayBuckets.map((b) => (b.total > 0 ? b.occurred / b.total : 0))

    const timed = goalEntries.filter((e) => e.occurred && e.occurredAt)
    let byHour: number[] | null = null
    if (timed.length > 0) {
      const counts = HOUR_BUCKETS.map(() => 0)
      for (const e of timed) {
        const mins = timeToMinutes(e.occurredAt!)
        const hour = Math.floor(mins / 60)
        const bucketIdx = HOUR_BUCKETS.findIndex((b) => (b.from < b.to ? hour >= b.from && hour < b.to : hour >= b.from || hour < b.to))
        if (bucketIdx >= 0) counts[bucketIdx]++
      }
      const max = Math.max(...counts, 1)
      byHour = counts.map((c) => c / max)
    }

    return { byDay, byHour, occurredCount: occurredDates.size }
  }, [goals, entries, todayDate])

  if (!byDay) {
    return (
      <div className="pattern-section">
        <div className="pattern-section__question">When does scrolling actually happen?</div>
        <p className="pattern-section__empty">No scrolling goal not found.</p>
      </div>
    )
  }

  return (
    <div className="pattern-section">
      <div className="pattern-section__question">When does scrolling actually happen?</div>
      <p className="pattern-section__note">Incidence by day of week{byHour ? ', and by time of day when logged' : ''}.</p>
      {occurredCount > 0 ? (
        <>
          <BarChart bars={DAY_LABELS.map((label, i) => ({ label, value: byDay[i] }))} valueFormat={(v) => `${Math.round(v * 100)}%`} />
          {byHour && (
            <div style={{ marginTop: 'var(--space-5)' }}>
              <div className="small-multiple__label">By time of day</div>
              <BarChart bars={HOUR_BUCKETS.map((b, i) => ({ label: b.label, value: byHour![i] }))} />
            </div>
          )}
        </>
      ) : (
        <p className="pattern-section__empty">No scrolling logged yet — this chart fills in as it happens.</p>
      )}
    </div>
  )
}

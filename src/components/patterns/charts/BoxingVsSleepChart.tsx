import { useMemo } from 'react'
import { useAppStore } from '../../../state/store'
import { addDays, datesInRange, isoWeekStart, today as todayFn } from '../../../engine/dates'
import { aggregateWeek } from '../../../engine/aggregateWeek'
import { dailyTimeDelta } from '../../../engine/evaluateDay'
import { findGoalByName } from '../../../engine/selectors'
import { LineChart } from '../chartPrimitives/LineChart'

const WEEKS = 8

export function BoxingVsSleepChart() {
  const goals = useAppStore((s) => s.goals)
  const entries = useAppStore((s) => s.entries)
  const todayDate = todayFn()

  const { xLabels, sessionsPerWeek, sleepAvgPerWeek, hasData } = useMemo(() => {
    const boxing = findGoalByName(goals, 'Boxing')
    const sleep = findGoalByName(goals, 'Sleep')
    const currentWeekStart = isoWeekStart(todayDate)
    const weekStarts = Array.from({ length: WEEKS }, (_, i) => addDays(currentWeekStart, -(WEEKS - 1 - i) * 7))

    if (!boxing || boxing.type !== 'weekly_count' || !sleep || sleep.type !== 'daily_time') {
      return { xLabels: [], sessionsPerWeek: [], sleepAvgPerWeek: [], hasData: false }
    }

    const boxingEntries = entries.filter((e) => e.goalId === boxing.id)
    const sleepEntries = entries.filter((e) => e.goalId === sleep.id)
    const sleepByDate = new Map(sleepEntries.map((e) => [e.date, e]))

    const sessionsPerWeek = weekStarts.map((w) => {
      if (w < isoWeekStart(boxing.activeFrom)) return null
      return aggregateWeek(boxing, w, boxingEntries, todayDate).count
    })

    const sleepAvgPerWeek = weekStarts.map((w) => {
      const weekDates = datesInRange(w, addDays(w, 6))
      const deltas = weekDates
        .map((d) => {
          const e = sleepByDate.get(d)
          return e && e.type === 'daily_time' ? dailyTimeDelta(sleep, e, d) : null
        })
        .filter((v): v is number => v != null)
      return deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : null
    })

    const hasData = sessionsPerWeek.some((v) => v != null) && sleepAvgPerWeek.some((v) => v != null)
    return { xLabels: weekStarts.map((_, i) => `W-${WEEKS - 1 - i}`), sessionsPerWeek, sleepAvgPerWeek, hasData }
  }, [goals, entries, todayDate])

  return (
    <div className="pattern-section">
      <div className="pattern-section__question">Does a good sleep week track with a good boxing week?</div>
      <p className="pattern-section__note">Boxing sessions per week against that week's average sleep delta, last {WEEKS} weeks.</p>
      {hasData ? (
        <LineChart
          series={[
            { label: 'Sessions', values: sessionsPerWeek, emphasis: true },
            { label: 'Sleep avg', values: sleepAvgPerWeek },
          ]}
          xLabels={xLabels}
        />
      ) : (
        <p className="pattern-section__empty">Not enough weeks of Boxing and Sleep data yet.</p>
      )}
    </div>
  )
}

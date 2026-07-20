import { useMemo } from 'react'
import { useAppStore } from '../../../state/store'
import { addDays, datesInRange, today as todayFn } from '../../../engine/dates'
import { dailyTimeDelta } from '../../../engine/evaluateDay'
import { LineChart } from '../chartPrimitives/LineChart'
import { dailySuccessProxy } from '../patternsSelectors'
import type { Goal } from '../../../engine/types'

const WINDOW_DAYS = 30
const MIN_NIGHTS = 5

export function SleepDeltaOverlayChart() {
  const goals = useAppStore((s) => s.goals)
  const entries = useAppStore((s) => s.entries)
  const todayDate = todayFn()

  const { xLabels, series, hasEnoughData } = useMemo(() => {
    const sleepGoal = goals.find((g) => g.name === 'Sleep' && g.type === 'daily_time') as (Goal & { type: 'daily_time' }) | undefined
    const start = addDays(todayDate, -(WINDOW_DAYS - 1))
    const days = datesInRange(start, todayDate)
    const entryByKey = new Map(entries.map((e) => [`${e.goalId}|${e.date}`, e]))

    if (!sleepGoal) return { xLabels: days, series: [], hasEnoughData: false }

    const sleepValues = days.map((d) => {
      const e = entryByKey.get(`${sleepGoal.id}|${d}`)
      return e && e.type === 'daily_time' ? dailyTimeDelta(sleepGoal, e, d) : null
    })
    const validDeltas = sleepValues.filter((v): v is number => v != null)
    if (validDeltas.length < MIN_NIGHTS) return { xLabels: days, series: [], hasEnoughData: false }

    const domainMax = Math.max(...validDeltas, 0)
    const domainMin = Math.min(...validDeltas, 0)
    const high = domainMax * 0.9 || 5
    const low = domainMin * 0.9 || -5

    const otherGoals = goals.filter((g) => !g.archived && g.name !== 'Sleep')
    const overlaySeries = otherGoals.map((g) => ({
      label: g.name,
      values: days.map((d) => {
        const e = entryByKey.get(`${g.id}|${d}`)
        const proxy = dailySuccessProxy(g, e, d, todayDate)
        return proxy == null ? null : proxy ? high : low
      }),
    }))

    return {
      xLabels: days,
      series: [{ label: 'Sleep delta', values: sleepValues, emphasis: true }, ...overlaySeries],
      hasEnoughData: true,
    }
  }, [goals, entries, todayDate])

  return (
    <div className="pattern-section">
      <div className="pattern-section__question">Does a late night actually drag the next day down?</div>
      <p className="pattern-section__note">
        Sleep delta (minutes early/late) over the last {WINDOW_DAYS} days, with the other goals' daily pass/fail traced faintly beneath it.
      </p>
      {hasEnoughData ? (
        <LineChart series={series} xLabels={xLabels.map((d) => d.slice(5))} yFormat={(v) => `${v > 0 ? '+' : ''}${Math.round(v)}m`} />
      ) : (
        <p className="pattern-section__empty">Not enough logged nights yet — check back after a week or two of Sleep entries.</p>
      )}
    </div>
  )
}

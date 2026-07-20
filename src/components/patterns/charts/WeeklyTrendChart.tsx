import { useMemo } from 'react'
import { useAppStore } from '../../../state/store'
import { today as todayFn } from '../../../engine/dates'
import { LineChart } from '../chartPrimitives/LineChart'
import { weeklyCompletionRatios } from '../patternsSelectors'
import type { Goal } from '../../../engine/types'

const WEEKS = 8

export function WeeklyTrendChart({ goal }: { goal: Goal }) {
  const entries = useAppStore((s) => s.entries)
  const todayDate = todayFn()

  const ratios = useMemo(() => weeklyCompletionRatios(goal, entries, todayDate), [goal, entries, todayDate])
  // A single point isn't a trend — wait for at least 2 weeks before this chart earns its place.
  const hasEnoughData = ratios.filter((r) => r != null).length >= 2

  if (!hasEnoughData) return null

  return (
    <div>
      <div className="small-multiple__label">{goal.name}</div>
      <LineChart
        series={[{ label: `${Math.round((ratios.filter((r) => r != null).at(-1) ?? 0) * 100)}%`, values: ratios.map((r) => (r == null ? null : r * 100)), emphasis: true }]}
        xLabels={ratios.map((_, i) => `W-${WEEKS - 1 - i}`)}
        yDomain={[0, 100]}
      />
    </div>
  )
}

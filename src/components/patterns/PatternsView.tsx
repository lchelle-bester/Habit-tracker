import { useAppStore } from '../../state/store'
import { Rule } from '../ui/Rule'
import { SleepDeltaOverlayChart } from './charts/SleepDeltaOverlayChart'
import { BedtimeCorrelationStat } from './charts/BedtimeCorrelationStat'
import { DayOfWeekFailureRateChart } from './charts/DayOfWeekFailureRateChart'
import { ScrollingIncidenceChart } from './charts/ScrollingIncidenceChart'
import { WeeklyTrendChart } from './charts/WeeklyTrendChart'
import { BoxingVsSleepChart } from './charts/BoxingVsSleepChart'
import { StreakStatList } from './charts/StreakStatList'
import { weeklyCompletionRatios } from './patternsSelectors'
import { today as todayFn } from '../../engine/dates'
import './patterns.css'

export function PatternsView() {
  const goals = useAppStore((s) => s.goals)
  const entries = useAppStore((s) => s.entries)
  const todayDate = todayFn()
  const activeGoals = goals.filter((g) => !g.archived)
  const anyTrendData = activeGoals.some(
    (g) => weeklyCompletionRatios(g, entries, todayDate).filter((r) => r != null).length >= 2,
  )

  return (
    <div className="patterns-view">
      <h1 className="page-title">Patterns</h1>

      <SleepDeltaOverlayChart />
      <Rule />
      <BedtimeCorrelationStat />
      <Rule />
      <DayOfWeekFailureRateChart />
      <Rule />
      <ScrollingIncidenceChart />
      <Rule />

      <div className="pattern-section">
        <div className="pattern-section__question">Weekly completion trend, 8-week rolling</div>
        {anyTrendData ? (
          <div className="small-multiples">
            {activeGoals.map((goal) => (
              <WeeklyTrendChart key={goal.id} goal={goal} />
            ))}
          </div>
        ) : (
          <p className="pattern-section__empty">Not enough weeks yet — this fills in after a couple of weeks of use.</p>
        )}
      </div>
      <Rule />

      <BoxingVsSleepChart />
      <Rule />

      <StreakStatList />
    </div>
  )
}

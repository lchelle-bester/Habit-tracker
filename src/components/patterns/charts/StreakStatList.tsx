import { useMemo } from 'react'
import { useAppStore } from '../../../state/store'
import { today as todayFn } from '../../../engine/dates'
import { computeStreak } from '../../../engine/streaks'

export function StreakStatList() {
  const goals = useAppStore((s) => s.goals)
  const entries = useAppStore((s) => s.entries)
  const todayDate = todayFn()

  const rows = useMemo(
    () =>
      goals
        .filter((g) => !g.archived)
        .map((goal) => ({ goal, streak: computeStreak(goal, entries, todayDate) }))
        // computeStreak is null exactly for inverted_binary — negative goals never get a streak, by design.
        .filter((r): r is { goal: typeof r.goal; streak: NonNullable<typeof r.streak> } => r.streak != null),
    [goals, entries, todayDate],
  )

  return (
    <div className="pattern-section">
      <div className="pattern-section__question">Current and longest runs</div>
      <p className="pattern-section__note">Positive goals only — a negative goal has no streak to keep.</p>
      <div className="streak-list">
        {rows.map(({ goal, streak }) => (
          <div key={goal.id} className="streak-list__row">
            <span className="streak-list__name">{goal.name}</span>
            <span className="streak-list__numbers tabular">
              <span>
                <b>{streak.current}</b>current {streak.unit}
                {streak.current === 1 ? '' : 's'}
              </span>
              <span>
                <b>{streak.longest}</b>longest
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

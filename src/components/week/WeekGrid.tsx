import { useMemo, useState } from 'react'
import { useAppStore } from '../../state/store'
import { addDays, datesInRange, isoWeekStart, today as todayFn, weekdayOf } from '../../engine/dates'
import { evaluateDay } from '../../engine/evaluateDay'
import { TabularNumber } from '../ui/TabularNumber'
import type { DayStatus, Entry, Goal, ISODate } from '../../engine/types'
import './week.css'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function weeklyTypeCellStatus(entry: Entry | undefined, date: ISODate, todayDate: ISODate): DayStatus {
  const logged =
    entry?.type === 'weekly_count' ? entry.done : entry?.type === 'weekly_duration' ? entry.actualMinutes != null : false
  if (logged) return 'pass'
  if (date === todayDate) return 'pending'
  if (date > todayDate) return 'pending'
  return 'fail'
}

function cellMark(status: DayStatus): string {
  switch (status) {
    case 'pass':
      return '—'
    case 'fail':
      return '·'
    case 'pending':
      return '·'
    case 'not_scheduled':
      return ''
  }
}

function GoalWeekRow({ goal, weekDates, entryByDate, todayDate }: { goal: Goal; weekDates: ISODate[]; entryByDate: Map<string, Entry>; todayDate: ISODate }) {
  return (
    <div className="week-row">
      <div className="week-row__name">{goal.name}</div>
      <div className="week-row__cells">
        {weekDates.map((date) => {
          const entry = entryByDate.get(`${goal.id}|${date}`)
          const status =
            goal.type === 'weekly_count' || goal.type === 'weekly_duration'
              ? goal.schedule.includes(weekdayOf(date))
                ? weeklyTypeCellStatus(entry, date, todayDate)
                : ('not_scheduled' as DayStatus)
              : evaluateDay(goal, entry, date, todayDate)
          return (
            <div key={date} className={`week-cell week-cell--${status}`} title={`${goal.name} · ${date}`}>
              {cellMark(status)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function WeekGrid() {
  const goals = useAppStore((s) => s.goals)
  const entries = useAppStore((s) => s.entries)
  const todayDate = todayFn()
  const [weekOffset, setWeekOffset] = useState(0)

  const weekStart = useMemo(() => addDays(isoWeekStart(todayDate), weekOffset * 7), [todayDate, weekOffset])
  const weekDates = useMemo(() => datesInRange(weekStart, addDays(weekStart, 6)), [weekStart])
  const weekEnd = weekDates[6]

  const entryByDate = useMemo(() => new Map(entries.map((e) => [`${e.goalId}|${e.date}`, e])), [entries])
  const goalsForWeek = useMemo(
    () => goals.filter((g) => !g.archived && g.activeFrom <= weekEnd && (g.activeTo === null || g.activeTo >= weekStart)),
    [goals, weekEnd, weekStart],
  )

  return (
    <div className="week-grid">
      <div className="week-nav">
        <button type="button" onClick={() => setWeekOffset((o) => o - 1)}>
          ← Prev
        </button>
        <span className="week-nav__label">
          <TabularNumber>
            {weekStart} – {weekEnd}
          </TabularNumber>
        </span>
        <button type="button" onClick={() => setWeekOffset((o) => o + 1)} disabled={weekOffset >= 0}>
          Next →
        </button>
      </div>

      <div className="week-row week-row--header">
        <div className="week-row__name" />
        <div className="week-row__cells">
          {weekDates.map((date, i) => (
            <div key={date} className={`week-cell week-cell--header${date === todayDate ? ' week-cell--today' : ''}`}>
              <div>{DAY_LABELS[i]}</div>
              <TabularNumber>{Number(date.slice(8, 10))}</TabularNumber>
            </div>
          ))}
        </div>
      </div>

      {goalsForWeek.map((goal) => (
        <GoalWeekRow key={goal.id} goal={goal} weekDates={weekDates} entryByDate={entryByDate} todayDate={todayDate} />
      ))}
    </div>
  )
}

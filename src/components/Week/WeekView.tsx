import { Fragment, useState } from 'react';
import { useData } from '../../storage/DataContext';
import { addDays, formatShortDate, startOfWeek, todayISO, WEEKDAY_LABELS, getWeekday, compareISO } from '../../engine/date';
import { isScheduledOn } from '../../engine/schedule';
import { evaluateDay, evaluateWeek, logFor } from '../../engine/evaluate';
import './Week.css';

function DayCell({ status, logged }: { status: string; logged: boolean }) {
  if (status === 'not_scheduled') return <span className="wk-mark wk-mark-empty" />;
  if (status === 'pass') return <span className="wk-mark wk-mark-pass" />;
  if (status === 'floor') return <span className="wk-mark wk-mark-floor" />;
  if (status === 'pending') return <span className={logged ? 'wk-mark wk-mark-pass-dim' : 'wk-mark wk-mark-pending'} />;
  return <span className="wk-mark wk-mark-fail" />;
}

export function WeekView() {
  const { goals, logs } = useData();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayISO()));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = todayISO();
  const isCurrentWeek = weekStart === startOfWeek(today);

  const activeGoals = goals.filter((g) => !g.archived && days.some((d) => isScheduledOn(g, d)));

  return (
    <div className="week-view">
      <div className="week-nav">
        <button className="control-text" onClick={() => setWeekStart((w) => addDays(w, -7))}>
          ‹ prev
        </button>
        <span className="week-range num">
          {formatShortDate(weekStart)} – {formatShortDate(addDays(weekStart, 6))}
        </span>
        <button className="control-text" onClick={() => setWeekStart((w) => addDays(w, 7))} disabled={isCurrentWeek}>
          {isCurrentWeek ? '' : 'next ›'}
        </button>
      </div>

      <div className="week-grid" style={{ gridTemplateColumns: `minmax(84px, 1.3fr) repeat(7, 1fr) 56px` }}>
        <div className="week-head-cell" />
        {days.map((d) => (
          <div key={d} className={compareISO(d, today) === 0 ? 'week-head-cell week-head-today' : 'week-head-cell'}>
            <div className="label">{WEEKDAY_LABELS[getWeekday(d)]}</div>
            <div className="week-head-date num">{formatShortDate(d).split(' ')[1]}</div>
          </div>
        ))}
        <div className="week-head-cell label">wk</div>

        {activeGoals.map((goal) => {
          const isWeekly = goal.type === 'weekly_count' || goal.type === 'weekly_duration';
          const weekEval = isWeekly ? evaluateWeek(goal, weekStart, logs) : null;

          let scheduledCount = 0;
          let passCount = 0;
          for (const d of days) {
            if (!isScheduledOn(goal, d)) continue;
            scheduledCount += 1;
            const s = evaluateDay(goal, d, logs);
            if (s === 'pass' || s === 'floor') passCount += 1;
          }

          return (
            <Fragment key={goal.id}>
              <div className="week-row-name" key={`${goal.id}-name`}>
                {goal.name}
              </div>
              {days.map((d) => {
                const scheduled = isScheduledOn(goal, d);
                if (!scheduled) {
                  return <div className="week-cell" key={`${goal.id}-${d}`}><DayCell status="not_scheduled" logged={false} /></div>;
                }
                if (isWeekly) {
                  const log = logFor(logs, goal.id, d);
                  const has = goal.type === 'weekly_count' ? !!log?.done : (log?.minutes ?? 0) > 0;
                  const future = compareISO(d, today) > 0;
                  const status = has ? 'pass' : future || d === today ? 'pending' : 'fail';
                  return <div className="week-cell" key={`${goal.id}-${d}`}><DayCell status={status} logged={has} /></div>;
                }
                const status = evaluateDay(goal, d, logs);
                const log = logFor(logs, goal.id, d);
                const logged = !!(log?.done || log?.minutes !== undefined || log?.time || (log?.count ?? 0) > 0);
                return <div className="week-cell" key={`${goal.id}-${d}`}><DayCell status={status} logged={logged} /></div>;
              })}
              <div className="week-cell week-summary num" key={`${goal.id}-sum`}>
                {isWeekly && weekEval ? `${weekEval.actual}/${weekEval.target}` : `${passCount}/${scheduledCount || 0}`}
              </div>
            </Fragment>
          );
        })}
      </div>

      <p className="week-legend">
        <span className="wk-mark wk-mark-pass" /> pass
        <span className="wk-mark wk-mark-floor" /> floor
        <span className="wk-mark wk-mark-fail" /> missed
        <span className="wk-mark wk-mark-pending" /> pending
      </p>
    </div>
  );
}

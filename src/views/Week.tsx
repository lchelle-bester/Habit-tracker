import { useState } from 'react';
import { useData } from '../context/DataContext';
import { addDays, formatShortDate, today, weekStart } from '../utils/date';
import { WEEKDAY_LABEL, WEEKDAYS } from '../types/goal';
import { evaluateDay, evaluateWeek, isActiveOn } from '../engine/goalEngine';

export function Week() {
  const { goals, logs } = useData();
  const todayISO = today();
  const [anchor, setAnchor] = useState(weekStart(todayISO));

  const days = WEEKDAYS.map((_, i) => addDays(anchor, i));
  const isCurrentWeek = anchor === weekStart(todayISO);
  const visibleGoals = goals.filter((g) => days.some((d) => isActiveOn(g, d)));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <button className="btn-text" onClick={() => setAnchor(addDays(anchor, -7))}>
          ← Prior
        </button>
        <div className="goal-sub">
          {formatShortDate(days[0])} – {formatShortDate(days[6])}
        </div>
        <button className="btn-text" onClick={() => setAnchor(addDays(anchor, 7))} disabled={isCurrentWeek} style={{ opacity: isCurrentWeek ? 0.3 : 1 }}>
          Next →
        </button>
      </div>

      <div className="week-grid">
        <div className="week-grid-row week-grid-header">
          <div className="week-grid-goalname" />
          {days.map((d, i) => (
            <div key={d} className="week-grid-daylabel">
              {WEEKDAY_LABEL[WEEKDAYS[i]]}
            </div>
          ))}
          <div className="week-grid-summary" />
        </div>

        {visibleGoals.map((goal) => {
          const week = evaluateWeek(goal, anchor, logs, todayISO);
          return (
            <div className="week-grid-row" key={goal.id}>
              <div className="week-grid-goalname">{goal.name}</div>
              {days.map((d) => {
                const r = evaluateDay(goal, d, logs, todayISO);
                return (
                  <div key={d} className="week-grid-cell">
                    <span className={`mark mark-${r.status}`} />
                  </div>
                );
              })}
              <div className="week-grid-summary num">
                {week ? `${week.count}/${week.target}` : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useData } from '../../storage/DataContext';
import { addDays, todayISO } from '../../engine/date';
import { isScheduledOn } from '../../engine/schedule';
import { getActiveFlag } from '../../engine/flags';
import { verseForDate } from '../../engine/verses';
import { GoalRow } from './GoalRow';
import './Today.css';

export function TodayView() {
  const { goals, logs } = useData();
  const today = todayISO();
  const lastNight = addDays(today, -1);

  const visible = goals.filter((g) => {
    if (g.archived) return false;
    const relevantDate = g.type === 'daily_time' ? lastNight : today;
    return isScheduledOn(g, relevantDate);
  });

  const flag = getActiveFlag(goals, logs, today);
  const verse = verseForDate(today);

  return (
    <div className="today-view">
      {flag && (
        <div className="flag-banner">
          <p className="flag-text">{flag.message}</p>
        </div>
      )}

      <div className="today-list">
        {visible.length === 0 && <p className="today-empty">Nothing scheduled today.</p>}
        {visible.map((g, i) => (
          <div key={g.id}>
            {i > 0 && <hr className="hairline" />}
            <GoalRow goal={g} />
          </div>
        ))}
      </div>

      {!flag && (
        <footer className="verse-footer">
          <p className="verse-text">&ldquo;{verse.text}&rdquo;</p>
          <p className="verse-ref">{verse.reference}</p>
        </footer>
      )}
    </div>
  );
}

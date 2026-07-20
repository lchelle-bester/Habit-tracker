import type { Goal, LogEntry } from '../../../types';
import { incidenceByDay, incidenceByTimeOfDay } from '../../../engine/stats';
import { formatShortDate } from '../../../engine/date';
import { scaleLinear } from './scale';

const W = 600;
const H = 90;
const PAD_L = 6;
const PAD_R = 6;

export function ScrollingChart({ goal, logs, days }: { goal: Goal; logs: LogEntry[]; days: number }) {
  const series = incidenceByDay(goal, logs, days);
  const max = Math.max(1, ...series.map((d) => d.count));
  const x = scaleLinear([0, series.length - 1], [PAD_L, W - PAD_R]);
  const barW = (W - PAD_L - PAD_R) / series.length - 1.5;
  const y = scaleLinear([0, max], [H - 16, 8]);
  const total = series.reduce((s, d) => s + d.count, 0);

  const byTime = incidenceByTimeOfDay(goal, logs);
  const hasTimeData = byTime.some((b) => b.count > 0);

  return (
    <div className="chart-block">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
        <text x={PAD_L} y={10} className="chart-direct-label chart-direct-label-strong">
          {total} incident{total === 1 ? '' : 's'} in {days} days
        </text>
        {series.map((d, i) =>
          d.count > 0 ? (
            <rect key={d.date} x={x(i) - barW / 2} y={y(d.count)} width={barW} height={H - 16 - y(d.count)} className="chart-bar" />
          ) : null
        )}
        <text x={PAD_L} y={H - 2} className="chart-axis-label">
          {formatShortDate(series[0].date)}
        </text>
        <text x={W - PAD_R} y={H - 2} textAnchor="end" className="chart-axis-label">
          {formatShortDate(series[series.length - 1].date)}
        </text>
      </svg>

      {hasTimeData && (
        <div className="tod-rows">
          {byTime.map((b) => (
            <div className="tod-row" key={b.label}>
              <span className="chart-row-label">{b.label}</span>
              <div className="tod-bar-track">
                <div
                  className="tod-bar-fill"
                  style={{ width: `${(b.count / Math.max(1, ...byTime.map((x) => x.count))) * 100}%` }}
                />
              </div>
              <span className="chart-axis-label num">{b.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

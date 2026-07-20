import type { Goal, LogEntry } from '../../../types';
import { boxingVsSleep } from '../../../engine/stats';
import { formatShortDate } from '../../../engine/date';
import { scaleLinear, pathFromPoints } from './scale';

const W = 600;
const H = 130;
const PAD_L = 6;
const PAD_R = 6;

export function BoxingSleepChart({ boxingGoal, sleepGoal, logs, weeks }: { boxingGoal: Goal; sleepGoal?: Goal; logs: LogEntry[]; weeks: number }) {
  const points = boxingVsSleep(boxingGoal, sleepGoal, logs, weeks);
  const x = scaleLinear([0, points.length - 1], [PAD_L + 10, W - PAD_R - 10]);
  const barW = (W - PAD_L - PAD_R) / points.length - 4;

  const maxSessions = Math.max(4, ...points.map((p) => p.sessions));
  const yBar = scaleLinear([0, maxSessions], [H - 24, 20]);

  const deltas = points.map((p) => p.avgSleepDelta).filter((d): d is number => d !== null);
  const maxAbsDelta = Math.max(20, ...deltas.map((d) => Math.abs(d)));
  const yLine = scaleLinear([-maxAbsDelta, maxAbsDelta], [H - 24, 20]);

  const linePoints: Array<[number, number] | null> = points.map((p, i) =>
    p.avgSleepDelta === null ? null : [x(i), yLine(p.avgSleepDelta)]
  );
  const linePath = pathFromPoints(linePoints);
  const last = points[points.length - 1];

  return (
    <div className="chart-block">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
        <text x={PAD_L} y={12} className="chart-direct-label">
          sessions/week (bars) against avg bed-time delta (line)
        </text>

        {points.map((p, i) => (
          <rect
            key={p.weekStart}
            x={x(i) - barW / 2}
            y={yBar(p.sessions)}
            width={barW}
            height={H - 24 - yBar(p.sessions)}
            className="chart-bar"
          />
        ))}

        <path d={linePath} className="chart-line chart-line-accent" fill="none" />
        {linePoints.map((p, i) => (p ? <circle key={i} cx={p[0]} cy={p[1]} r={1.8} className="chart-dot chart-dot-accent" /> : null))}

        {sleepGoal && last.avgSleepDelta !== null && (
          <text x={x(points.length - 1) + 8} y={yLine(last.avgSleepDelta)} className="chart-direct-label chart-direct-label-strong" dominantBaseline="middle">
            {last.avgSleepDelta > 0 ? '+' : ''}
            {Math.round(last.avgSleepDelta)}m
          </text>
        )}

        <text x={PAD_L} y={H - 4} className="chart-axis-label">
          {formatShortDate(points[0].weekStart)}
        </text>
        <text x={W - PAD_R} y={H - 4} textAnchor="end" className="chart-axis-label">
          {formatShortDate(points[points.length - 1].weekStart)}
        </text>
      </svg>
    </div>
  );
}

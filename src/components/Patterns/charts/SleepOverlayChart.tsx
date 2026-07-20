import type { Goal, LogEntry } from '../../../types';
import { formatShortDate } from '../../../engine/date';
import { sleepDeltaSeries, overlayFailMarks } from '../../../engine/stats';
import { scaleLinear, pathFromPoints } from './scale';

const W = 600;
const LINE_H = 120;
const ROW_H = 15;
const PAD_L = 6;
const PAD_R = 44;

export function SleepOverlayChart({ sleepGoal, goals, logs, days }: { sleepGoal: Goal; goals: Goal[]; logs: LogEntry[]; days: number }) {
  const series = sleepDeltaSeries(sleepGoal, logs, days);
  const dates = series.map((p) => p.date);
  const overlays = overlayFailMarks(goals, logs, dates);
  const height = LINE_H + overlays.length * ROW_H + 24;

  const deltas = series.map((p) => p.delta).filter((d): d is number => d !== null);
  const maxAbs = Math.max(30, ...deltas.map((d) => Math.abs(d)));
  const x = scaleLinear([0, Math.max(1, series.length - 1)], [PAD_L, W - PAD_R]);
  const y = scaleLinear([-maxAbs, maxAbs], [LINE_H - 6, 6]);
  const zeroY = y(0);

  const points: Array<[number, number] | null> = series.map((p, i) => (p.delta === null ? null : [x(i), y(p.delta)]));
  const linePath = pathFromPoints(points);

  const lastLogged = [...series].reverse().find((p) => p.delta !== null);

  return (
    <div className="chart-block">
      <svg viewBox={`0 0 ${W} ${height}`} className="chart-svg" preserveAspectRatio="xMidYMid meet">
        <line x1={PAD_L} x2={W - PAD_R} y1={zeroY} y2={zeroY} className="chart-baseline" />
        <text x={W - PAD_R + 6} y={zeroY} className="chart-direct-label" dominantBaseline="middle">
          target
        </text>

        <path d={linePath} className="chart-line" fill="none" />
        {points.map((p, i) =>
          p ? <circle key={i} cx={p[0]} cy={p[1]} r={1.6} className="chart-dot" /> : null
        )}
        {lastLogged && (
          <text
            x={x(series.indexOf(lastLogged)) + 8}
            y={y(lastLogged.delta as number)}
            className="chart-direct-label chart-direct-label-strong"
            dominantBaseline="middle"
          >
            {(lastLogged.delta as number) > 0 ? '+' : ''}
            {lastLogged.delta}m
          </text>
        )}

        {overlays.map((o, rowIdx) => {
          const rowY = LINE_H + 10 + rowIdx * ROW_H;
          return (
            <g key={o.goal.id}>
              <text x={PAD_L} y={rowY + 4} className="chart-row-label">
                {o.goal.name}
              </text>
              {o.fails.map((failed, i) =>
                failed ? <rect key={i} x={x(i) - 1} y={rowY} width={2} height={6} className="chart-tick" /> : null
              )}
            </g>
          );
        })}

        <text x={PAD_L} y={height - 4} className="chart-axis-label">
          {formatShortDate(dates[0])}
        </text>
        <text x={W - PAD_R} y={height - 4} textAnchor="end" className="chart-axis-label">
          {formatShortDate(dates[dates.length - 1])}
        </text>
      </svg>
    </div>
  );
}

import type { Goal, LogEntry } from '../../../types';
import { weeklyCompletionTrend } from '../../../engine/stats';
import { scaleLinear, pathFromPoints } from './scale';

const SPARK_W = 140;
const SPARK_H = 28;

function Sparkline({ goal, logs, weeks }: { goal: Goal; logs: LogEntry[]; weeks: number }) {
  const points = weeklyCompletionTrend(goal, logs, weeks);
  const x = scaleLinear([0, Math.max(1, points.length - 1)], [2, SPARK_W - 2]);
  const y = scaleLinear([0, 1], [SPARK_H - 4, 4]);
  const coords = points.map((p, i) => (p.rate === null ? null : ([x(i), y(p.rate)] as [number, number])));
  const path = pathFromPoints(coords);
  const last = [...points].reverse().find((p) => p.rate !== null);

  return (
    <div className="trend-row">
      <span className="chart-row-label trend-row-label">{goal.name}</span>
      <svg viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} className="chart-svg trend-spark" preserveAspectRatio="none">
        <line x1={0} x2={SPARK_W} y1={y(1)} y2={y(1)} className="chart-baseline chart-baseline-faint" />
        <path d={path} className="chart-line" fill="none" />
      </svg>
      <span className="chart-direct-label chart-direct-label-strong num trend-value">
        {last ? `${Math.round((last.rate ?? 0) * 100)}%` : '—'}
      </span>
    </div>
  );
}

export function WeeklyTrendChart({ goals, logs, weeks }: { goals: Goal[]; logs: LogEntry[]; weeks: number }) {
  return (
    <div className="chart-block">
      {goals.map((g) => (
        <Sparkline key={g.id} goal={g} logs={logs} weeks={weeks} />
      ))}
    </div>
  );
}

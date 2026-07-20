import type { Goal, LogEntry } from '../../../types';
import { dayOfWeekFailRates } from '../../../engine/stats';
import { WEEKDAY_LABELS } from '../../../engine/date';

const ORDER = [1, 2, 3, 4, 5, 6, 0] as const; // Mon..Sun
const BAR_W = 10;
const GAP = 6;
const ROW_H = 40;
const LABEL_W = 90;

export function DayOfWeekChart({ goals, logs }: { goals: Goal[]; logs: LogEntry[] }) {
  const width = LABEL_W + ORDER.length * (BAR_W + GAP);
  const height = goals.length * ROW_H + 16;

  return (
    <div className="chart-block">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg chart-svg-compact" preserveAspectRatio="xMinYMin meet">
        {goals.map((goal, rowIdx) => {
          const rates = dayOfWeekFailRates(goal, logs);
          const rowY = rowIdx * ROW_H;
          const maxBarH = ROW_H - 16;
          return (
            <g key={goal.id}>
              <text x={0} y={rowY + ROW_H / 2} className="chart-row-label" dominantBaseline="middle">
                {goal.name}
              </text>
              {ORDER.map((wd, i) => {
                const rate = rates[wd];
                const barH = Math.max(rate > 0 ? 2 : 0, rate * maxBarH);
                const bx = LABEL_W + i * (BAR_W + GAP);
                const by = rowY + ROW_H - 10 - barH;
                return (
                  <g key={wd}>
                    <rect x={bx} y={by} width={BAR_W} height={barH} className={rate >= 0.5 ? 'chart-bar chart-bar-strong' : 'chart-bar'} />
                    {rowIdx === goals.length - 1 && (
                      <text x={bx + BAR_W / 2} y={height} textAnchor="middle" className="chart-axis-label">
                        {WEEKDAY_LABELS[wd][0]}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

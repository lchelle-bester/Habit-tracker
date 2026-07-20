const W = 600;
const H = 180;
const PAD = 8;

export interface LinePoint {
  y: number | null;
  label?: string;
}

interface LineChartProps {
  points: LinePoint[];
  color?: string;
  zeroLine?: boolean;
  formatValue?: (v: number) => string;
  height?: number;
  endLabel?: boolean;
}

export function LineChart({ points, color = 'var(--ink)', zeroLine = false, formatValue = (v) => String(v), height = H, endLabel = true }: LineChartProps) {
  const values = points.map((p) => p.y).filter((v): v is number => v !== null);
  if (values.length === 0) {
    return <div className="chart-empty">Not enough data yet.</div>;
  }
  let min = Math.min(...values, zeroLine ? 0 : Infinity);
  let max = Math.max(...values, zeroLine ? 0 : -Infinity);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = max - min;
  const yFor = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2);
  const xFor = (i: number) => (points.length === 1 ? W / 2 : (i / (points.length - 1)) * W);

  const segments: { d: string }[] = [];
  let current: string[] = [];
  points.forEach((p, i) => {
    if (p.y === null) {
      if (current.length > 1) segments.push({ d: current.join(' ') });
      current = [];
      return;
    }
    current.push(`${current.length === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(p.y).toFixed(1)}`);
  });
  if (current.length > 1) segments.push({ d: current.join(' ') });

  const lastIdx = [...points].reverse().findIndex((p) => p.y !== null);
  const lastPoint = lastIdx >= 0 ? points[points.length - 1 - lastIdx] : null;
  const lastX = lastIdx >= 0 ? xFor(points.length - 1 - lastIdx) : 0;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="chart-svg">
      {zeroLine && (
        <line x1={0} x2={W} y1={yFor(0)} y2={yFor(0)} stroke="var(--hairline-strong)" strokeWidth={1} />
      )}
      {segments.map((s, i) => (
        <path key={i} d={s.d} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      ))}
      {endLabel && lastPoint && lastPoint.y !== null && (
        <text x={Math.min(lastX, W - 2)} y={Math.max(yFor(lastPoint.y) - 6, 10)} textAnchor="end" fontSize={11} fill={color} className="num">
          {formatValue(lastPoint.y)}
        </text>
      )}
    </svg>
  );
}

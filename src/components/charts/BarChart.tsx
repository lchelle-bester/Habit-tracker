interface BarChartProps {
  categories: string[];
  values: (number | null)[];
  max?: number;
  formatValue?: (v: number) => string;
  height?: number;
  color?: string;
}

export function BarChart({ categories, values, max, formatValue = (v) => String(v), height = 90, color = 'var(--ink)' }: BarChartProps) {
  const domainMax = max ?? Math.max(1, ...values.filter((v): v is number => v !== null));

  return (
    <div className="barchart" style={{ height }}>
      {categories.map((cat, i) => {
        const v = values[i];
        const pct = v === null ? 0 : Math.max((v / domainMax) * 100, v > 0 ? 4 : 0);
        return (
          <div className="barchart-col" key={cat}>
            <div className="barchart-value num">{v !== null ? formatValue(v) : ''}</div>
            <div className="barchart-track">
              <div
                className="barchart-fill"
                style={{ height: `${pct}%`, background: v === null ? 'var(--hairline)' : color }}
              />
            </div>
            <div className="barchart-label">{cat}</div>
          </div>
        );
      })}
    </div>
  );
}

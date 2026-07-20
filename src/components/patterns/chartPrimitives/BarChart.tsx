import { scaleBand, scaleLinear } from './scale'

interface Bar {
  label: string
  value: number // 0..1
  emphasis?: boolean
}

interface BarChartProps {
  bars: Bar[]
  height?: number
  valueFormat?: (v: number) => string
}

const WIDTH = 320
const PAD_TOP = 8
const PAD_BOTTOM = 16

export function BarChart({ bars, height = 72, valueFormat }: BarChartProps) {
  const band = scaleBand(bars.length, [0, WIDTH], 0.35)
  const y = scaleLinear([0, 1], [height - PAD_BOTTOM, PAD_TOP])

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="bar-chart" role="img" aria-label={bars.map((b) => `${b.label} ${b.value}`).join(', ')}>
      <line x1={0} x2={WIDTH} y1={height - PAD_BOTTOM} y2={height - PAD_BOTTOM} className="bar-chart__baseline" />
      {bars.map((b, i) => {
        const barY = y(b.value)
        return (
          <g key={b.label}>
            <rect
              x={band.position(i)}
              y={barY}
              width={band.bandwidth}
              height={height - PAD_BOTTOM - barY}
              className={`bar-chart__bar${b.emphasis ? ' bar-chart__bar--emphasis' : ''}`}
            />
            <text x={band.position(i) + band.bandwidth / 2} y={height - 2} className="bar-chart__axis-label">
              {b.label}
            </text>
            {valueFormat && b.value > 0 && (
              <text x={band.position(i) + band.bandwidth / 2} y={barY - 3} className="bar-chart__value-label">
                {valueFormat(b.value)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

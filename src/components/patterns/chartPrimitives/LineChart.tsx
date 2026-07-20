import { scaleLinear } from './scale'

export interface LineSeries {
  label: string
  values: (number | null)[]
  emphasis?: boolean
}

interface LineChartProps {
  series: LineSeries[]
  xLabels: string[]
  height?: number
  yDomain?: [number, number]
  yFormat?: (v: number) => string
}

const WIDTH = 320
const PAD_LEFT = 4
const PAD_RIGHT = 44
const PAD_TOP = 10
const PAD_BOTTOM = 18

function pathFor(values: (number | null)[], x: (i: number) => number, y: (v: number) => number): string {
  let d = ''
  let drawing = false
  values.forEach((v, i) => {
    if (v == null) {
      drawing = false
      return
    }
    const cmd = drawing ? 'L' : 'M'
    d += `${cmd}${x(i).toFixed(1)},${y(v).toFixed(1)} `
    drawing = true
  })
  return d.trim()
}

export function LineChart({ series, xLabels, height = 120, yDomain, yFormat }: LineChartProps) {
  const allValues = series.flatMap((s) => s.values).filter((v): v is number => v != null)
  const domain = yDomain ?? (allValues.length ? [Math.min(0, ...allValues), Math.max(...allValues)] : [0, 1])

  const x = (i: number) => scaleLinear([0, Math.max(xLabels.length - 1, 1)], [PAD_LEFT, WIDTH - PAD_RIGHT])(i)
  const y = scaleLinear(domain as [number, number], [height - PAD_BOTTOM, PAD_TOP])

  const zeroY = domain[0] <= 0 && domain[1] >= 0 ? y(0) : null

  // Direct end-of-line labels can collide when several series peak near the
  // same value — nudge them apart vertically, closest-pair first, so every
  // label stays legible instead of stacking illegibly.
  const MIN_LABEL_GAP = 8
  const labelPositions = series
    .map((s) => {
      const lastIdx = [...s.values].map((v, i) => (v != null ? i : -1)).filter((i) => i >= 0).pop()
      if (lastIdx == null) return null
      return { label: s.label, emphasis: s.emphasis, x: x(lastIdx) + 6, y: y(s.values[lastIdx]!) + 3 }
    })
    .filter((p): p is { label: string; emphasis: boolean | undefined; x: number; y: number } => p != null)
    .sort((a, b) => a.y - b.y)
  for (let i = 1; i < labelPositions.length; i++) {
    const gap = labelPositions[i].y - labelPositions[i - 1].y
    if (gap < MIN_LABEL_GAP) labelPositions[i].y = labelPositions[i - 1].y + MIN_LABEL_GAP
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="line-chart" role="img" aria-label={series.map((s) => s.label).join(', ')}>
      {zeroY != null && <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={zeroY} y2={zeroY} className="line-chart__zero" />}

      {series.map((s) => (
        <path key={s.label} d={pathFor(s.values, x, y)} className={`line-chart__path${s.emphasis ? ' line-chart__path--emphasis' : ''}`} fill="none" />
      ))}

      {labelPositions.map((p) => (
        <text key={p.label} x={p.x} y={p.y} className={`line-chart__label${p.emphasis ? ' line-chart__label--emphasis' : ''}`}>
          {p.label}
        </text>
      ))}

      {xLabels.map(
        (label, i) =>
          (i === 0 || i === xLabels.length - 1 || i === Math.floor(xLabels.length / 2)) && (
            <text key={i} x={x(i)} y={height - 2} className="line-chart__axis-label">
              {label}
            </text>
          ),
      )}

      {yFormat && (
        <>
          <text x={PAD_LEFT} y={PAD_TOP} className="line-chart__axis-label">
            {yFormat(domain[1])}
          </text>
          <text x={PAD_LEFT} y={height - PAD_BOTTOM} className="line-chart__axis-label">
            {yFormat(domain[0])}
          </text>
        </>
      )}
    </svg>
  )
}

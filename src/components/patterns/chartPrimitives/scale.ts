export function scaleLinear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = d1 - d0 || 1
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0)
}

export function scaleBand(count: number, range: [number, number], paddingRatio = 0.2) {
  const [r0, r1] = range
  const step = (r1 - r0) / Math.max(count, 1)
  const bandwidth = step * (1 - paddingRatio)
  const offset = (step - bandwidth) / 2
  return {
    bandwidth,
    position: (i: number) => r0 + i * step + offset,
  }
}

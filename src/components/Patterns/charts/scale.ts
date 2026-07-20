export function scaleLinear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

export function pathFromPoints(points: Array<[number, number] | null>): string {
  let d = '';
  let started = false;
  for (const p of points) {
    if (!p) {
      started = false;
      continue;
    }
    d += `${started ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)} `;
    started = true;
  }
  return d.trim();
}

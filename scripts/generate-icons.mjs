import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

const BG = '#17150f';
const FG = '#f6f4ef';

function tallySvg({ size, scale }) {
  const c = size / 2;
  const w = size * 0.34 * scale;
  const h = size * 0.42 * scale;
  const x0 = c - w / 2;
  const x1 = c + w / 2;
  const y0 = c - h / 2;
  const y1 = c + h / 2;
  const stroke = size * 0.045 * scale;
  const bars = [0, 1, 2, 3].map((i) => x0 + (i * w) / 3);

  const verticals = bars
    .map((x) => `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="${FG}" stroke-width="${stroke}" stroke-linecap="round"/>`)
    .join('');

  const diag = `<line x1="${x0 - stroke}" y1="${y1 + stroke}" x2="${x1 + stroke}" y2="${y0 - stroke}" stroke="${FG}" stroke-width="${stroke}" stroke-linecap="round"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  ${verticals}
  ${diag}
</svg>`;
}

mkdirSync('public', { recursive: true });

const targets = [
  { file: 'public/pwa-192.png', size: 192, scale: 1 },
  { file: 'public/pwa-512.png', size: 512, scale: 1 },
  { file: 'public/maskable-192.png', size: 192, scale: 0.6 },
  { file: 'public/maskable-512.png', size: 512, scale: 0.6 },
  { file: 'public/apple-touch-icon.png', size: 180, scale: 0.85 },
];

for (const t of targets) {
  const svg = tallySvg(t);
  await sharp(Buffer.from(svg)).png().toFile(t.file);
  console.log('wrote', t.file);
}

writeFileSync('public/favicon.svg', tallySvg({ size: 64, scale: 1 }));
console.log('wrote public/favicon.svg');

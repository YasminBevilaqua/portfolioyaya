/**
 * Texturas cartoon / gigantes gasosos — mesmo estilo visual do PlanetScene de referência.
 * Esquerda = laranja · Centro = rosa · Direita = roxo.
 */
export type PlanetTextureCanvas = HTMLCanvasElement | OffscreenCanvas;

export const SITE_PLANET_PALETTES: [string, string, string][] = [
  ['#ffedd5', '#fb923c', '#c2410c'],
  ['#fce7f3', '#f472b6', '#be185d'],
  ['#ede9fe', '#8b5cf6', '#5b21b6'],
];

export type PlanetTextureVariant = 'jupiter-purple' | 'gas-pink' | 'gas-orange';

export const ABOUT_PLANET_TEXTURE_SEEDS = [42_001, 42_337, 42_689] as const;

export function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Na esfera, u=0 e u=1 são a mesma meridiana — a textura tem de ser contínua nas colunas 0 e W-1.
 * (Blur com `filter` junto às bordas do canvas também pode escurecer — evitar blur sem padding.)
 */
function healEquirectangularVerticalSeam(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  bandPx = 28,
) {
  const band = Math.min(bandPx, Math.max(4, Math.floor(width / 16)));
  const runPass = () => {
    const img = ctx.getImageData(0, 0, width, height);
    const d = img.data;
    const w = width;
    for (let y = 0; y < height; y++) {
      const row = y * w * 4;
    const i0 = row;
    const iLast = row + (w - 1) * 4;
    const sr = (d[i0] + d[iLast]) * 0.5;
      const sg = (d[i0 + 1] + d[iLast + 1]) * 0.5;
      const sb = (d[i0 + 2] + d[iLast + 2]) * 0.5;
      const sa = (d[i0 + 3] + d[iLast + 3]) * 0.5;
      for (let k = 0; k < band; k++) {
        const t = k / band;
        const wKeep = t;
        const wSeam = 1 - t;
        const il = row + k * 4;
        const ir = row + (w - 1 - k) * 4;
        d[il] = d[il] * wKeep + sr * wSeam;
        d[il + 1] = d[il + 1] * wKeep + sg * wSeam;
        d[il + 2] = d[il + 2] * wKeep + sb * wSeam;
        d[il + 3] = d[il + 3] * wKeep + sa * wSeam;
        d[ir] = d[ir] * wKeep + sr * wSeam;
        d[ir + 1] = d[ir + 1] * wKeep + sg * wSeam;
        d[ir + 2] = d[ir + 2] * wKeep + sb * wSeam;
        d[ir + 3] = d[ir + 3] * wKeep + sa * wSeam;
      }
      const blendEdge = (ia: number, ib: number) => {
        for (let c = 0; c < 4; c++) {
          const v = (d[ia + c] + d[ib + c]) * 0.5;
          d[ia + c] = v;
          d[ib + c] = v;
        }
      };
      blendEdge(i0, iLast);
    }
    ctx.putImageData(img, 0, 0);
  };
  runPass();
  runPass();
}

function createCanvasSurface(width: number, height: number): PlanetTextureCanvas {
  // No main thread, prioriza canvas DOM para máxima compatibilidade com THREE.CanvasTexture.
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  // Em worker, usa OffscreenCanvas.
  return new OffscreenCanvas(width, height);
}

export function generateRadialCartoonTexture(center: string, mid: string, edge: string, blobSeed: number) {
  const canvas = createCanvasSurface(512, 512);

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rand = mulberry32(blobSeed);

  const gradient = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
  gradient.addColorStop(0, center);
  gradient.addColorStop(0.5, mid);
  gradient.addColorStop(1, edge);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc(rand() * 512, rand() * 512, rand() * 60 + 20, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${rand() * 0.1})`;
    ctx.fill();
  }

  return canvas;
}

export function generateJupiterPurpleTexture(seed: number) {
  const canvas = createCanvasSurface(1024, 512);

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rand = mulberry32(seed);
  const W = 1024;
  const H = 512;

  const ang = (x: number) => (x / W) * Math.PI * 2;

  /** Mesma lógica de onda que o planeta rosa (bandas + zig), só com paleta roxa. */
  const wavePurple = (x: number, base: number, amp: number, ph: number) => {
    const s =
      Math.sin(ang(x) * 5 + ph) * amp +
      Math.sin(ang(x) * 12 + ph * 0.9) * (amp * 0.42) +
      Math.sin(ang(x) * 21 + ph * 1.1) * (amp * 0.22);
    const zig = (Math.sin(ang(x) * 31 + ph) > 0 ? 1 : -1) * amp * 0.18;
    return base + s + zig;
  };

  const fillWavyBandPurple = (y0: number, h: number, color: string, alpha: number, ph: number) => {
    ctx.beginPath();
    const step = 4;
    for (let x = 0; x <= W; x += step) {
      const y = wavePurple(x, y0, 5, ph);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let x = W; x >= 0; x -= step) {
      const y = wavePurple(x, y0 + h, 5, ph + 1.4);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#6d28d9');
  sky.addColorStop(0.12, '#7c3aed');
  sky.addColorStop(0.26, '#8b5cf6');
  sky.addColorStop(0.4, '#a855f7');
  sky.addColorStop(0.52, '#c026d3');
  sky.addColorStop(0.64, '#d946ef');
  sky.addColorStop(0.76, '#e879f9');
  sky.addColorStop(0.88, '#d946ef');
  sky.addColorStop(1, '#c084fc');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const bandColors = [
    'rgba(192, 38, 211, 0.5)',
    'rgba(124, 58, 237, 0.48)',
    'rgba(217, 70, 239, 0.52)',
    'rgba(147, 51, 234, 0.46)',
    'rgba(168, 85, 247, 0.5)',
    'rgba(236, 72, 153, 0.38)',
    'rgba(109, 40, 217, 0.45)',
    'rgba(192, 132, 252, 0.48)',
    'rgba(139, 92, 246, 0.46)',
    'rgba(219, 39, 119, 0.36)',
  ];

  let y = 0;
  let bi = 0;
  while (y < H - 2) {
    const bh = 26 + rand() * 34;
    fillWavyBandPurple(y, bh, bandColors[bi % bandColors.length], 0.52, seed * 0.02 + bi * 0.65);
    y += bh * 0.9;
    bi++;
  }

  const fillHeartAt = (cx: number, cy: number, size: number, rot: number, fill: string, alpha: number) => {
    const s = size / 120;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, 40 * s);
    ctx.bezierCurveTo(0, 37 * s, -5 * s, 25 * s, -25 * s, 25 * s);
    ctx.bezierCurveTo(-55 * s, 25 * s, -55 * s, 62.5 * s, -55 * s, 62.5 * s);
    ctx.bezierCurveTo(-55 * s, 80 * s, -35 * s, 102 * s, 0, 120 * s);
    ctx.bezierCurveTo(35 * s, 102 * s, 55 * s, 80 * s, 55 * s, 62.5 * s);
    ctx.bezierCurveTo(55 * s, 62.5 * s, 55 * s, 25 * s, 25 * s, 25 * s);
    ctx.bezierCurveTo(10 * s, 25 * s, 0, 37 * s, 0, 40 * s);
    ctx.closePath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  const heartHalfW = (size: number) => size * 0.48;

  const heartDup = (cx: number, cy: number, size: number, rot: number, fill: string, alpha: number) => {
    const hw = heartHalfW(size);
    fillHeartAt(cx, cy, size, rot, fill, alpha);
    if (cx - hw < 72) fillHeartAt(cx + W, cy, size, rot, fill, alpha);
    if (cx + hw > W - 72) fillHeartAt(cx - W, cy, size, rot, fill, alpha);
  };

  const heartFills = [
    'rgba(250, 245, 255, 0.42)',
    'rgba(233, 213, 255, 0.4)',
    'rgba(216, 180, 254, 0.45)',
    'rgba(192, 132, 252, 0.38)',
    'rgba(167, 139, 250, 0.4)',
    'rgba(147, 51, 234, 0.36)',
    'rgba(196, 181, 253, 0.35)',
    'rgba(126, 34, 206, 0.32)',
  ];

  for (let i = 0; i < 62; i++) {
    const cx = rand() * W;
    const cy = rand() * H;
    const size = 14 + rand() * 56;
    const rot = (rand() - 0.5) * 2.2;
    heartDup(cx, cy, size, rot, heartFills[i % heartFills.length], 0.35 + rand() * 0.38);
  }
  for (let i = 0; i < 38; i++) {
    const cx = rand() * W;
    const cy = rand() * H;
    const size = 28 + rand() * 88;
    const rot = (rand() - 0.5) * 1.6;
    heartDup(cx, cy, size, rot, heartFills[(i + 3) % heartFills.length], 0.22 + rand() * 0.28);
  }
  for (let i = 0; i < 18; i++) {
    const cx = rand() * W;
    const cy = rand() * H;
    const size = 48 + rand() * 100;
    const rot = (rand() - 0.5) * 1.1;
    heartDup(cx, cy, size, rot, 'rgba(255, 250, 255, 0.14)', 0.12 + rand() * 0.1);
  }

  for (let i = 0; i < 95; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 0.7 + rand() * 2.8;
    ctx.fillStyle = `rgba(255, 240, 255, ${0.16 + rand() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = `rgba(${200 + rand() * 55}, ${180 + rand() * 50}, ${255}, ${0.04 + rand() * 0.08})`;
    ctx.fillRect(rand() * W, rand() * H, 1 + rand() * 2, 1 + rand() * 2);
  }

  healEquirectangularVerticalSeam(ctx, W, H);
  return canvas;
}

export function generatePinkGasGiantTexture(seed: number) {
  const canvas = createCanvasSurface(1024, 512);

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const rand = mulberry32(seed);
  const W = 1024;
  const H = 512;

  const ang = (x: number) => (x / W) * Math.PI * 2;

  /** Mesma onda “suave” que o antigo planeta roxo (sem zig), em tons rosa. */
  const wave = (x: number, base: number, amp: number, ph: number) =>
    base + Math.sin(ang(x) * 4 + ph) * amp + Math.sin(ang(x) * 9 + ph * 0.8) * (amp * 0.38);

  const fillWavyBandPink = (y0: number, h: number, color: string, alpha: number, ph: number) => {
    ctx.beginPath();
    const step = 4;
    for (let x = 0; x <= W; x += step) {
      const y = wave(x, y0, 4, ph);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let x = W; x >= 0; x -= step) {
      const y = wave(x, y0 + h, 4, ph + 1.2);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
  };

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#831843');
  sky.addColorStop(0.12, '#9f1239');
  sky.addColorStop(0.26, '#be185d');
  sky.addColorStop(0.4, '#db2777');
  sky.addColorStop(0.54, '#ec4899');
  sky.addColorStop(0.68, '#f472b6');
  sky.addColorStop(0.82, '#fda4af');
  sky.addColorStop(0.94, '#fbcfe8');
  sky.addColorStop(1, '#fce7f3');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const bandColors = [
    'rgba(157, 23, 77, 0.48)',
    'rgba(236, 72, 153, 0.45)',
    'rgba(190, 24, 93, 0.5)',
    'rgba(251, 113, 133, 0.4)',
    'rgba(219, 39, 119, 0.48)',
    'rgba(244, 114, 182, 0.42)',
    'rgba(131, 24, 67, 0.46)',
    'rgba(249, 168, 212, 0.4)',
    'rgba(225, 29, 72, 0.44)',
    'rgba(253, 164, 175, 0.38)',
  ];

  let y = 0;
  let bi = 0;
  while (y < H - 2) {
    const bh = 28 + rand() * 36;
    fillWavyBandPink(y, bh, bandColors[bi % bandColors.length], 0.55, seed * 0.01 + bi * 0.7);
    y += bh * 0.92;
    bi++;
  }

  for (let i = 0; i < 12; i++) {
    const yy = 35 + (i / 12) * (H - 70);
    ctx.strokeStyle = `rgba(255, 248, 252, ${0.12 + rand() * 0.12})`;
    ctx.lineWidth = 1 + rand() * 0.5;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 5) {
      const py = wave(x, yy, 2.5, seed + i);
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 70; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 1 + rand() * 3.5;
    ctx.fillStyle = `rgba(255, 235, 245, ${0.28 + rand() * 0.28})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  healEquirectangularVerticalSeam(ctx, W, H);
  return canvas;
}

export function generateOrangeGasGiantTexture(seed: number) {
  const W = 1024;
  const H = 512;

  const work = createCanvasSurface(W, H);
  const wctx = work.getContext('2d');
  if (!wctx) {
    const c = createCanvasSurface(W, H);
    return c;
  }

  const rand = mulberry32(seed);
  const ang = (x: number) => (x / W) * Math.PI * 2;

  const wave = (x: number, base: number, amp: number, ph: number) =>
    base +
    Math.sin(ang(x) * 3 + ph) * amp +
    Math.sin(ang(x) * 7 + ph * 0.88) * (amp * 0.42) +
    Math.sin(ang(x) * 12 + ph * 1.05) * (amp * 0.14);

  const fillWavyBand = (
    c: CanvasRenderingContext2D,
    y0: number,
    h: number,
    color: string,
    ph: number,
    amp: number,
  ) => {
    c.beginPath();
    const step = 2;
    for (let x = 0; x <= W; x += step) {
      const y = wave(x, y0, amp, ph);
      if (x === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    for (let x = W; x >= 0; x -= step) {
      const y = wave(x, y0 + h, amp, ph + 1.18);
      c.lineTo(x, y);
    }
    c.closePath();
    c.fillStyle = color;
    c.fill();
  };

  const bg = wctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#ffedd5');
  bg.addColorStop(0.28, '#fdba74');
  bg.addColorStop(0.52, '#fb923c');
  bg.addColorStop(0.78, '#f97316');
  bg.addColorStop(1, '#ea580c');
  wctx.fillStyle = bg;
  wctx.fillRect(0, 0, W, H);

  const bandColors = [
    '#fff7ed',
    '#ffedd5',
    '#fed7aa',
    '#fdba74',
    '#fb923c',
    '#f97316',
    '#ea580c',
    '#fec89a',
    '#ffedd5',
    '#fdba74',
    '#fb923c',
    '#c2410c',
  ];

  let y = -14;
  let bi = 0;
  while (y < H + 14) {
    const h = 3 + rand() * 18;
    fillWavyBand(wctx, y, h, bandColors[bi % bandColors.length], seed * 0.014 + bi * 0.39, 4.5 + rand() * 2.5);
    y += h * 0.68;
    bi++;
  }

  wctx.globalAlpha = 0.5;
  y = -10;
  bi = 5;
  while (y < H + 10) {
    const h = 5 + rand() * 24;
    fillWavyBand(wctx, y, h, bandColors[(bi + 4) % bandColors.length], seed * 0.07 + bi * 0.33, 3.5 + rand() * 2);
    y += h * 0.74;
    bi++;
  }
  wctx.globalAlpha = 1;

  const smoothBlob = (
    c: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    rot: number,
    ph: number,
    fill: string,
  ) => {
    const n = 40;
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * Math.PI * 2;
      const w = 1 + 0.22 * Math.sin(t * 3 + ph) + 0.14 * Math.sin(t * 5 + ph * 1.15);
      const x = cx + Math.cos(t + rot) * rx * w;
      const yy = cy + Math.sin(t + rot) * ry * w;
      if (i === 0) c.moveTo(x, yy);
      else c.lineTo(x, yy);
    }
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  };

  const blobDup = (cx: number, cy: number, rx: number, ry: number, rot: number, ph: number, fill: string) => {
    smoothBlob(wctx, cx, cy, rx, ry, rot, ph, fill);
    if (cx - rx < 70) smoothBlob(wctx, cx + W, cy, rx, ry, rot, ph, fill);
    if (cx + rx > W - 70) smoothBlob(wctx, cx - W, cy, rx, ry, rot, ph, fill);
  };

  for (let i = 0; i < 32; i++) {
    const cx = rand() * W;
    const cy = rand() * H;
    const rx = 40 + rand() * 130;
    const ry = 16 + rand() * 52;
    const rot = (rand() - 0.5) * 0.9;
    const ph = seed * 0.3 + i * 2.11;
    const a = 0.42 + rand() * 0.35;
    blobDup(cx, cy, rx, ry, rot, ph, `rgba(255, 220, 180, ${a})`);
  }
  for (let i = 0; i < 26; i++) {
    const cx = rand() * W;
    const cy = rand() * H;
    const rx = 28 + rand() * 100;
    const ry = 12 + rand() * 42;
    const rot = (rand() - 0.5) * 1;
    const ph = seed * 0.5 + i * 1.9;
    const a = 0.28 + rand() * 0.3;
    blobDup(cx, cy, rx, ry, rot, ph, `rgba(234, 88, 12, ${a})`);
  }

  const canvas = createCanvasSurface(W, H);
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  /**
   * Não usar `filter: blur()` em drawImage no tamanho exato: nas bordas esq./dir. o kernel
   * mistura com transparente e fica uma faixa escura na costura UV da esfera.
   */
  ctx.drawImage(work, 0, 0);

  for (let i = 0; i < 14; i++) {
    const cx = rand() * W;
    const cy = rand() * H;
    const r = 14 + rand() * 28;
    const rIn = r * (0.38 + rand() * 0.15);
    ctx.fillStyle = `rgb(${175 + rand() * 35}, ${55 + rand() * 28}, ${12 + rand() * 14})`;
    ctx.beginPath();
    ctx.arc(cx, cy, rIn, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgb(${255}, ${190 + rand() * 45}, ${120 + rand() * 40})`;
    ctx.lineWidth = 2 + rand() * 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = 0; i < 620; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const rr = 0.45 + rand() * 1.35;
    ctx.fillStyle = `rgba(${200 + rand() * 40}, ${70 + rand() * 45}, ${15 + rand() * 22}, ${0.45 + rand() * 0.4})`;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 2800; i++) {
    ctx.fillStyle = `rgba(${190 + rand() * 50}, ${65 + rand() * 40}, ${18 + rand() * 18}, ${0.02 + rand() * 0.09})`;
    ctx.fillRect(rand() * W, rand() * H, 1, 1);
  }
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(255, 248, 238, ${0.015 + rand() * 0.045})`;
    ctx.fillRect(rand() * W, rand() * H, 1, 1);
  }

  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let p = 0; p < d.length; p += 4) {
    const n = (rand() - 0.5) * 8;
    d[p] = Math.min(255, Math.max(0, d[p] + n));
    d[p + 1] = Math.min(255, Math.max(0, d[p + 1] + n * 0.9));
    d[p + 2] = Math.min(255, Math.max(0, d[p + 2] + n * 0.55));
  }
  ctx.putImageData(img, 0, 0);

  healEquirectangularVerticalSeam(ctx, W, H);
  return canvas;
}

export function createPlanetTextureCanvas(
  palette: [string, string, string],
  textureSeed: number,
  variant: PlanetTextureVariant,
): PlanetTextureCanvas {
  if (variant === 'jupiter-purple') return generateJupiterPurpleTexture(textureSeed);
  if (variant === 'gas-pink') return generatePinkGasGiantTexture(textureSeed);
  return generateOrangeGasGiantTexture(textureSeed);
}

const PLANET_CANVAS_CACHE = new Map<string, PlanetTextureCanvas>();
const ABOUT_TEXTURE_VARIANTS: PlanetTextureVariant[] = ['gas-orange', 'gas-pink', 'jupiter-purple'];

/** Chave única para canvas / textura Three — incluir versão ao mudar geração (invalida cache em memória). */
export function planetTextureKey(
  palette: [string, string, string],
  textureSeed: number,
  variant: PlanetTextureVariant,
) {
  return `${variant}:seam7:${textureSeed}:${palette.join('|')}`;
}

export function getOrCreatePlanetTextureCanvas(
  palette: [string, string, string],
  textureSeed: number,
  variant: PlanetTextureVariant,
) {
  const key = planetTextureKey(palette, textureSeed, variant);
  const cached = PLANET_CANVAS_CACHE.get(key);
  if (cached) return cached;
  const canvas = createPlanetTextureCanvas(palette, textureSeed, variant);
  PLANET_CANVAS_CACHE.set(key, canvas);
  return canvas;
}

/**
 * Pré-aquece as texturas em pedaços para evitar pico único na primeira entrada da seção.
 */
export function prewarmAboutPlanetTexturesChunked() {
  if (typeof window === 'undefined') return () => {};

  let idx = 0;
  let cancelled = false;
  let timeoutId: number | null = null;

  const schedule = (fn: () => void) => {
    if ('requestIdleCallback' in window) {
      const w = window as Window & {
        requestIdleCallback: (cb: (d: { timeRemaining: () => number; didTimeout: boolean }) => void) => number;
      };
      return w.requestIdleCallback(() => fn());
    }
    timeoutId = window.setTimeout(fn, 16);
    return timeoutId;
  };

  const tick = () => {
    if (cancelled || idx >= ABOUT_PLANET_TEXTURE_SEEDS.length) return;
    const i = idx++;
    getOrCreatePlanetTextureCanvas(
      SITE_PLANET_PALETTES[i] as [string, string, string],
      ABOUT_PLANET_TEXTURE_SEEDS[i],
      ABOUT_TEXTURE_VARIANTS[i],
    );
    if (!cancelled && idx < ABOUT_PLANET_TEXTURE_SEEDS.length) schedule(tick);
  };

  schedule(tick);

  return () => {
    cancelled = true;
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  };
}

export function planetMaterialStyle(variant: PlanetTextureVariant) {
  if (variant === 'jupiter-purple') {
    return { roughness: 0.52, metalness: 0.08, emissive: '#d946ef', emissiveIntensity: 0.14 };
  }
  if (variant === 'gas-pink') {
    return { roughness: 0.52, metalness: 0.08, emissive: '#f472b6', emissiveIntensity: 0.1 };
  }
  return { roughness: 0.52, metalness: 0.08, emissive: '#fb923c', emissiveIntensity: 0.11 };
}

/** Mesma velocidade angular base que o PlanetScene de referência (rad/s). */
export const BACKGROUND_MATCH_SPIN_Y = 0.075;

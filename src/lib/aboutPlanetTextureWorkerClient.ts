import {
  ABOUT_PLANET_TEXTURE_SEEDS,
  SITE_PLANET_PALETTES,
  type PlanetTextureVariant,
} from './aboutPlanetTextures';

type WorkerRequestPayload = {
  id: number;
  palette: [string, string, string];
  textureSeed: number;
  variant: PlanetTextureVariant;
};

type WorkerResponsePayload =
  | { id: number; bitmap: ImageBitmap }
  | { id: number; error: string };

type Pending = {
  resolve: (bitmap: ImageBitmap) => void;
  reject: (reason?: unknown) => void;
};

const ABOUT_TEXTURE_VARIANTS: PlanetTextureVariant[] = ['gas-orange', 'gas-pink', 'jupiter-purple'];
const bitmapPromiseCache = new Map<string, Promise<ImageBitmap>>();
const readyBitmapCache = new Map<string, ImageBitmap>();
const pending = new Map<number, Pending>();
let reqSeq = 0;
let workerRef: Worker | null = null;

function textureKey(palette: [string, string, string], textureSeed: number, variant: PlanetTextureVariant) {
  return `${variant}:${textureSeed}:${palette.join('|')}`;
}

function getWorker() {
  if (workerRef) return workerRef;
  workerRef = new Worker(new URL('./aboutPlanetTexture.worker.ts', import.meta.url), { type: 'module' });
  workerRef.onmessage = (event: MessageEvent<WorkerResponsePayload>) => {
    const payload = event.data;
    const waiting = pending.get(payload.id);
    if (!waiting) return;
    pending.delete(payload.id);
    if ('error' in payload) waiting.reject(new Error(payload.error));
    else waiting.resolve(payload.bitmap);
  };
  return workerRef;
}

function canUseWorker() {
  return typeof window !== 'undefined' && typeof Worker !== 'undefined';
}

export function requestPlanetTextureBitmap(
  palette: [string, string, string],
  textureSeed: number,
  variant: PlanetTextureVariant,
) {
  const key = textureKey(palette, textureSeed, variant);
  const ready = readyBitmapCache.get(key);
  if (ready) return Promise.resolve(ready);
  const cached = bitmapPromiseCache.get(key);
  if (cached) return cached;

  if (!canUseWorker()) {
    return Promise.reject(new Error('Web Worker unavailable'));
  }

  const promise = new Promise<ImageBitmap>((resolve, reject) => {
    const id = ++reqSeq;
    pending.set(id, {
      resolve: (bitmap) => {
        readyBitmapCache.set(key, bitmap);
        resolve(bitmap);
      },
      reject: (reason) => reject(reason),
    });
    const payload: WorkerRequestPayload = { id, palette, textureSeed, variant };
    getWorker().postMessage(payload);
  });

  bitmapPromiseCache.set(key, promise);
  return promise;
}

export function prewarmAboutPlanetTexturesInWorker() {
  if (!canUseWorker()) return () => {};
  let cancelled = false;
  let idx = 0;
  let timeoutId: number | null = null;

  const schedule = (fn: () => void) => {
    timeoutId = window.setTimeout(fn, 24);
  };

  const runNext = () => {
    if (cancelled || idx >= ABOUT_PLANET_TEXTURE_SEEDS.length) return;
    const i = idx++;
    requestPlanetTextureBitmap(
      SITE_PLANET_PALETTES[i] as [string, string, string],
      ABOUT_PLANET_TEXTURE_SEEDS[i],
      ABOUT_TEXTURE_VARIANTS[i],
    )
      .catch(() => {
        // Fallback é tratado no componente em runtime.
      })
      .finally(() => {
        if (!cancelled && idx < ABOUT_PLANET_TEXTURE_SEEDS.length) schedule(runNext);
      });
  };

  schedule(runNext);
  return () => {
    cancelled = true;
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  };
}

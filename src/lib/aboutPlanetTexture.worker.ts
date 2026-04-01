import { createPlanetTextureCanvas, type PlanetTextureVariant } from './aboutPlanetTextures';

type WorkerRequest = {
  id: number;
  palette: [string, string, string];
  textureSeed: number;
  variant: PlanetTextureVariant;
};

type WorkerSuccess = {
  id: number;
  bitmap: ImageBitmap;
};

type WorkerError = {
  id: number;
  error: string;
};

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, palette, textureSeed, variant } = event.data;

  try {
    const canvas = createPlanetTextureCanvas(palette, textureSeed, variant);
    let bitmap: ImageBitmap;

    if ('transferToImageBitmap' in canvas) {
      bitmap = (canvas as OffscreenCanvas).transferToImageBitmap();
    } else {
      bitmap = await createImageBitmap(canvas as HTMLCanvasElement);
    }

    const payload: WorkerSuccess = { id, bitmap };
    (self as unknown as Worker).postMessage(payload, [bitmap]);
  } catch (error) {
    const payload: WorkerError = {
      id,
      error: error instanceof Error ? error.message : 'Texture worker failed',
    };
    (self as unknown as Worker).postMessage(payload);
  }
};

export interface OptimizedImageResult {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
  quality: number;
  sourceSize: number;
  outputSize: number;
}

const OUTPUT_SIZE = 500;
const INITIAL_QUALITY = 0.82;
const MIN_QUALITY = 0.68;
const QUALITY_STEP = 0.06;
const TARGET_BYTES = 300 * 1024;

const blobFromCanvas = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Unable To Optimize Image.'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      quality
    );
  });

const loadImageElement = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable To Read Image File.'));
    };
    image.src = url;
  });

const decodeImage = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file);
  }
  return loadImageElement(file);
};

export async function optimizeImageToSquare(file: File): Promise<OptimizedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please Select An Image File.');
  }

  const image = await decodeImage(file);
  const sourceWidth = 'width' in image ? image.width : 0;
  const sourceHeight = 'height' in image ? image.height : 0;

  if (!sourceWidth || !sourceHeight) {
    throw new Error('Unable To Determine Image Dimensions.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new Error('Image Optimization Is Not Supported In This Browser.');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.fillStyle = '#111114';
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const sourceSize = Math.min(sourceWidth, sourceHeight);
  const sourceX = Math.max(0, (sourceWidth - sourceSize) / 2);
  const sourceY = Math.max(0, (sourceHeight - sourceSize) / 2);

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  if ('close' in image && typeof image.close === 'function') {
    image.close();
  }

  let quality = INITIAL_QUALITY;
  let blob = await blobFromCanvas(canvas, quality);

  while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
    blob = await blobFromCanvas(canvas, quality);
  }

  return {
    blob,
    previewUrl: URL.createObjectURL(blob),
    width: OUTPUT_SIZE,
    height: OUTPUT_SIZE,
    quality,
    sourceSize: file.size,
    outputSize: blob.size,
  };
}

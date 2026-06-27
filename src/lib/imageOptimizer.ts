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

interface SourceRegion {
  x: number;
  y: number;
  size: number;
}

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

const closeDecodedImage = (image: ImageBitmap | HTMLImageElement) => {
  if ('close' in image && typeof image.close === 'function') {
    image.close();
  }
};

const optimizeImageRegionToSquare = async (
  image: ImageBitmap | HTMLImageElement,
  region: SourceRegion,
  sourceSize: number
): Promise<OptimizedImageResult> => {
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

  context.drawImage(
    image,
    region.x,
    region.y,
    region.size,
    region.size,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

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
    sourceSize,
    outputSize: blob.size,
  };
};

const getDecodedImageSize = (image: ImageBitmap | HTMLImageElement) => ({
  width: 'width' in image ? image.width : 0,
  height: 'height' in image ? image.height : 0,
});

export async function optimizeImageToOriginalWebp(file: File): Promise<OptimizedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please Select An Image File.');
  }

  const image = await decodeImage(file);
  const { width: sourceWidth, height: sourceHeight } = getDecodedImageSize(image);

  if (!sourceWidth || !sourceHeight) {
    closeDecodedImage(image);
    throw new Error('Unable To Determine Image Dimensions.');
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      throw new Error('Image Optimization Is Not Supported In This Browser.');
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, sourceWidth, sourceHeight);

    let quality = INITIAL_QUALITY;
    let blob = await blobFromCanvas(canvas, quality);

    while (blob.size > file.size && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
      blob = await blobFromCanvas(canvas, quality);
    }

    return {
      blob,
      previewUrl: URL.createObjectURL(blob),
      width: sourceWidth,
      height: sourceHeight,
      quality,
      sourceSize: file.size,
      outputSize: blob.size,
    };
  } finally {
    closeDecodedImage(image);
  }
}

export async function optimizeImageToSquare(file: File): Promise<OptimizedImageResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please Select An Image File.');
  }

  const image = await decodeImage(file);
  const { width: sourceWidth, height: sourceHeight } = getDecodedImageSize(image);

  if (!sourceWidth || !sourceHeight) {
    closeDecodedImage(image);
    throw new Error('Unable To Determine Image Dimensions.');
  }

  const sourceSize = Math.min(sourceWidth, sourceHeight);
  const region = {
    x: Math.max(0, (sourceWidth - sourceSize) / 2),
    y: Math.max(0, (sourceHeight - sourceSize) / 2),
    size: sourceSize,
  };

  try {
    return await optimizeImageRegionToSquare(image, region, file.size);
  } finally {
    closeDecodedImage(image);
  }
}

export async function optimizeImageToSquareGrid(file: File): Promise<OptimizedImageResult[]> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please Select An Image File.');
  }

  const image = await decodeImage(file);
  const { width: sourceWidth, height: sourceHeight } = getDecodedImageSize(image);

  if (!sourceWidth || !sourceHeight) {
    closeDecodedImage(image);
    throw new Error('Unable To Determine Image Dimensions.');
  }

  const sourceSize = Math.min(sourceWidth, sourceHeight);
  const cellSize = sourceSize / 2;
  const startX = Math.max(0, (sourceWidth - sourceSize) / 2);
  const startY = Math.max(0, (sourceHeight - sourceSize) / 2);
  const quadrantSourceSize = Math.round(file.size / 4);

  const regions: SourceRegion[] = [
    { x: startX, y: startY, size: cellSize },
    { x: startX + cellSize, y: startY, size: cellSize },
    { x: startX, y: startY + cellSize, size: cellSize },
    { x: startX + cellSize, y: startY + cellSize, size: cellSize },
  ];

  try {
    return await Promise.all(
      regions.map((region) => optimizeImageRegionToSquare(image, region, quadrantSourceSize))
    );
  } finally {
    closeDecodedImage(image);
  }
}

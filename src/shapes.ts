import type { Shape, Color, Fill, ShapeCacheKey } from './types';
import { SHAPES, COLORS, FILLS, COLOR_MAP } from './constants';

const SHAPE_SIZE = 16;

// Pixel art shape definitions (16x16 grids)
export const PIXEL_SHAPES: Record<Shape, readonly string[]> = {
  diamond: [
    '........XX......',
    '.......XXXX.....',
    '......XXXXXX....',
    '.....XXXXXXXX...',
    '....XXXXXXXXXX..',
    '...XXXXXXXXXXXX.',
    '..XXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXXX',
    '..XXXXXXXXXXXXXX',
    '...XXXXXXXXXXXX.',
    '....XXXXXXXXXX..',
    '.....XXXXXXXX...',
    '......XXXXXX....',
    '.......XXXX.....',
    '........XX......',
  ],
  oval: [
    '.....XXXXXX.....',
    '...XXXXXXXXXX...',
    '..XXXXXXXXXXXX..',
    '.XXXXXXXXXXXXXX.',
    '.XXXXXXXXXXXXXX.',
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXX',
    '.XXXXXXXXXXXXXX.',
    '.XXXXXXXXXXXXXX.',
    '..XXXXXXXXXXXX..',
    '...XXXXXXXXXX...',
    '.....XXXXXX.....',
  ],
  squiggle: [
    '....XXXXX.......',
    '..XXXXXXXXX.....',
    '.XXXXXXXXXXX....',
    '.XXXXXXXXXXXX...',
    'XXXXXXXXXXXXX...',
    'XXXXXXXXXXXXXX..',
    '.XXXXXXXXXXXXX..',
    '..XXXXXXXXXXXXX.',
    '..XXXXXXXXXXXXX.',
    '..XXXXXXXXXXXXXX',
    '...XXXXXXXXXXXXX',
    '....XXXXXXXXXXXX',
    '....XXXXXXXXXXX.',
    '.....XXXXXXXXX..',
    '.......XXXXX....',
    '................',
  ],
};

// Shape cache - stores pre-rendered canvas elements for fast blitting
// Using HTMLCanvasElement with drawImage() is faster than ImageData with putImageData()
const shapeCanvasCache = new Map<ShapeCacheKey, HTMLCanvasElement>();

function isEdgePixel(shapeData: readonly string[], x: number, y: number): boolean {
  if (shapeData[y][x] !== 'X') return false;

  const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
  for (const [nx, ny] of neighbors) {
    if (nx < 0 || nx >= SHAPE_SIZE || ny < 0 || ny >= SHAPE_SIZE) return true;
    if (shapeData[ny][nx] === '.') return true;
  }
  return false;
}

function createShapeCanvas(shape: Shape, color: Color, fill: Fill): HTMLCanvasElement {
  const shapeData = PIXEL_SHAPES[shape];
  const rgb = COLOR_MAP[color];

  // Create an offscreen canvas for this shape
  const canvas = document.createElement('canvas');
  canvas.width = SHAPE_SIZE;
  canvas.height = SHAPE_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Set the fill color
  ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

  for (let py = 0; py < SHAPE_SIZE; py++) {
    for (let px = 0; px < SHAPE_SIZE; px++) {
      if (shapeData[py][px] === 'X') {
        let shouldDraw = false;
        if (fill === 'solid') shouldDraw = true;
        else if (fill === 'striped') shouldDraw = py % 2 === 0;
        else if (fill === 'empty') shouldDraw = isEdgePixel(shapeData, px, py);

        if (shouldDraw) {
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }

  return canvas;
}

export function initShapeCache(): void {
  shapeCanvasCache.clear();
  for (const shape of SHAPES) {
    for (const color of COLORS) {
      for (const fill of FILLS) {
        const key: ShapeCacheKey = `${shape}-${color}-${fill}`;
        shapeCanvasCache.set(key, createShapeCanvas(shape, color, fill));
      }
    }
  }
}

export function getShapeCanvas(shape: Shape, color: Color, fill: Fill): HTMLCanvasElement | undefined {
  const key: ShapeCacheKey = `${shape}-${color}-${fill}`;
  return shapeCanvasCache.get(key);
}

// Export SHAPE_SIZE for use in card.ts
export { SHAPE_SIZE };

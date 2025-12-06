import type { Shape, Color, Count, Fill, RGB } from './types';

// RCade game dimensions
export const WIDTH = 336;
export const HEIGHT = 262;
export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;

// Colors (RGB tuples)
export const BACKGROUND: RGB = [26, 26, 46];
export const WHITE: RGB = [255, 255, 255];
export const CARD_BG: RGB = [26, 26, 46];
export const CARD_BG_HOVER: RGB = [40, 40, 70];
export const CARD_BG_SELECTED: RGB = [50, 50, 80];
export const CARD_BORDER: RGB = [74, 74, 106];
export const SELECTED_BORDER: RGB = [255, 215, 0];
export const CURSOR_COLOR: RGB = [100, 200, 255];
export const FLASH_GREEN: RGB = [50, 205, 50];
export const FLASH_RED: RGB = [220, 50, 50];
export const GRAY: RGB = [150, 150, 150];

// Shape colors
export const COLOR_MAP: Record<Color, RGB> = {
  red: [230, 57, 70],
  green: [42, 157, 143],
  purple: [123, 44, 191],
};

// Categories for card attributes
export const SHAPES: readonly Shape[] = ['diamond', 'oval', 'squiggle'];
export const COLORS: readonly Color[] = ['red', 'green', 'purple'];
export const COUNTS: readonly Count[] = ['1', '2', '3'];
export const FILLS: readonly Fill[] = ['solid', 'striped', 'empty'];

// Grid layout
export const CARD_WIDTH = 76;
export const CARD_HEIGHT = 60;
export const CARD_MARGIN = 10;
export const GRID_COLS = 4;
export const GRID_ROWS = 3;

// Calculate grid starting position (centered)
export const GRID_START_X = Math.floor(
  (WIDTH - (CARD_WIDTH * GRID_COLS + CARD_MARGIN * (GRID_COLS - 1))) / 2
);
export const GRID_START_Y = Math.floor(
  (HEIGHT - (CARD_HEIGHT * GRID_ROWS + CARD_MARGIN * (GRID_ROWS - 1))) / 2
);

// Animation durations in milliseconds
export const FLASH_DURATION_MS = 500;
export const FLIP_DURATION_MS = 333;

// Shape size for pixel art
export const SHAPE_SIZE = 16;
export const SHAPE_SPACING = 20;

// Helper function to convert RGB to CSS color string
export function rgbToCss(color: RGB): string {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

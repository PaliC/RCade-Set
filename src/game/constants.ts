/**
 * Game constants and configuration
 */

import type { Shape, Color, Fill } from "./types";

// RCade game dimensions
export const WIDTH = 336;
export const HEIGHT = 262;
export const FPS = 60;

// Colors (CSS format)
export const COLORS = {
  background: "#1a1a2e",
  white: "#ffffff",
  cardBg: "#1a1a2e",
  cardBgHover: "#282846",
  cardBgSelected: "#32325a",
  cardBorder: "#4a4a6a",
  selectedBorder: "#ffd700",
  cursorColor: "#64c8ff",
  flashGreen: "#32cd32",
  flashRed: "#dc3232",
  textMuted: "#969696",
} as const;

// Shape colors (RGB for canvas)
export const SHAPE_COLORS: Record<Color, string> = {
  red: "#e63946",
  green: "#2a9d8f",
  purple: "#7b2cbf",
};

// All possible values for each category
export const SHAPES: Shape[] = ["diamond", "oval", "squiggle"];
export const CARD_COLORS: Color[] = ["red", "green", "purple"];
export const COUNTS: (1 | 2 | 3)[] = [1, 2, 3];
export const FILLS: Fill[] = ["solid", "striped", "empty"];

// Grid layout
export const CARD_WIDTH = 76;
export const CARD_HEIGHT = 60;
export const CARD_MARGIN = 10;
export const GRID_COLS = 4;
export const GRID_ROWS = 3;

// Calculated grid start positions (centered)
export const GRID_START_X =
  (WIDTH - (CARD_WIDTH * GRID_COLS + CARD_MARGIN * (GRID_COLS - 1))) / 2;
export const GRID_START_Y =
  (HEIGHT - (CARD_HEIGHT * GRID_ROWS + CARD_MARGIN * (GRID_ROWS - 1))) / 2;

// Animation durations (in frames)
export const FLASH_DURATION = Math.floor(FPS / 2); // Half second
export const FLIP_DURATION = Math.floor(FPS / 3); // ~20 frames

// Pixel art shape definitions (20x20 grids)
// 'X' = filled pixel, '.' = transparent
export const PIXEL_SHAPES: Record<Shape, string[]> = {
  diamond: [
    ".........XX.........",
    "........XXXX........",
    ".......XXXXXX.......",
    "......XXXXXXXX......",
    ".....XXXXXXXXXX.....",
    "....XXXXXXXXXXXX....",
    "...XXXXXXXXXXXXXX...",
    "..XXXXXXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXXXXXXX.",
    "..XXXXXXXXXXXXXXXX..",
    "...XXXXXXXXXXXXXX...",
    "....XXXXXXXXXXXX....",
    ".....XXXXXXXXXX.....",
    "......XXXXXXXX......",
    ".......XXXXXX.......",
    "........XXXX........",
    ".........XX.........",
  ],
  oval: [
    ".......XXXXXX.......",
    ".....XXXXXXXXXX.....",
    "....XXXXXXXXXXXX....",
    "...XXXXXXXXXXXXXX...",
    "..XXXXXXXXXXXXXXXX..",
    "..XXXXXXXXXXXXXXXX..",
    ".XXXXXXXXXXXXXXXXXX.",
    ".XXXXXXXXXXXXXXXXXX.",
    "XXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXX",
    "XXXXXXXXXXXXXXXXXXXX",
    ".XXXXXXXXXXXXXXXXXX.",
    ".XXXXXXXXXXXXXXXXXX.",
    "..XXXXXXXXXXXXXXXX..",
    "..XXXXXXXXXXXXXXXX..",
    "...XXXXXXXXXXXXXX...",
    "....XXXXXXXXXXXX....",
    ".....XXXXXXXXXX.....",
    ".......XXXXXX.......",
  ],
  squiggle: [
    "...XXXXXX...........",
    "..XXXXXXXX..........",
    ".XXXXXXXXXX.........",
    "XXXXXXXXXXXX........",
    "XXXXXXXXXXXXX.......",
    ".XXXXXXXXXXXX.......",
    "..XXXXXXXXXXX.......",
    "...XXXXXXXXXXX......",
    "....XXXXXXXXXXX.....",
    ".....XXXXXXXXXXX....",
    "......XXXXXXXXXXX...",
    ".......XXXXXXXXXXX..",
    ".......XXXXXXXXXXXX.",
    ".......XXXXXXXXXXXXX",
    "........XXXXXXXXXXXX",
    ".........XXXXXXXXXXX",
    "..........XXXXXXXXXX",
    "..........XXXXXXXX..",
    "...........XXXXXX...",
    "....................",
  ],
};

// Shape size
export const SHAPE_SIZE = 20;
export const SHAPE_SPACING = 24;

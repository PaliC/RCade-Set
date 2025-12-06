// Card attribute types
export type Shape = 'diamond' | 'oval' | 'squiggle';
export type Color = 'red' | 'green' | 'purple';
export type Count = '1' | '2' | '3';
export type Fill = 'solid' | 'striped' | 'empty';

// Game states
export type GameState = 'title' | 'help' | 'playing' | 'game_over';

// Grid position
export interface Position {
  row: number;
  col: number;
}

// Input structures
export interface PlayerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  a: boolean;
  b: boolean;
}

export interface SystemInput {
  start_1p: boolean;
  start_2p: boolean;
}

export interface GameInput {
  p1: PlayerInput;
  p2: PlayerInput;
  system: SystemInput;
}

// Color as RGB tuple
export type RGB = readonly [number, number, number];

// Shape cache key
export type ShapeCacheKey = `${Shape}-${Color}-${Fill}`;

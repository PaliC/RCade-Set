/**
 * Core type definitions for the Set card game
 */

// Card attribute types
export type Shape = "diamond" | "oval" | "squiggle";
export type Color = "red" | "green" | "purple";
export type Count = 1 | 2 | 3;
export type Fill = "solid" | "striped" | "empty";

// Card data structure
export interface CardData {
  shape: Shape;
  color: Color;
  count: Count;
  fill: Fill;
}

// Game states
export type GameState = "title" | "help" | "playing" | "game_over";

// Grid position
export interface Position {
  row: number;
  col: number;
}

// Flip animation state
export interface FlipAnimation {
  oldCard: CardData | null;
  newCard: CardData | null;
  progress: number;
}

// Input state from RCade controller
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

// Position key for Map usage
export function positionKey(row: number, col: number): string {
  return `${row},${col}`;
}

/**
 * Merge P1 and P2 inputs so either player can control the game.
 * Returns true for a button if either player is pressing it.
 */
export function mergePlayerInputs(p1: PlayerInput, p2: PlayerInput): PlayerInput {
  return {
    up: p1.up || p2.up,
    down: p1.down || p2.down,
    left: p1.left || p2.left,
    right: p1.right || p2.right,
    a: p1.a || p2.a,
    b: p1.b || p2.b,
  };
}

/**
 * Check if either start button is pressed.
 */
export function isStartPressed(system: SystemInput): boolean {
  return system.start_1p || system.start_2p;
}

export function parsePositionKey(key: string): Position {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

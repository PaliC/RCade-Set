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

// Game modes
export type GameMode = "single" | "versus";

// Two-player phases
export type VersusPhase = "idle" | "p1_selecting" | "p2_selecting";

// Draw options for GameBoard
export interface BoardDrawOptions {
  cursor?: { row: number; col: number; color: string };
  selected?: { positions: Set<string>; color: string };
}

// Result of attempting a set
export interface SetAttemptResult {
  valid: boolean;
  gameOver: boolean;
}

// Versus mode player state
export interface PlayerVersusState {
  score: number;
  lives: number;
  cursorRow: number;
  cursorCol: number;
  selected: Set<string>;
}

// Full versus game state
export interface VersusGameState {
  phase: VersusPhase;
  p1: PlayerVersusState;
  p2: PlayerVersusState;
  selectionTimer: number;      // Frames remaining for selection
  declareDisplayTimer: number; // Frames remaining for "Declared Set" display
  activePlayer: 1 | 2 | null;
  winner: 1 | 2 | null;        // Set when game ends
  winReason: "elimination" | "score" | null;
}

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

export function parsePositionKey(key: string): Position {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

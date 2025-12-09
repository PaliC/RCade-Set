/**
 * Strategy interface for game modes (single-player vs two-player)
 */

import type { Position, GameInput } from "../types";

/**
 * Information about a cursor to render
 */
export interface CursorInfo {
  position: Position;
  color: string;
  active: boolean; // false = grayed/frozen
}

/**
 * Information about a selected card to render
 */
export interface SelectionInfo {
  position: Position;
  color: string;
}

/**
 * Result of attempting to check a set
 */
export interface SetAttemptResult {
  valid: boolean;
  positions: Position[];
}

/**
 * Data for rendering the game over screen
 */
export interface GameOverData {
  title: string;
  subtitle: string;
  stats: string[];
}

/**
 * Interface that all game modes must implement
 */
export interface GameModeStrategy {
  /**
   * Called once when the game starts
   */
  init(): void;

  /**
   * Process input and update game state each frame.
   * Returns true if the game should continue, false if game over.
   */
  update(inputs: GameInput): boolean;

  /**
   * Draw mode-specific HUD elements (timer, lives, scores).
   * Called after GameBoard draws the cards.
   */
  drawHUD(ctx: CanvasRenderingContext2D): void;

  /**
   * Handle the result of a set attempt (called by GameBoard after checking)
   */
  onSetAttempt(result: SetAttemptResult): void;

  /**
   * Check if game is over
   */
  isGameOver(): boolean;

  /**
   * Get data for game over screen
   */
  getGameOverData(): GameOverData;

  /**
   * Get current cursor position(s) and colors for rendering
   */
  getCursors(): CursorInfo[];

  /**
   * Get currently selected card positions and colors
   */
  getSelections(): SelectionInfo[];
}

/**
 * Single-player mode with timer
 */

import type { GameInput, PlayerInput, Position } from "../types";
import type { GameBoard } from "../GameBoard";
import {
  COLORS,
  WIDTH,
  PLAYER_COLORS,
} from "../constants";
import type {
  GameModeStrategy,
  CursorInfo,
  SelectionInfo,
  SetAttemptResult,
  GameOverData,
} from "./GameModeStrategy";

export class SinglePlayerMode implements GameModeStrategy {
  private board: GameBoard;
  private startTime: number = 0;
  private finalTime: number | null = null;
  private cursorPosition: Position = { row: 0, col: 0 };
  private selectedCards: Position[] = [];
  private prevInputs: PlayerInput | null = null;
  private _isGameOver: boolean = false;

  constructor(board: GameBoard) {
    this.board = board;
  }

  init(): void {
    this.startTime = Date.now();
  }

  update(inputs: GameInput): boolean {
    const p1 = inputs.p1;

    // Movement (edge-triggered)
    if (this.isPressed(p1.up, this.prevInputs?.up)) {
      this.cursorPosition = this.board.moveCursor(this.cursorPosition, "up");
    }
    if (this.isPressed(p1.down, this.prevInputs?.down)) {
      this.cursorPosition = this.board.moveCursor(this.cursorPosition, "down");
    }
    if (this.isPressed(p1.left, this.prevInputs?.left)) {
      this.cursorPosition = this.board.moveCursor(this.cursorPosition, "left");
    }
    if (this.isPressed(p1.right, this.prevInputs?.right)) {
      this.cursorPosition = this.board.moveCursor(this.cursorPosition, "right");
    }

    // Selection
    if (this.isPressed(p1.a, this.prevInputs?.a)) {
      this.selectedCards = this.board.toggleSelection(
        this.selectedCards,
        this.cursorPosition
      );

      if (this.selectedCards.length === 3) {
        const result = this.board.checkSetAtPositions(this.selectedCards);
        this.onSetAttempt(result);
      }
    }

    // Update animations
    this.board.updateAnimations();

    this.prevInputs = { ...p1 };
    return !this._isGameOver;
  }

  onSetAttempt(result: SetAttemptResult): void {
    this.selectedCards = []; // Always clear

    if (result.valid) {
      // Check for game over
      if (this.board.gameOver) {
        this.finalTime = Date.now() - this.startTime;
        this._isGameOver = true;
      }
    }
    // Invalid set: no penalty in single player
  }

  drawHUD(ctx: CanvasRenderingContext2D): void {
    const elapsed = this.finalTime ?? (Date.now() - this.startTime);
    const timeStr = this.formatTime(elapsed);

    // Left: Sets count
    ctx.fillStyle = COLORS.white;
    ctx.font = "20px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Sets: ${this.board.score}`, 10, 10);

    // Center: Timer
    ctx.textAlign = "center";
    ctx.fillText(timeStr, WIDTH / 2, 10);

    // Right: Deck count
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "14px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`Deck: ${this.board.deck.length}`, WIDTH - 10, 12);
  }

  getCursors(): CursorInfo[] {
    return [
      {
        position: this.cursorPosition,
        color: PLAYER_COLORS.p1.cursor,
        active: true,
      },
    ];
  }

  getSelections(): SelectionInfo[] {
    return this.selectedCards.map((pos) => ({
      position: pos,
      color: PLAYER_COLORS.p1.selection,
    }));
  }

  isGameOver(): boolean {
    return this._isGameOver;
  }

  getGameOverData(): GameOverData {
    return {
      title: "Congratulations!",
      subtitle: "You WON!",
      stats: [`Time: ${this.formatTime(this.finalTime!)}`],
    };
  }

  private formatTime(ms: number): string {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${tenths}`;
  }

  private isPressed(current: boolean, previous?: boolean): boolean {
    return current && !previous;
  }
}

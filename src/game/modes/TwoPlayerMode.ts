/**
 * Two-player competitive mode with declaration system, lives, and points
 */

import type { GameInput, PlayerInput, Position, PlayerState, TwoPlayerPhase } from "../types";
import type { GameBoard } from "../GameBoard";
import {
  WIDTH,
  COLORS,
  PLAYER_COLORS,
  DECLARATION_TIMEOUT_FRAMES,
  STARTING_LIVES,
  HUD_FLASH_DURATION,
  LIFE_ICON,
  EMPTY_LIFE_ICON,
  COUNTDOWN_COLOR,
  GRID_COLS,
  GRID_ROWS,
} from "../constants";
import type {
  GameModeStrategy,
  CursorInfo,
  SelectionInfo,
  SetAttemptResult,
  GameOverData,
} from "./GameModeStrategy";

export class TwoPlayerMode implements GameModeStrategy {
  private board: GameBoard;

  private player1: PlayerState;
  private player2: PlayerState;

  private phase: TwoPlayerPhase = "open";
  private activePlayer: 1 | 2 | null = null;
  private declarationTimer: number = 0;

  private prevP1: PlayerInput | null = null;
  private prevP2: PlayerInput | null = null;

  private hudFlashTimer: number = 0;
  private hudFlashPlayer: 1 | 2 | null = null;

  private _isGameOver: boolean = false;
  private winner: 1 | 2 | null = null;

  constructor(board: GameBoard) {
    this.board = board;
    this.player1 = this.createInitialPlayerState();
    this.player2 = this.createInitialPlayerState();
  }

  private createInitialPlayerState(): PlayerState {
    return {
      lives: STARTING_LIVES,
      score: 0,
      cursorPosition: { row: 0, col: 0 },
      selectedCards: [],
    };
  }

  init(): void {
    // Position cursors at different starting spots
    this.player1.cursorPosition = { row: 0, col: 0 };
    this.player2.cursorPosition = { row: GRID_ROWS - 1, col: GRID_COLS - 1 };
  }

  update(inputs: GameInput): boolean {
    // Update HUD flash animation
    if (this.hudFlashTimer > 0) {
      this.hudFlashTimer--;
    }

    // Update board animations
    this.board.updateAnimations();

    if (this.phase === "open") {
      this.updateOpenPhase(inputs);
    } else {
      this.updateDeclaringPhase(inputs);
    }

    this.prevP1 = { ...inputs.p1 };
    this.prevP2 = { ...inputs.p2 };

    return !this._isGameOver;
  }

  private updateOpenPhase(inputs: GameInput): void {
    // Both players can move cursors
    this.moveCursorForPlayer(1, inputs.p1, this.prevP1);
    this.moveCursorForPlayer(2, inputs.p2, this.prevP2);

    // Check for declarations
    const p1Declares = this.isPressed(inputs.p1.a, this.prevP1?.a);
    const p2Declares = this.isPressed(inputs.p2.a, this.prevP2?.a);

    if (p1Declares && p2Declares) {
      // Random winner
      this.startDeclaration(Math.random() < 0.5 ? 1 : 2);
    } else if (p1Declares) {
      this.startDeclaration(1);
    } else if (p2Declares) {
      this.startDeclaration(2);
    }
  }

  private updateDeclaringPhase(inputs: GameInput): void {
    const activeInputs = this.activePlayer === 1 ? inputs.p1 : inputs.p2;
    const prevInputs = this.activePlayer === 1 ? this.prevP1 : this.prevP2;
    const player = this.activePlayer === 1 ? this.player1 : this.player2;

    // Only active player can move and select
    this.moveCursorForPlayer(this.activePlayer!, activeInputs, prevInputs);

    if (this.isPressed(activeInputs.a, prevInputs?.a)) {
      player.selectedCards = this.board.toggleSelection(
        player.selectedCards,
        player.cursorPosition
      );

      if (player.selectedCards.length === 3) {
        const result = this.board.checkSetAtPositions(player.selectedCards);
        this.onSetAttempt(result);
        return; // Don't decrement timer after attempt
      }
    }

    // Decrement timer
    this.declarationTimer--;

    if (this.declarationTimer <= 0) {
      this.handleTimeout();
    }
  }

  private startDeclaration(player: 1 | 2): void {
    this.phase = "declaring";
    this.activePlayer = player;
    this.declarationTimer = DECLARATION_TIMEOUT_FRAMES;

    // Reset cursor to top-left and clear selection
    const playerState = player === 1 ? this.player1 : this.player2;
    playerState.cursorPosition = { row: 0, col: 0 };
    playerState.selectedCards = [];
  }

  private handleTimeout(): void {
    this.loseLife(this.activePlayer!);
    if (!this._isGameOver) {
      this.endDeclaration();
    }
  }

  onSetAttempt(result: SetAttemptResult): void {
    const player = this.activePlayer === 1 ? this.player1 : this.player2;
    player.selectedCards = []; // Always clear

    if (result.valid) {
      player.score++;

      // Check for natural game end (deck empty and no valid sets)
      if (this.board.gameOver) {
        this.endByScore();
      } else {
        this.endDeclaration();
      }
    } else {
      this.loseLife(this.activePlayer!);
      if (!this._isGameOver) {
        this.endDeclaration();
      }
    }
  }

  private loseLife(player: 1 | 2): void {
    const playerState = player === 1 ? this.player1 : this.player2;
    playerState.lives--;

    // Trigger HUD flash
    this.hudFlashTimer = HUD_FLASH_DURATION;
    this.hudFlashPlayer = player;

    // Check for elimination
    if (playerState.lives <= 0) {
      this._isGameOver = true;
      this.winner = player === 1 ? 2 : 1;
    }
  }

  private endDeclaration(): void {
    this.phase = "open";
    this.activePlayer = null;
    this.declarationTimer = 0;

    // Clear selections for both players
    this.player1.selectedCards = [];
    this.player2.selectedCards = [];
  }

  private endByScore(): void {
    this._isGameOver = true;
    this.winner = this.player1.score > this.player2.score ? 1 : 2;
  }

  drawHUD(ctx: CanvasRenderingContext2D): void {
    ctx.font = "14px monospace";
    ctx.textBaseline = "top";

    // Left: P1 info
    const p1Lives = this.formatLives(this.player1.lives);
    const p1Color =
      this.hudFlashTimer > 0 && this.hudFlashPlayer === 1
        ? COUNTDOWN_COLOR
        : PLAYER_COLORS.p1.cursor;
    ctx.fillStyle = p1Color;
    ctx.textAlign = "left";
    ctx.fillText(`P1: ${p1Lives} [${this.player1.score}]`, 10, 10);

    // Right: P2 info
    const p2Lives = this.formatLives(this.player2.lives);
    const p2Color =
      this.hudFlashTimer > 0 && this.hudFlashPlayer === 2
        ? COUNTDOWN_COLOR
        : PLAYER_COLORS.p2.cursor;
    ctx.fillStyle = p2Color;
    ctx.textAlign = "right";
    ctx.fillText(`P2: ${p2Lives} [${this.player2.score}]`, WIDTH - 10, 10);

    // Center: Deck count (open) or countdown (declaring)
    ctx.textAlign = "center";
    if (this.phase === "open") {
      ctx.fillStyle = COLORS.textMuted;
      ctx.fillText(`Deck: ${this.board.deck.length}`, WIDTH / 2, 10);
    } else {
      const secondsLeft = (this.declarationTimer / 60).toFixed(1);
      ctx.fillStyle = COUNTDOWN_COLOR;
      ctx.font = "bold 16px monospace";
      ctx.fillText(`P${this.activePlayer}: ${secondsLeft}`, WIDTH / 2, 8);
    }
  }

  private formatLives(lives: number): string {
    const full = LIFE_ICON.repeat(Math.max(0, lives));
    const empty = EMPTY_LIFE_ICON.repeat(Math.max(0, STARTING_LIVES - lives));
    return full + empty;
  }

  getCursors(): CursorInfo[] {
    return [
      {
        position: this.player1.cursorPosition,
        color: PLAYER_COLORS.p1.cursor,
        active: this.phase === "open" || this.activePlayer === 1,
      },
      {
        position: this.player2.cursorPosition,
        color: PLAYER_COLORS.p2.cursor,
        active: this.phase === "open" || this.activePlayer === 2,
      },
    ];
  }

  getSelections(): SelectionInfo[] {
    const selections: SelectionInfo[] = [];

    // Only show selections for the active player during declaring phase
    if (this.phase === "declaring") {
      const activePlayerState = this.activePlayer === 1 ? this.player1 : this.player2;
      const color = this.activePlayer === 1
        ? PLAYER_COLORS.p1.selection
        : PLAYER_COLORS.p2.selection;

      for (const pos of activePlayerState.selectedCards) {
        selections.push({ position: pos, color });
      }
    }

    return selections;
  }

  isGameOver(): boolean {
    return this._isGameOver;
  }

  getGameOverData(): GameOverData {
    const p1Lives = this.formatLives(this.player1.lives);
    const p2Lives = this.formatLives(this.player2.lives);

    const p1Eliminated = this.player1.lives <= 0;
    const p2Eliminated = this.player2.lives <= 0;

    return {
      title: "GAME OVER",
      subtitle: `Player ${this.winner} Wins!`,
      stats: [
        `P1: ${this.player1.score} pts  ${p1Lives}${p1Eliminated ? "  (eliminated)" : ""}`,
        `P2: ${this.player2.score} pts  ${p2Lives}${p2Eliminated ? "  (eliminated)" : ""}`,
      ],
    };
  }

  private moveCursorForPlayer(
    player: 1 | 2,
    inputs: PlayerInput,
    prevInputs: PlayerInput | null
  ): void {
    const playerState = player === 1 ? this.player1 : this.player2;

    if (this.isPressed(inputs.up, prevInputs?.up)) {
      playerState.cursorPosition = this.board.moveCursor(
        playerState.cursorPosition,
        "up"
      );
    }
    if (this.isPressed(inputs.down, prevInputs?.down)) {
      playerState.cursorPosition = this.board.moveCursor(
        playerState.cursorPosition,
        "down"
      );
    }
    if (this.isPressed(inputs.left, prevInputs?.left)) {
      playerState.cursorPosition = this.board.moveCursor(
        playerState.cursorPosition,
        "left"
      );
    }
    if (this.isPressed(inputs.right, prevInputs?.right)) {
      playerState.cursorPosition = this.board.moveCursor(
        playerState.cursorPosition,
        "right"
      );
    }
  }

  private isPressed(current: boolean, previous?: boolean): boolean {
    return current && !previous;
  }
}

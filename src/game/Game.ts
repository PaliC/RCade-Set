/**
 * Main Game class - handles state machine and rendering
 */

import { GameBoard } from "./GameBoard";
import type { GameState, GameInput } from "./types";
import { shapeRenderer } from "./ShapeRenderer";
import {
  WIDTH,
  HEIGHT,
  FPS,
  COLORS,
} from "./constants";

export class Game {
  private ctx: CanvasRenderingContext2D;
  private state: GameState = "title";
  private menuSelection = 0; // 0 = Start, 1 = Help
  private board: GameBoard;

  // Input state for edge detection
  private prevInputs = {
    up: false,
    down: false,
    a: false,
    b: false,
    start: false,
  };

  // Animation frame handle
  private animationId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private readonly frameTime = 1000 / FPS;

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D context");
    this.ctx = ctx;

    // Initialize shape cache
    shapeRenderer.init();

    // Create initial board
    this.board = new GameBoard();
  }

  /**
   * Check if a key was just pressed (edge-triggered).
   */
  private edgeTriggered(key: string, inputs: GameInput): boolean {
    const p1 = inputs.p1;
    const sys = inputs.system;

    let current = false;
    if (key === "start") {
      current = sys.start_1p;
    } else if (key === "up") {
      current = p1.up;
    } else if (key === "down") {
      current = p1.down;
    } else if (key === "a") {
      current = p1.a;
    } else if (key === "b") {
      current = p1.b;
    }

    const prev = this.prevInputs[key as keyof typeof this.prevInputs] ?? false;
    return current && !prev;
  }

  /**
   * Update previous input state for edge detection.
   */
  private updatePrevInputs(inputs: GameInput): void {
    const p1 = inputs.p1;
    const sys = inputs.system;

    this.prevInputs = {
      up: p1.up,
      down: p1.down,
      a: p1.a,
      b: p1.b,
      start: sys.start_1p,
    };
  }

  /**
   * Main update function.
   */
  update(inputs: GameInput): void {
    switch (this.state) {
      case "title":
        this.updateTitle(inputs);
        break;
      case "help":
        this.updateHelp(inputs);
        break;
      case "playing":
        this.updatePlaying(inputs);
        break;
      case "game_over":
        this.updateGameOver(inputs);
        break;
    }
  }

  private updateTitle(inputs: GameInput): void {
    // Menu navigation
    if (this.edgeTriggered("up", inputs)) {
      this.menuSelection = (this.menuSelection - 1 + 2) % 2;
    }
    if (this.edgeTriggered("down", inputs)) {
      this.menuSelection = (this.menuSelection + 1) % 2;
    }

    // Selection
    if (this.edgeTriggered("a", inputs) || this.edgeTriggered("start", inputs)) {
      if (this.menuSelection === 0) {
        this.state = "playing";
        this.board = new GameBoard(inputs.p1);
      } else {
        this.state = "help";
      }
    }

    this.updatePrevInputs(inputs);
  }

  private updateHelp(inputs: GameInput): void {
    // Return to title with any button
    if (
      this.edgeTriggered("b", inputs) ||
      this.edgeTriggered("start", inputs) ||
      this.edgeTriggered("a", inputs)
    ) {
      this.state = "title";
    }
    this.updatePrevInputs(inputs);
  }

  private updatePlaying(inputs: GameInput): void {
    this.board.update(inputs.p1);

    if (this.board.gameOver) {
      this.state = "game_over";
    }
  }

  private updateGameOver(inputs: GameInput): void {
    if (this.edgeTriggered("start", inputs) || this.edgeTriggered("a", inputs)) {
      this.board = new GameBoard(inputs.p1);
      this.state = "playing";
    }
    this.updatePrevInputs(inputs);
  }

  /**
   * Main draw function.
   */
  draw(): void {
    // Clear background
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);

    switch (this.state) {
      case "title":
        this.drawTitle();
        break;
      case "help":
        this.drawHelp();
        break;
      case "playing":
        this.drawPlaying();
        break;
      case "game_over":
        this.drawGameOver();
        break;
    }
  }

  private drawTitle(): void {
    const ctx = this.ctx;

    // Title
    ctx.fillStyle = COLORS.white;
    ctx.font = "bold 36px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SET", WIDTH / 2, HEIGHT / 2 - 50);

    // Menu options
    const menuItems = ["Start Game", "How to Play"];
    ctx.font = "24px monospace";

    for (let i = 0; i < menuItems.length; i++) {
      const isSelected = i === this.menuSelection;
      ctx.fillStyle = isSelected ? COLORS.selectedBorder : COLORS.white;
      const prefix = isSelected ? "> " : "  ";
      ctx.fillText(`${prefix}${menuItems[i]}`, WIDTH / 2, HEIGHT / 2 + i * 25);
    }

    // Controls hint
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "14px monospace";
    ctx.fillText("D-Pad: Select  A/START: Confirm", WIDTH / 2, HEIGHT - 20);
  }

  private drawHelp(): void {
    const ctx = this.ctx;
    let y = 20;

    // Title
    ctx.fillStyle = COLORS.selectedBorder;
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("How to Play", WIDTH / 2, y);
    y += 30;

    // Rules
    const rules = [
      "Find 3 cards that form a SET.",
      "",
      "For each property (shape, color,",
      "count, fill), all 3 cards must be:",
      "  ALL THE SAME  or  ALL DIFFERENT",
      "",
      "Example valid SET:",
      "  1 red solid diamond",
      "  2 red solid ovals",
      "  3 red solid squiggles",
      "  (same color/fill, diff count/shape)",
    ];

    ctx.fillStyle = COLORS.white;
    ctx.font = "14px monospace";
    ctx.textAlign = "left";

    for (const line of rules) {
      if (line) {
        ctx.fillText(line, 20, y);
      }
      y += 14;
    }

    y += 6;

    // Controls
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = "center";
    ctx.fillText("D-Pad: Move  A: Select  (3 cards = check)", WIDTH / 2, y);

    // Back hint
    ctx.fillText("Press any button to return", WIDTH / 2, HEIGHT - 15);
  }

  private drawPlaying(): void {
    const ctx = this.ctx;

    // Draw the board
    this.board.draw(ctx);

    // Score in top left
    ctx.fillStyle = COLORS.white;
    ctx.font = "20px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`Sets: ${this.board.score}`, 10, 10);

    // Deck remaining in top right
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "14px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`Deck: ${this.board.deck.length}`, WIDTH - 10, 12);
  }

  private drawGameOver(): void {
    const ctx = this.ctx;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Congratulations
    ctx.fillStyle = COLORS.selectedBorder;
    ctx.font = "bold 24px monospace";
    ctx.fillText("Congratulations!", WIDTH / 2, HEIGHT / 2 - 40);
    ctx.fillText("You WON!", WIDTH / 2, HEIGHT / 2 - 10);

    // Score
    ctx.fillStyle = COLORS.white;
    ctx.font = "20px monospace";
    ctx.fillText(`Final Score: ${this.board.score} sets`, WIDTH / 2, HEIGHT / 2 + 25);

    // Restart hint
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "14px monospace";
    ctx.fillText("Press A or START to play again", WIDTH / 2, HEIGHT / 2 + 55);
  }

  /**
   * Start the game loop.
   */
  start(getInput: () => GameInput): void {
    const gameLoop = (time: number) => {
      // Calculate delta time
      const deltaTime = time - this.lastTime;
      this.lastTime = time;
      this.accumulator += deltaTime;

      // Fixed time step updates
      while (this.accumulator >= this.frameTime) {
        const inputs = getInput();
        this.update(inputs);
        this.accumulator -= this.frameTime;
      }

      // Render
      this.draw();

      // Schedule next frame
      this.animationId = requestAnimationFrame(gameLoop);
    };

    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(gameLoop);
  }

  /**
   * Stop the game loop.
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

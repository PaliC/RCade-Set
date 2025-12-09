/**
 * Main Game class - handles state machine and rendering
 */

import { GameBoard } from "./GameBoard";
import type { GameState, GameInput, GameMode } from "./types";
import { shapeRenderer } from "./ShapeRenderer";
import { WIDTH, HEIGHT, FPS, COLORS } from "./constants";
import {
  SinglePlayerMode,
  TwoPlayerMode,
  type GameModeStrategy,
} from "./modes";

export class Game {
  private ctx: CanvasRenderingContext2D;
  private state: GameState = "title";
  private menuSelection = 0; // 0 = 1P, 1 = 2P, 2 = Help
  private gameMode: GameMode = "single";
  private board: GameBoard;
  private modeStrategy: GameModeStrategy | null = null;

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

    // Create initial board (will be replaced when game starts)
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
      current = sys.start_1p || sys.start_2p;
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
      start: sys.start_1p || sys.start_2p,
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
    // Menu navigation (3 items now)
    if (this.edgeTriggered("up", inputs)) {
      this.menuSelection = (this.menuSelection - 1 + 3) % 3;
    }
    if (this.edgeTriggered("down", inputs)) {
      this.menuSelection = (this.menuSelection + 1) % 3;
    }

    // Selection
    if (this.edgeTriggered("a", inputs) || this.edgeTriggered("start", inputs)) {
      if (this.menuSelection === 0) {
        this.startGame("single");
      } else if (this.menuSelection === 1) {
        this.startGame("two_player");
      } else {
        this.state = "help";
      }
    }

    this.updatePrevInputs(inputs);
  }

  private startGame(mode: GameMode): void {
    this.gameMode = mode;

    // Create a new board
    this.board = new GameBoard();

    // Create appropriate strategy
    if (mode === "single") {
      this.modeStrategy = new SinglePlayerMode(this.board);
    } else {
      this.modeStrategy = new TwoPlayerMode(this.board);
    }

    // Inject strategy into board
    this.board.setModeStrategy(this.modeStrategy);
    this.modeStrategy.init();

    this.state = "playing";
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
    if (this.modeStrategy) {
      this.modeStrategy.update(inputs);

      if (this.modeStrategy.isGameOver()) {
        this.state = "game_over";
      }
    }
  }

  private updateGameOver(inputs: GameInput): void {
    if (this.edgeTriggered("start", inputs) || this.edgeTriggered("a", inputs)) {
      // Return to title screen
      this.state = "title";
      this.menuSelection = 0;
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
    ctx.fillText("SET", WIDTH / 2, HEIGHT / 2 - 60);

    // Menu options
    const menuItems = ["1 Player", "2 Players", "How to Play"];
    ctx.font = "20px monospace";

    for (let i = 0; i < menuItems.length; i++) {
      const isSelected = i === this.menuSelection;
      ctx.fillStyle = isSelected ? COLORS.selectedBorder : COLORS.white;
      const prefix = isSelected ? "> " : "  ";
      ctx.fillText(`${prefix}${menuItems[i]}`, WIDTH / 2, HEIGHT / 2 - 10 + i * 28);
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
      "1 Player: Race against the clock!",
      "2 Players: Press A to declare,",
      "  then pick your set in 3.3s!",
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
    ctx.fillText("D-Pad: Move  A: Select/Declare", WIDTH / 2, y);

    // Back hint
    ctx.fillText("Press any button to return", WIDTH / 2, HEIGHT - 15);
  }

  private drawPlaying(): void {
    const ctx = this.ctx;

    // Draw the board
    this.board.draw(ctx);

    // Draw mode-specific HUD
    if (this.modeStrategy) {
      this.modeStrategy.drawHUD(ctx);
    }
  }

  private drawGameOver(): void {
    const ctx = this.ctx;

    if (!this.modeStrategy) return;

    const data = this.modeStrategy.getGameOverData();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Title
    ctx.fillStyle = COLORS.selectedBorder;
    ctx.font = "bold 24px monospace";
    ctx.fillText(data.title, WIDTH / 2, HEIGHT / 2 - 50);

    // Subtitle
    ctx.fillStyle = COLORS.white;
    ctx.font = "bold 20px monospace";
    ctx.fillText(data.subtitle, WIDTH / 2, HEIGHT / 2 - 20);

    // Stats
    ctx.font = "16px monospace";
    data.stats.forEach((stat, i) => {
      ctx.fillText(stat, WIDTH / 2, HEIGHT / 2 + 15 + i * 22);
    });

    // Restart hint
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "14px monospace";
    ctx.fillText("Press A or START to continue", WIDTH / 2, HEIGHT / 2 + 80);
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

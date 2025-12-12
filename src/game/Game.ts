/**
 * Main Game class - handles state machine and rendering
 */

import type p5 from "p5";
import { GameBoard } from "./GameBoard";
import type { GameState, GameInput } from "./types";
import { shapeRenderer } from "./ShapeRenderer";
import {
  WIDTH,
  HEIGHT,
  COLORS,
} from "./constants";

export class Game {
  private p: p5;
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

  constructor(p: p5) {
    this.p = p;

    // Initialize shape cache (must be done with p5 instance)
    shapeRenderer.init(p);

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
    const p = this.p;

    // Clear background
    p.background(COLORS.background);

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
    const p = this.p;

    // Title
    p.fill(COLORS.white);
    p.noStroke();
    p.textFont("monospace");
    p.textStyle(p.BOLD);
    p.textSize(36);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("SET", WIDTH / 2, HEIGHT / 2 - 50);

    // Menu options
    const menuItems = ["Start Game", "How to Play"];
    p.textSize(24);
    p.textStyle(p.NORMAL);

    for (let i = 0; i < menuItems.length; i++) {
      const isSelected = i === this.menuSelection;
      p.fill(isSelected ? COLORS.selectedBorder : COLORS.white);
      const prefix = isSelected ? "> " : "  ";
      p.text(`${prefix}${menuItems[i]}`, WIDTH / 2, HEIGHT / 2 + i * 25);
    }

    // Controls hint
    p.fill(COLORS.textMuted);
    p.textSize(14);
    p.text("D-Pad: Select  A/START: Confirm", WIDTH / 2, HEIGHT - 20);
  }

  private drawHelp(): void {
    const p = this.p;
    let y = 20;

    // Title
    p.fill(COLORS.selectedBorder);
    p.noStroke();
    p.textFont("monospace");
    p.textStyle(p.BOLD);
    p.textSize(24);
    p.textAlign(p.CENTER, p.TOP);
    p.text("How to Play", WIDTH / 2, y);
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

    p.fill(COLORS.white);
    p.textSize(14);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.TOP);

    for (const line of rules) {
      if (line) {
        p.text(line, 20, y);
      }
      y += 14;
    }

    y += 6;

    // Controls
    p.fill(COLORS.textMuted);
    p.textAlign(p.CENTER, p.TOP);
    p.text("D-Pad: Move  A: Select  (3 cards = check)", WIDTH / 2, y);

    // Back hint
    p.text("Press any button to return", WIDTH / 2, HEIGHT - 15);
  }

  private drawPlaying(): void {
    const p = this.p;

    // Draw the board
    this.board.draw(p);

    // Score in top left
    p.fill(COLORS.white);
    p.noStroke();
    p.textFont("monospace");
    p.textSize(20);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Sets: ${this.board.score}`, 10, 10);

    // Deck remaining in top right
    p.fill(COLORS.textMuted);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Deck: ${this.board.deck.length}`, WIDTH - 10, 12);
  }

  private drawGameOver(): void {
    const p = this.p;

    p.noStroke();
    p.textFont("monospace");
    p.textAlign(p.CENTER, p.CENTER);

    // Congratulations
    p.fill(COLORS.selectedBorder);
    p.textStyle(p.BOLD);
    p.textSize(24);
    p.text("Congratulations!", WIDTH / 2, HEIGHT / 2 - 40);
    p.text("You WON!", WIDTH / 2, HEIGHT / 2 - 10);

    // Restart hint
    p.fill(COLORS.textMuted);
    p.textStyle(p.NORMAL);
    p.textSize(20);
    p.text("Press A or START to play again", WIDTH / 2, HEIGHT / 2 + 55);
  }
}

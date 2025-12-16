/**
 * Main Game class - handles state machine and rendering
 */

import type p5 from "p5";
import { GameBoard } from "./GameBoard";
import type { GameState, GameInput, GameMode, VersusPhase, VersusGameState, PlayerVersusState } from "./types";
import { positionKey } from "./types";
import { shapeRenderer } from "./ShapeRenderer";
import {
  WIDTH,
  HEIGHT,
  COLORS,
  GRID_ROWS,
  GRID_COLS,
  FPS,
  SELECTION_TIME_FRAMES,
  STARTING_LIVES,
  PLAYER_COLORS,
  DECLARE_DISPLAY_DURATION,
} from "./constants";

export class Game {
  private p: p5;
  private state: GameState = "title";
  private gameMode: GameMode = "single";
  private menuSelection = 0; // 0 = Versus, 1 = Solo, 2 = Help
  private helpPage = 0; // 0 = What is SET, 1 = Versus Mode, 2 = Solo Mode
  private board: GameBoard;

  // Single player state
  private cursorRow = 0;
  private cursorCol = 0;
  private selected: Set<string> = new Set();
  private score = 0;
  private elapsedFrames = 0;

  // Versus mode state
  private versus: VersusGameState = this.createInitialVersusState();

  // Input state for edge detection (menu navigation)
  private prevInputs = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  };

  // Input state for gameplay edge detection (single player)
  private prevGameInputs = {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
  };

  // Input state for versus mode (per player)
  private prevP1Inputs = { up: false, down: false, left: false, right: false, a: false };
  private prevP2Inputs = { up: false, down: false, left: false, right: false, a: false };

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
    } else if (key === "left") {
      current = p1.left;
    } else if (key === "right") {
      current = p1.right;
    } else if (key === "a") {
      current = p1.a;
    } else if (key === "b") {
      current = p1.b;
    }

    const prev = this.prevInputs[key as keyof typeof this.prevInputs] ?? false;
    return current && !prev;
  }

  /**
   * Format elapsed frames as MM:SS.ss
   */
  private formatTime(frames: number): string {
    const totalSeconds = frames / FPS;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toFixed(2).padStart(5, "0")}`;
  }

  /**
   * Create initial versus state.
   */
  private createInitialVersusState(): VersusGameState {
    return {
      phase: "idle",
      p1: this.createInitialPlayerState(),
      p2: this.createInitialPlayerState(),
      selectionTimer: 0,
      declareDisplayTimer: 0,
      activePlayer: null,
      winner: null,
      winReason: null,
    };
  }

  /**
   * Create initial player state for versus mode.
   */
  private createInitialPlayerState(): PlayerVersusState {
    return {
      score: 0,
      lives: STARTING_LIVES,
      cursorRow: 1,  // Center of grid
      cursorCol: 1,
      selected: new Set(),
    };
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
      left: p1.left,
      right: p1.right,
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
    const menuCount = 3; // Versus, Solo, How to Play

    // Menu navigation
    if (this.edgeTriggered("up", inputs)) {
      this.menuSelection = (this.menuSelection - 1 + menuCount) % menuCount;
    }
    if (this.edgeTriggered("down", inputs)) {
      this.menuSelection = (this.menuSelection + 1) % menuCount;
    }

    // Quick start shortcuts
    if (inputs.system.start_1p && !this.prevInputs.start) {
      this.startSinglePlayer(inputs);
      this.updatePrevInputs(inputs);
      return;
    }
    if (inputs.system.start_2p) {
      this.startVersus(inputs);
      this.updatePrevInputs(inputs);
      return;
    }

    // Selection
    if (this.edgeTriggered("a", inputs) || this.edgeTriggered("start", inputs)) {
      if (this.menuSelection === 0) {
        this.startVersus(inputs);
      } else if (this.menuSelection === 1) {
        this.startSinglePlayer(inputs);
      } else {
        this.helpPage = 0; // Start at first page (2-player)
        this.state = "help";
      }
    }

    this.updatePrevInputs(inputs);
  }

  /**
   * Start a new single player game.
   */
  private startSinglePlayer(inputs: GameInput): void {
    this.state = "playing";
    this.gameMode = "single";
    this.board = new GameBoard();
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.selected.clear();
    this.score = 0;
    this.elapsedFrames = 0;

    // Initialize game input state to prevent accidental selection on first frame
    this.prevGameInputs = {
      up: inputs.p1.up,
      down: inputs.p1.down,
      left: inputs.p1.left,
      right: inputs.p1.right,
      a: inputs.p1.a,
    };
  }

  /**
   * Start a new versus (2 player) game.
   */
  private startVersus(inputs: GameInput): void {
    this.state = "playing";
    this.gameMode = "versus";
    this.board = new GameBoard();
    this.versus = this.createInitialVersusState();

    // Initialize input state to prevent accidental claims on first frame
    this.prevP1Inputs = {
      up: inputs.p1.up,
      down: inputs.p1.down,
      left: inputs.p1.left,
      right: inputs.p1.right,
      a: inputs.p1.a,
    };
    this.prevP2Inputs = {
      up: inputs.p2.up,
      down: inputs.p2.down,
      left: inputs.p2.left,
      right: inputs.p2.right,
      a: inputs.p2.a,
    };
  }

  private updateHelp(inputs: GameInput): void {
    const totalPages = 3;

    // Navigate between pages with left/right
    if (this.edgeTriggered("left", inputs)) {
      this.helpPage = (this.helpPage - 1 + totalPages) % totalPages;
    }
    if (this.edgeTriggered("right", inputs)) {
      this.helpPage = (this.helpPage + 1) % totalPages;
    }

    // Return to title with B button
    if (this.edgeTriggered("b", inputs)) {
      this.state = "title";
    }

    // A or Start advances page, or returns to title on last page
    if (this.edgeTriggered("a", inputs) || this.edgeTriggered("start", inputs)) {
      if (this.helpPage < totalPages - 1) {
        this.helpPage++;
      } else {
        this.state = "title";
      }
    }

    this.updatePrevInputs(inputs);
  }

  private updatePlaying(inputs: GameInput): void {
    // Update board animations
    this.board.update();

    if (this.gameMode === "single") {
      this.updateSinglePlayer(inputs);
    } else {
      this.updateVersus(inputs);
    }
  }

  private updateSinglePlayer(inputs: GameInput): void {
    const p1 = inputs.p1;

    // Update timer
    this.elapsedFrames++;

    // Cursor movement (edge-triggered)
    if (p1.up && !this.prevGameInputs.up) {
      this.cursorRow = (this.cursorRow - 1 + GRID_ROWS) % GRID_ROWS;
    }
    if (p1.down && !this.prevGameInputs.down) {
      this.cursorRow = (this.cursorRow + 1) % GRID_ROWS;
    }
    if (p1.left && !this.prevGameInputs.left) {
      this.cursorCol = (this.cursorCol - 1 + GRID_COLS) % GRID_COLS;
    }
    if (p1.right && !this.prevGameInputs.right) {
      this.cursorCol = (this.cursorCol + 1) % GRID_COLS;
    }

    // Card selection with A button
    if (p1.a && !this.prevGameInputs.a) {
      const key = positionKey(this.cursorRow, this.cursorCol);

      if (this.selected.has(key)) {
        this.selected.delete(key);
      } else if (this.selected.size < 3 && this.board.cards[this.cursorRow][this.cursorCol] !== null) {
        this.selected.add(key);

        // Check if we have exactly 3 cards selected
        if (this.selected.size === 3) {
          const result = this.board.trySet(this.selected);
          if (result.valid) {
            this.score++;
          }
          this.selected.clear();

          if (result.gameOver) {
            this.state = "game_over";
          }
        }
      }
    }

    // Update previous input state
    this.prevGameInputs = {
      up: p1.up,
      down: p1.down,
      left: p1.left,
      right: p1.right,
      a: p1.a,
    };
  }

  private updateVersus(inputs: GameInput): void {
    // Update declare display timer
    if (this.versus.declareDisplayTimer > 0) {
      this.versus.declareDisplayTimer--;
    }

    switch (this.versus.phase) {
      case "idle":
        this.updateVersusIdle(inputs);
        break;
      case "p1_selecting":
        this.updateVersusSelecting(inputs, 1);
        break;
      case "p2_selecting":
        this.updateVersusSelecting(inputs, 2);
        break;
    }

    // Update previous input state for both players
    this.prevP1Inputs = {
      up: inputs.p1.up,
      down: inputs.p1.down,
      left: inputs.p1.left,
      right: inputs.p1.right,
      a: inputs.p1.a,
    };
    this.prevP2Inputs = {
      up: inputs.p2.up,
      down: inputs.p2.down,
      left: inputs.p2.left,
      right: inputs.p2.right,
      a: inputs.p2.a,
    };
  }

  private updateVersusIdle(inputs: GameInput): void {
    // Check for claims - P1 has priority on same frame
    if (inputs.p1.a && !this.prevP1Inputs.a) {
      this.versusStartClaim(1);
    } else if (inputs.p2.a && !this.prevP2Inputs.a) {
      this.versusStartClaim(2);
    }
  }

  private versusStartClaim(player: 1 | 2): void {
    this.versus.phase = player === 1 ? "p1_selecting" : "p2_selecting";
    this.versus.activePlayer = player;
    this.versus.selectionTimer = SELECTION_TIME_FRAMES;
    this.versus.declareDisplayTimer = DECLARE_DISPLAY_DURATION;

    // Reset cursor to center
    const ps = player === 1 ? this.versus.p1 : this.versus.p2;
    ps.cursorRow = 1;
    ps.cursorCol = 1;
    ps.selected.clear();

    // Set flash for declare feedback
    this.board.flashColor = player === 1 ? PLAYER_COLORS.p1.flash : PLAYER_COLORS.p2.flash;
    this.board.flashTimer = 10; // Brief flash
  }

  private updateVersusSelecting(inputs: GameInput, player: 1 | 2): void {
    const playerInputs = player === 1 ? inputs.p1 : inputs.p2;
    const prevInputs = player === 1 ? this.prevP1Inputs : this.prevP2Inputs;
    const ps = player === 1 ? this.versus.p1 : this.versus.p2;

    // Decrement timer
    this.versus.selectionTimer--;

    // Check for timeout
    if (this.versus.selectionTimer <= 0) {
      this.versusOnFailure(player);
      return;
    }

    // Cursor movement (edge-triggered)
    if (playerInputs.up && !prevInputs.up) {
      ps.cursorRow = (ps.cursorRow - 1 + GRID_ROWS) % GRID_ROWS;
    }
    if (playerInputs.down && !prevInputs.down) {
      ps.cursorRow = (ps.cursorRow + 1) % GRID_ROWS;
    }
    if (playerInputs.left && !prevInputs.left) {
      ps.cursorCol = (ps.cursorCol - 1 + GRID_COLS) % GRID_COLS;
    }
    if (playerInputs.right && !prevInputs.right) {
      ps.cursorCol = (ps.cursorCol + 1) % GRID_COLS;
    }

    // Card selection with A button
    if (playerInputs.a && !prevInputs.a) {
      const key = positionKey(ps.cursorRow, ps.cursorCol);

      if (ps.selected.has(key)) {
        ps.selected.delete(key);
      } else if (ps.selected.size < 3 && this.board.cards[ps.cursorRow][ps.cursorCol] !== null) {
        ps.selected.add(key);

        // Check if we have exactly 3 cards selected
        if (ps.selected.size === 3) {
          const result = this.board.trySet(ps.selected);
          ps.selected.clear();

          if (result.valid) {
            this.versusOnSuccess(player);
            if (result.gameOver) {
              this.versusEndGame("score");
            }
          } else {
            this.versusOnFailure(player);
          }
        }
      }
    }
  }

  private versusOnSuccess(player: 1 | 2): void {
    const ps = player === 1 ? this.versus.p1 : this.versus.p2;
    ps.score++;
    this.versusReturnToIdle();
  }

  private versusOnFailure(player: 1 | 2): void {
    const ps = player === 1 ? this.versus.p1 : this.versus.p2;
    ps.lives--;
    ps.selected.clear();

    if (ps.lives === 0) {
      // Player eliminated - other player wins
      this.versus.winner = player === 1 ? 2 : 1;
      this.versus.winReason = "elimination";
      this.state = "game_over";
    } else {
      this.versusReturnToIdle();
    }
  }

  private versusReturnToIdle(): void {
    this.versus.phase = "idle";
    this.versus.activePlayer = null;
    this.versus.selectionTimer = 0;
  }

  private versusEndGame(reason: "score"): void {
    // Determine winner by score
    if (this.versus.p1.score > this.versus.p2.score) {
      this.versus.winner = 1;
    } else {
      this.versus.winner = 2;
    }
    this.versus.winReason = reason;
    this.state = "game_over";
  }

  private updateGameOver(inputs: GameInput): void {
    if (this.edgeTriggered("start", inputs) || this.edgeTriggered("a", inputs)) {
      // Restart in the same mode
      if (this.gameMode === "single") {
        this.startSinglePlayer(inputs);
      } else {
        this.startVersus(inputs);
      }
    }
    // B button returns to title
    if (this.edgeTriggered("b", inputs)) {
      this.state = "title";
      this.menuSelection = 0;
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
    p.text("SET", WIDTH / 2, HEIGHT / 2 - 60);

    // Menu options (Versus is default/first)
    const menuItems = ["Versus Mode", "Solo Mode", "How to Play"];
    p.textSize(20);
    p.textStyle(p.NORMAL);

    for (let i = 0; i < menuItems.length; i++) {
      const isSelected = i === this.menuSelection;
      p.fill(isSelected ? COLORS.selectedBorder : COLORS.white);
      const prefix = isSelected ? "> " : "  ";
      p.text(`${prefix}${menuItems[i]}`, WIDTH / 2, HEIGHT / 2 - 10 + i * 28);
    }

    // Controls hint
    p.fill(COLORS.textMuted);
    p.textSize(12);
    p.text("D-Pad: Select  A/START: Confirm", WIDTH / 2, HEIGHT - 20);
  }

  private drawHelp(): void {
    const p = this.p;

    if (this.helpPage === 0) {
      this.drawHelpRules();
    } else if (this.helpPage === 1) {
      this.drawHelpVersusMode();
    } else {
      this.drawHelpSoloMode();
    }

    // Page indicator at bottom
    p.fill(COLORS.textMuted);
    p.noStroke();
    p.textFont("monospace");
    p.textSize(12);
    p.textAlign(p.CENTER, p.BOTTOM);

    const dots = ["○", "○", "○"];
    dots[this.helpPage] = "●";
    const pageIndicator = dots.join(" ");
    p.text(`< ${pageIndicator} >`, WIDTH / 2, HEIGHT - 18);
    p.text("A: Next  B: Back", WIDTH / 2, HEIGHT - 4);
  }

  private drawHelpVersusMode(): void {
    const p = this.p;
    let y = 14;

    // Title
    p.fill(PLAYER_COLORS.p1.cursor);
    p.noStroke();
    p.textFont("monospace");
    p.textStyle(p.BOLD);
    p.textSize(20);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Versus Mode", WIDTH / 2, y);
    y += 28;

    const rules = [
      "Race to find SETs!",
      "",
      "Press A when you spot a SET.",
      "You have 8 seconds to select",
      "3 cards using D-Pad + A.",
      "",
      "Correct SET: +1 point",
      "Wrong/timeout: lose a life",
      "",
      "Win by: most points when deck",
      "empties, or opponent loses all",
      "3 lives.",
    ];

    p.fill(COLORS.white);
    p.textSize(13);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.TOP);

    for (const line of rules) {
      if (line) {
        p.text(line, 24, y);
      }
      y += 14;
    }

    // Player colors
    y += 4;
    p.textAlign(p.CENTER, p.TOP);
    p.fill(PLAYER_COLORS.p1.cursor);
    p.text("P1: Cyan", WIDTH / 2 - 50, y);
    p.fill(PLAYER_COLORS.p2.cursor);
    p.text("P2: Orange", WIDTH / 2 + 50, y);
  }

  private drawHelpSoloMode(): void {
    const p = this.p;
    let y = 14;

    // Title
    p.fill(COLORS.selectedBorder);
    p.noStroke();
    p.textFont("monospace");
    p.textStyle(p.BOLD);
    p.textSize(20);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Solo Mode", WIDTH / 2, y);
    y += 28;

    const rules = [
      "Find all SETs as fast as you can!",
      "",
      "Use D-Pad to move cursor.",
      "Press A to select cards.",
      "Select 3 cards to check for SET.",
      "",
      "No penalties for wrong guesses.",
      "Race against the clock!",
      "",
      "Clear the deck to win.",
    ];

    p.fill(COLORS.white);
    p.textSize(13);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.TOP);

    for (const line of rules) {
      if (line) {
        p.text(line, 24, y);
      }
      y += 14;
    }
  }

  private drawHelpRules(): void {
    const p = this.p;
    let y = 14;

    // Title
    p.fill(COLORS.selectedBorder);
    p.noStroke();
    p.textFont("monospace");
    p.textStyle(p.BOLD);
    p.textSize(20);
    p.textAlign(p.CENTER, p.TOP);
    p.text("What is a SET?", WIDTH / 2, y);
    y += 28;

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
    p.textSize(13);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.TOP);

    for (const line of rules) {
      if (line) {
        p.text(line, 24, y);
      }
      y += 14;
    }

    y += 6;

    // Controls
    p.fill(COLORS.textMuted);
    p.textAlign(p.CENTER, p.TOP);
    p.text("D-Pad: Move  A: Select card", WIDTH / 2, y);
  }

  private drawPlaying(): void {
    if (this.gameMode === "single") {
      this.drawSinglePlayerPlaying();
    } else {
      this.drawVersusPlaying();
    }
  }

  private drawSinglePlayerPlaying(): void {
    const p = this.p;

    // Draw the board with cursor and selection
    this.board.draw(p, {
      cursor: {
        row: this.cursorRow,
        col: this.cursorCol,
        color: COLORS.cursorColor,
      },
      selected: {
        positions: this.selected,
        color: COLORS.selectedBorder,
      },
    });

    // Score in top left
    p.fill(COLORS.white);
    p.noStroke();
    p.textFont("monospace");
    p.textSize(16);
    p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Sets: ${this.score}`, 10, 10);

    // Timer in top center
    p.textAlign(p.CENTER, p.TOP);
    p.text(this.formatTime(this.elapsedFrames), WIDTH / 2, 10);

    // Deck remaining in top right
    p.fill(COLORS.textMuted);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Deck: ${this.board.deck.length}`, WIDTH - 10, 12);
  }

  private drawVersusPlaying(): void {
    const p = this.p;
    const activePlayer = this.versus.activePlayer;

    // Draw the board - only show cursor/selection for active player during selection
    if (activePlayer !== null) {
      const ps = activePlayer === 1 ? this.versus.p1 : this.versus.p2;
      const colors = activePlayer === 1 ? PLAYER_COLORS.p1 : PLAYER_COLORS.p2;
      this.board.draw(p, {
        cursor: {
          row: ps.cursorRow,
          col: ps.cursorCol,
          color: colors.cursor,
        },
        selected: {
          positions: ps.selected,
          color: colors.selected,
        },
      });
    } else {
      // Idle - no cursor
      this.board.draw(p);
    }

    // HUD setup
    p.noStroke();
    p.textFont("monospace");
    p.textStyle(p.NORMAL);

    // P1 stats (left side)
    p.fill(PLAYER_COLORS.p1.cursor);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`P1: ${this.versus.p1.score} pts`, 8, 6);
    p.textSize(12);
    p.text(this.drawLives(this.versus.p1.lives), 8, 22);

    // P2 stats (right side)
    p.fill(PLAYER_COLORS.p2.cursor);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`P2: ${this.versus.p2.score} pts`, WIDTH - 8, 6);
    p.textSize(12);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(this.drawLives(this.versus.p2.lives), WIDTH - 8, 22);

    // Selection timer (bottom center, only during selection)
    if (activePlayer !== null) {
      const secondsRemaining = this.versus.selectionTimer / FPS;
      const timerColor = secondsRemaining <= 3 ? COLORS.flashRed : COLORS.white;

      p.fill(timerColor);
      p.textSize(14);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(`[ ${secondsRemaining.toFixed(1)}s ]`, WIDTH / 2, HEIGHT - 4);
    } else {
      // Idle phase - show instruction to press A
      p.fill(COLORS.textMuted);
      p.textSize(12);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text("Press A when you see a SET!", WIDTH / 2, HEIGHT - 4);
    }

    // "P1/P2 Declared Set" display (shown briefly after claim)
    if (this.versus.declareDisplayTimer > 0 && activePlayer !== null) {
      const playerColor = activePlayer === 1 ? PLAYER_COLORS.p1.cursor : PLAYER_COLORS.p2.cursor;
      p.fill(playerColor);
      p.textSize(12);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.text(`P${activePlayer} Declared Set`, WIDTH / 2, HEIGHT - 20);
    }
  }

  private drawLives(lives: number): string {
    const filled = "\u2665"; // ♥
    const empty = "\u2661";  // ♡
    return filled.repeat(lives) + empty.repeat(STARTING_LIVES - lives);
  }

  private drawGameOver(): void {
    if (this.gameMode === "single") {
      this.drawSinglePlayerGameOver();
    } else {
      this.drawVersusGameOver();
    }
  }

  private drawSinglePlayerGameOver(): void {
    const p = this.p;

    p.noStroke();
    p.textFont("monospace");
    p.textAlign(p.CENTER, p.CENTER);

    // Congratulations
    p.fill(COLORS.selectedBorder);
    p.textStyle(p.BOLD);
    p.textSize(24);
    p.text("Congratulations!", WIDTH / 2, HEIGHT / 2 - 50);
    p.text("You WON!", WIDTH / 2, HEIGHT / 2 - 20);

    // Final stats
    p.fill(COLORS.white);
    p.textStyle(p.NORMAL);
    p.textSize(18);
    p.text(`Time: ${this.formatTime(this.elapsedFrames)}`, WIDTH / 2, HEIGHT / 2 + 15);
    p.text(`Sets Found: ${this.score}`, WIDTH / 2, HEIGHT / 2 + 40);

    // Restart hint
    p.fill(COLORS.textMuted);
    p.textSize(12);
    p.text("A/START: Play again  B: Menu", WIDTH / 2, HEIGHT / 2 + 75);
  }

  private drawVersusGameOver(): void {
    const p = this.p;
    const winner = this.versus.winner;
    const winnerColor = winner === 1 ? PLAYER_COLORS.p1.cursor : PLAYER_COLORS.p2.cursor;

    p.noStroke();
    p.textFont("monospace");
    p.textAlign(p.CENTER, p.CENTER);

    // Winner announcement
    p.fill(winnerColor);
    p.textStyle(p.BOLD);
    p.textSize(24);
    p.text(`Player ${winner} Wins!`, WIDTH / 2, HEIGHT / 2 - 50);

    // Win reason
    p.fill(COLORS.white);
    p.textStyle(p.NORMAL);
    p.textSize(16);
    if (this.versus.winReason === "elimination") {
      const loser = winner === 1 ? 2 : 1;
      p.text(`Player ${loser} eliminated!`, WIDTH / 2, HEIGHT / 2 - 20);
    }

    // Final scores
    p.textSize(18);
    p.fill(PLAYER_COLORS.p1.cursor);
    p.text(`P1: ${this.versus.p1.score} pts`, WIDTH / 2 - 60, HEIGHT / 2 + 15);
    p.fill(PLAYER_COLORS.p2.cursor);
    p.text(`P2: ${this.versus.p2.score} pts`, WIDTH / 2 + 60, HEIGHT / 2 + 15);

    // Restart hint
    p.fill(COLORS.textMuted);
    p.textSize(12);
    p.text("A/START: Play again  B: Menu", WIDTH / 2, HEIGHT / 2 + 55);
  }
}

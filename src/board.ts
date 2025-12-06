import type { RGB, PlayerInput } from './types';
import { Card, createDeck, shuffleDeck, hasValidSet, findAllValidSets } from './card';
import { Renderer } from './renderer';
import {
  GRID_COLS, GRID_ROWS, GRID_START_X, GRID_START_Y,
  CARD_WIDTH, CARD_HEIGHT, CARD_MARGIN,
  CARD_BG, CARD_BG_HOVER, CARD_BG_SELECTED, CARD_BORDER,
  SELECTED_BORDER, CURSOR_COLOR, FLASH_GREEN, FLASH_RED,
  FLASH_DURATION_MS, FLIP_DURATION_MS,
} from './constants';

interface FlipAnimation {
  oldCard: Card | null;
  newCard: Card | null;
  startTime: number;
}

export class GameBoard {
  deck: Card[];
  cards: (Card | null)[][];
  selected: Set<string>;
  cursorRow: number;
  cursorCol: number;
  score: number;
  gameOver: boolean;
  debugMode: boolean;

  private prevInputs: Record<string, boolean>;
  private flashColor: RGB | null;
  private flashStartTime: number;
  private flashPositions: Set<string>;
  private flipAnimations: Map<string, FlipAnimation>;

  constructor(initialInputs?: PlayerInput) {
    this.deck = createDeck();
    shuffleDeck(this.deck);
    this.cards = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
    this.selected = new Set();
    this.cursorRow = 0;
    this.cursorCol = 0;
    this.score = 0;
    this.gameOver = false;
    this.debugMode = true;

    this.prevInputs = {
      up: initialInputs?.up ?? false,
      down: initialInputs?.down ?? false,
      left: initialInputs?.left ?? false,
      right: initialInputs?.right ?? false,
      a: initialInputs?.a ?? false,
    };

    this.flashColor = null;
    this.flashStartTime = 0;
    this.flashPositions = new Set();
    this.flipAnimations = new Map();

    this.dealInitialCards();
    this.printValidSets();
  }

  private dealInitialCards(): void {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (this.deck.length > 0) {
          this.cards[row][col] = this.deck.pop()!;
        }
      }
    }
    this.ensureValidSetExists();
  }

  private ensureValidSetExists(): void {
    const flatCards = this.cards.flat();
    let attempts = 0;
    const maxAttempts = 1000;

    while (!hasValidSet(flatCards) && this.deck.length > 0 && attempts < maxAttempts) {
      const boardPositions: [number, number][] = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (this.cards[r][c]) boardPositions.push([r, c]);
        }
      }
      if (boardPositions.length === 0) break;

      const [r, c] = boardPositions[Math.floor(Math.random() * boardPositions.length)];
      const deckIdx = Math.floor(Math.random() * this.deck.length);
      const temp = this.cards[r][c];
      this.cards[r][c] = this.deck[deckIdx];
      this.deck[deckIdx] = temp!;
      attempts++;
    }
  }

  private printValidSets(): void {
    if (!this.debugMode) return;
    const validSets = findAllValidSets(this.cards.flat());
    console.log(`\n=== Valid sets (${validSets.length}): ===`);
    for (const [i, j, k] of validSets) {
      const r1 = Math.floor(i / GRID_COLS), c1 = i % GRID_COLS;
      const r2 = Math.floor(j / GRID_COLS), c2 = j % GRID_COLS;
      const r3 = Math.floor(k / GRID_COLS), c3 = k % GRID_COLS;
      console.log(`  (${r1},${c1}) + (${r2},${c2}) + (${r3},${c3})`);
    }
  }

  private posKey(row: number, col: number): string {
    return `${row},${col}`;
  }

  getCardRect(row: number, col: number): { x: number; y: number; width: number; height: number } {
    return {
      x: GRID_START_X + col * (CARD_WIDTH + CARD_MARGIN),
      y: GRID_START_Y + row * (CARD_HEIGHT + CARD_MARGIN),
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    };
  }

  update(inputs: PlayerInput, now: number): void {
    // Update flash
    if (this.flashColor && now - this.flashStartTime > FLASH_DURATION_MS) {
      this.flashColor = null;
      this.flashPositions.clear();
    }

    // Update flip animations
    for (const [key, anim] of this.flipAnimations) {
      if (now - anim.startTime > FLIP_DURATION_MS) {
        this.flipAnimations.delete(key);
      }
    }

    // Edge-triggered cursor movement
    if (inputs.up && !this.prevInputs.up) {
      this.cursorRow = (this.cursorRow - 1 + GRID_ROWS) % GRID_ROWS;
    }
    if (inputs.down && !this.prevInputs.down) {
      this.cursorRow = (this.cursorRow + 1) % GRID_ROWS;
    }
    if (inputs.left && !this.prevInputs.left) {
      this.cursorCol = (this.cursorCol - 1 + GRID_COLS) % GRID_COLS;
    }
    if (inputs.right && !this.prevInputs.right) {
      this.cursorCol = (this.cursorCol + 1) % GRID_COLS;
    }

    // Card selection with A button
    if (inputs.a && !this.prevInputs.a) {
      const key = this.posKey(this.cursorRow, this.cursorCol);
      if (this.selected.has(key)) {
        this.selected.delete(key);
      } else if (this.selected.size < 3 && this.cards[this.cursorRow][this.cursorCol]) {
        this.selected.add(key);
        if (this.selected.size === 3) {
          this.checkSet(now);
        }
      }
    }

    this.prevInputs = {
      up: inputs.up,
      down: inputs.down,
      left: inputs.left,
      right: inputs.right,
      a: inputs.a,
    };
  }

  private checkSet(now: number): void {
    const positions = Array.from(this.selected).map(k => {
      const [r, c] = k.split(',').map(Number);
      return { row: r, col: c };
    });

    this.flashPositions = new Set(this.selected);
    this.flashStartTime = now;

    const cards = positions.map(p => this.cards[p.row][p.col]!);

    if (cards[0].checkIfSet(cards[1], cards[2])) {
      this.flashColor = FLASH_GREEN;
      this.score++;

      // Start flip animations and replace cards
      for (const pos of positions) {
        const key = this.posKey(pos.row, pos.col);
        const oldCard = this.cards[pos.row][pos.col];
        const newCard = this.deck.length > 0 ? this.deck.pop()! : null;

        this.flipAnimations.set(key, {
          oldCard,
          newCard,
          startTime: now,
        });
        this.cards[pos.row][pos.col] = newCard;
      }

      this.ensureValidSetExists();

      // Update animations with potentially swapped cards
      for (const pos of positions) {
        const key = this.posKey(pos.row, pos.col);
        const anim = this.flipAnimations.get(key);
        if (anim) {
          anim.newCard = this.cards[pos.row][pos.col];
        }
      }

      this.printValidSets();

      // Check for game over
      if (this.deck.length === 0 && !hasValidSet(this.cards.flat())) {
        this.gameOver = true;
      }
    } else {
      this.flashColor = FLASH_RED;
    }

    this.selected.clear();
  }

  draw(renderer: Renderer, now: number): void {
    const ctx = renderer.getContext();

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const key = this.posKey(row, col);
        const baseRect = this.getCardRect(row, col);
        let card = this.cards[row][col];
        let rect = baseRect;

        // Handle flip animation
        const anim = this.flipAnimations.get(key);
        if (anim) {
          const elapsed = now - anim.startTime;
          const progress = Math.min(1, elapsed / FLIP_DURATION_MS);

          let scale: number;
          if (progress < 0.5) {
            card = anim.oldCard;
            scale = 1 - progress * 2;
          } else {
            card = anim.newCard;
            scale = (progress - 0.5) * 2;
          }

          if (!card) continue;

          const scaledWidth = Math.floor(CARD_WIDTH * scale);
          if (scaledWidth < 2) continue;

          const xOffset = Math.floor((CARD_WIDTH - scaledWidth) / 2);
          rect = {
            x: baseRect.x + xOffset,
            y: baseRect.y,
            width: scaledWidth,
            height: CARD_HEIGHT,
          };
        }

        if (!card) continue;

        const isSelected = this.selected.has(key);
        const isCursor = row === this.cursorRow && col === this.cursorCol;

        // Card background
        let bgColor: RGB = CARD_BG;
        if (isCursor) bgColor = CARD_BG_HOVER;
        else if (isSelected) bgColor = CARD_BG_SELECTED;
        renderer.fillRect(rect.x, rect.y, rect.width, rect.height, bgColor);

        // Border
        const isFlashing = this.flashPositions.has(key);
        let borderColor: RGB = CARD_BORDER;
        let borderWidth = 1;

        if (this.flashColor && isFlashing) {
          borderColor = this.flashColor;
          borderWidth = 3;
        } else if (isSelected) {
          borderColor = SELECTED_BORDER;
          borderWidth = 3;
        } else if (isCursor) {
          borderColor = CURSOR_COLOR;
          borderWidth = 2;
        }

        renderer.strokeRect(rect.x, rect.y, rect.width, rect.height, borderColor, borderWidth);

        // Draw card shapes
        card.draw(ctx, rect.x, rect.y, rect.width, rect.height);
      }
    }
  }
}

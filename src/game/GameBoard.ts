/**
 * GameBoard class - manages the game board, deck, and gameplay logic
 */

import type p5 from "p5";
import { Card } from "./Card";
import type { FlipAnimation, Position, BoardDrawOptions, SetAttemptResult } from "./types";
import { positionKey, parsePositionKey } from "./types";
import {
  GRID_COLS,
  GRID_ROWS,
  GRID_START_X,
  GRID_START_Y,
  CARD_WIDTH,
  CARD_HEIGHT,
  CARD_MARGIN,
  COLORS,
  SHAPES,
  CARD_COLORS,
  COUNTS,
  FILLS,
  FLASH_DURATION,
  FLIP_DURATION,
} from "./constants";

export class GameBoard {
  // Game state
  deck: Card[] = [];
  cards: (Card | null)[][] = [];
  gameOver = false;
  debugMode = true;

  // Visual feedback
  flashColor: string | null = null;
  flashTimer = 0;
  flashPositions: Set<string> = new Set();

  // Animations
  flipAnimations: Map<string, FlipAnimation> = new Map();

  constructor() {
    this.deck = this.createDeck();
    this.shuffleDeck();
    this.cards = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => null)
    );
    this.dealInitialCards();
    this.printValidSets();
  }

  /**
   * Create the full 81-card deck (3^4 = 81 unique combinations).
   */
  private createDeck(): Card[] {
    const deck: Card[] = [];
    for (const shape of SHAPES) {
      for (const color of CARD_COLORS) {
        for (const count of COUNTS) {
          for (const fill of FILLS) {
            deck.push(new Card({ shape, color, count, fill }));
          }
        }
      }
    }
    return deck;
  }

  /**
   * Fisher-Yates shuffle for the deck.
   */
  private shuffleDeck(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  /**
   * Deal initial 12 cards to fill the board.
   */
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

  /**
   * Ensure at least one valid set exists on the board by swapping cards with deck.
   */
  private ensureValidSetExists(): void {
    const maxAttempts = 1000;
    let attempts = 0;

    while (!this.hasValidSet() && this.deck.length > 0 && attempts < maxAttempts) {
      // Get all board positions with cards
      const boardPositions: Position[] = [];
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          if (this.cards[row][col] !== null) {
            boardPositions.push({ row, col });
          }
        }
      }

      if (boardPositions.length === 0) break;

      // Swap a random board card with a random deck card
      const pos = boardPositions[Math.floor(Math.random() * boardPositions.length)];
      const deckIdx = Math.floor(Math.random() * this.deck.length);

      const temp = this.cards[pos.row][pos.col];
      this.cards[pos.row][pos.col] = this.deck[deckIdx];
      this.deck[deckIdx] = temp!;

      attempts++;
    }
  }

  /**
   * Check if any valid set exists on the board.
   */
  hasValidSet(): boolean {
    const cardPositions: Position[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (this.cards[row][col] !== null) {
          cardPositions.push({ row, col });
        }
      }
    }

    // Check all combinations of 3 cards
    for (let i = 0; i < cardPositions.length - 2; i++) {
      for (let j = i + 1; j < cardPositions.length - 1; j++) {
        for (let k = j + 1; k < cardPositions.length; k++) {
          const p1 = cardPositions[i];
          const p2 = cardPositions[j];
          const p3 = cardPositions[k];
          const c1 = this.cards[p1.row][p1.col]!;
          const c2 = this.cards[p2.row][p2.col]!;
          const c3 = this.cards[p3.row][p3.col]!;

          if (Card.checkSet(c1, c2, c3)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Get all valid sets on the board (for debug mode).
   */
  getAllValidSets(): Position[][] {
    const cardPositions: Position[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (this.cards[row][col] !== null) {
          cardPositions.push({ row, col });
        }
      }
    }

    const validSets: Position[][] = [];

    for (let i = 0; i < cardPositions.length - 2; i++) {
      for (let j = i + 1; j < cardPositions.length - 1; j++) {
        for (let k = j + 1; k < cardPositions.length; k++) {
          const p1 = cardPositions[i];
          const p2 = cardPositions[j];
          const p3 = cardPositions[k];
          const c1 = this.cards[p1.row][p1.col]!;
          const c2 = this.cards[p2.row][p2.col]!;
          const c3 = this.cards[p3.row][p3.col]!;

          if (Card.checkSet(c1, c2, c3)) {
            validSets.push([p1, p2, p3]);
          }
        }
      }
    }

    return validSets;
  }

  /**
   * Print all valid sets to console (debug mode only).
   */
  private printValidSets(): void {
    if (!this.debugMode) return;

    const validSets = this.getAllValidSets();
    console.log(`\n=== Valid sets (${validSets.length}): ===`);
    for (const s of validSets) {
      console.log(`  (${s[0].row},${s[0].col}) + (${s[1].row},${s[1].col}) + (${s[2].row},${s[2].col})`);
    }
  }

  /**
   * Get the rectangle for a card at the given grid position.
   */
  getCardRect(row: number, col: number): { x: number; y: number; width: number; height: number } {
    const x = GRID_START_X + col * (CARD_WIDTH + CARD_MARGIN);
    const y = GRID_START_Y + row * (CARD_HEIGHT + CARD_MARGIN);
    return { x, y, width: CARD_WIDTH, height: CARD_HEIGHT };
  }

  /**
   * Update animations and timers (call each frame).
   */
  update(): void {
    // Update flash timer
    if (this.flashTimer > 0) {
      this.flashTimer--;
      if (this.flashTimer === 0) {
        this.flashColor = null;
        this.flashPositions.clear();
      }
    }

    // Update flip animations
    const completedAnims: string[] = [];
    for (const [key, anim] of this.flipAnimations) {
      anim.progress += 1.0 / FLIP_DURATION;
      if (anim.progress >= 1.0) {
        completedAnims.push(key);
      }
    }
    for (const key of completedAnims) {
      this.flipAnimations.delete(key);
    }
  }

  /**
   * Attempt to claim a set with the given selected positions.
   * Returns whether the set was valid and if the game is over.
   */
  trySet(selected: Set<string>): SetAttemptResult {
    if (selected.size !== 3) {
      return { valid: false, gameOver: false };
    }

    const positions = Array.from(selected).map(parsePositionKey);
    const cards = positions.map((p) => this.cards[p.row][p.col]!);

    // Store positions for flashing
    this.flashPositions = new Set(selected);
    this.flashTimer = FLASH_DURATION;

    if (Card.checkSet(cards[0], cards[1], cards[2])) {
      // Valid set!
      this.flashColor = COLORS.flashGreen;

      // Start flip animations and replace cards
      for (const pos of positions) {
        const key = positionKey(pos.row, pos.col);
        const oldCard = this.cards[pos.row][pos.col];
        const newCard = this.deck.length > 0 ? this.deck.pop()! : null;

        this.flipAnimations.set(key, {
          oldCard: oldCard?.toData() ?? null,
          newCard: newCard?.toData() ?? null,
          progress: 0,
        });

        this.cards[pos.row][pos.col] = newCard;
      }

      // Ensure valid set still exists
      this.ensureValidSetExists();

      // Update animations to reflect any swaps made by ensureValidSetExists
      for (const pos of positions) {
        const key = positionKey(pos.row, pos.col);
        const anim = this.flipAnimations.get(key);
        if (anim) {
          anim.newCard = this.cards[pos.row][pos.col]?.toData() ?? null;
        }
      }

      this.printValidSets();

      // Check for game over
      const isGameOver = this.deck.length === 0 && !this.hasValidSet();
      if (isGameOver) {
        this.gameOver = true;
      }

      return { valid: true, gameOver: isGameOver };
    } else {
      // Invalid set
      this.flashColor = COLORS.flashRed;
      return { valid: false, gameOver: false };
    }
  }

  /**
   * Draw the game board using p5.
   * @param p The p5 instance
   * @param options Optional cursor and selection state for rendering
   */
  draw(p: p5, options: BoardDrawOptions = {}): void {
    const { cursor, selected } = options;

    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const key = positionKey(row, col);
        const baseRect = this.getCardRect(row, col);

        let card: Card | null = null;
        let rect = baseRect;

        // Check if this card is flipping
        const anim = this.flipAnimations.get(key);
        if (anim) {
          const progress = anim.progress;

          // First half: old card shrinks, second half: new card grows
          if (progress < 0.5) {
            card = anim.oldCard ? new Card(anim.oldCard) : null;
            const scale = 1.0 - progress * 2; // 1.0 -> 0.0
            const scaledWidth = Math.floor(CARD_WIDTH * scale);
            if (scaledWidth < 2) continue;
            const xOffset = Math.floor((CARD_WIDTH - scaledWidth) / 2);
            rect = {
              x: baseRect.x + xOffset,
              y: baseRect.y,
              width: scaledWidth,
              height: CARD_HEIGHT,
            };
          } else {
            card = anim.newCard ? new Card(anim.newCard) : null;
            const scale = (progress - 0.5) * 2; // 0.0 -> 1.0
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
        } else {
          card = this.cards[row][col];
        }

        if (card === null) continue;

        const isSelected = selected?.positions.has(key) ?? false;
        const isCursor = cursor && row === cursor.row && col === cursor.col;
        const isFlashing = this.flashPositions.has(key);

        // Card background
        let bgColor: string;
        if (isCursor) {
          bgColor = COLORS.cardBgHover;
        } else if (isSelected) {
          bgColor = COLORS.cardBgSelected;
        } else {
          bgColor = COLORS.cardBg;
        }

        // Card border
        let borderColor: string;
        let lineWidth: number;
        if (this.flashColor && isFlashing) {
          borderColor = this.flashColor;
          lineWidth = 3;
        } else if (isSelected) {
          borderColor = selected?.color ?? COLORS.selectedBorder;
          lineWidth = 3;
        } else if (isCursor) {
          borderColor = cursor?.color ?? COLORS.cursorColor;
          lineWidth = 2;
        } else {
          borderColor = COLORS.cardBorder;
          lineWidth = 1;
        }

        // Draw card background and border
        p.fill(bgColor);
        p.stroke(borderColor);
        p.strokeWeight(lineWidth);
        p.rect(rect.x, rect.y, rect.width, rect.height);

        // Draw card shapes
        card.draw(p, rect.x, rect.y, rect.width, rect.height);
      }
    }
  }
}

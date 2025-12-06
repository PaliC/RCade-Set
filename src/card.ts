import type { Shape, Color, Count, Fill } from './types';
import { getShapeCanvas, SHAPE_SIZE } from './shapes';
import { SHAPE_SPACING } from './constants';

export class Card {
  readonly shape: Shape;
  readonly color: Color;
  readonly count: Count;
  readonly fill: Fill;

  constructor(shape: Shape, color: Color, count: Count, fill: Fill) {
    this.shape = shape;
    this.color = color;
    this.count = count;
    this.fill = fill;
  }

  checkIfSet(other1: Card, other2: Card): boolean {
    const checkAttr = <T>(a: T, b: T, c: T): boolean => {
      const allSame = a === b && b === c;
      const allDiff = a !== b && a !== c && b !== c;
      return allSame || allDiff;
    };

    return (
      checkAttr(this.shape, other1.shape, other2.shape) &&
      checkAttr(this.color, other1.color, other2.color) &&
      checkAttr(this.count, other1.count, other2.count) &&
      checkAttr(this.fill, other1.fill, other2.fill)
    );
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
    const count = parseInt(this.count, 10);
    const shapeCanvas = getShapeCanvas(this.shape, this.color, this.fill);
    if (!shapeCanvas) return;

    const totalWidth = count * SHAPE_SIZE + (count - 1) * (SHAPE_SPACING - SHAPE_SIZE);
    const startX = x + Math.floor((width - totalWidth) / 2);
    const centerY = y + Math.floor((height - SHAPE_SIZE) / 2);

    // drawImage is faster than putImageData because it uses GPU acceleration
    for (let i = 0; i < count; i++) {
      ctx.drawImage(shapeCanvas, startX + i * SHAPE_SPACING, centerY);
    }
  }

  equals(other: Card): boolean {
    return this.shape === other.shape && this.color === other.color &&
           this.count === other.count && this.fill === other.fill;
  }

  toString(): string {
    return `Card(${this.shape}, ${this.color}, ${this.count}, ${this.fill})`;
  }
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  const shapes: Shape[] = ['diamond', 'oval', 'squiggle'];
  const colors: Color[] = ['red', 'green', 'purple'];
  const counts: Count[] = ['1', '2', '3'];
  const fills: Fill[] = ['solid', 'striped', 'empty'];

  for (const shape of shapes) {
    for (const color of colors) {
      for (const count of counts) {
        for (const fill of fills) {
          deck.push(new Card(shape, color, count, fill));
        }
      }
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): void {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

export function hasValidSet(cards: (Card | null)[]): boolean {
  const valid = cards.filter((c): c is Card => c !== null);
  if (valid.length < 3) return false;

  for (let i = 0; i < valid.length - 2; i++) {
    for (let j = i + 1; j < valid.length - 1; j++) {
      for (let k = j + 1; k < valid.length; k++) {
        if (valid[i].checkIfSet(valid[j], valid[k])) return true;
      }
    }
  }
  return false;
}

export function findAllValidSets(cards: (Card | null)[]): [number, number, number][] {
  const validSets: [number, number, number][] = [];
  for (let i = 0; i < cards.length - 2; i++) {
    if (!cards[i]) continue;
    for (let j = i + 1; j < cards.length - 1; j++) {
      if (!cards[j]) continue;
      for (let k = j + 1; k < cards.length; k++) {
        if (!cards[k]) continue;
        if (cards[i]!.checkIfSet(cards[j]!, cards[k]!)) {
          validSets.push([i, j, k]);
        }
      }
    }
  }
  return validSets;
}

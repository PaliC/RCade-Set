/**
 * Card class representing a single Set card
 */

import type p5 from "p5";
import type { CardData, Shape, Color, Count, Fill } from "./types";
import { shapeRenderer } from "./ShapeRenderer";
import { CARD_WIDTH, CARD_HEIGHT, SHAPE_SIZE, SHAPE_SPACING } from "./constants";

export class Card {
  readonly shape: Shape;
  readonly color: Color;
  readonly count: Count;
  readonly fill: Fill;

  constructor(data: CardData) {
    this.shape = data.shape;
    this.color = data.color;
    this.count = data.count;
    this.fill = data.fill;
  }

  /**
   * Check if three cards form a valid set.
   * For each attribute, all three cards must be either all the same or all different.
   */
  static checkSet(a: Card, b: Card, c: Card): boolean {
    return (
      Card.checkAttribute(a.shape, b.shape, c.shape) &&
      Card.checkAttribute(a.color, b.color, c.color) &&
      Card.checkAttribute(a.count, b.count, c.count) &&
      Card.checkAttribute(a.fill, b.fill, c.fill)
    );
  }

  /**
   * Check if three attribute values are all the same or all different.
   */
  private static checkAttribute<T>(a: T, b: T, c: T): boolean {
    const allSame = a === b && b === c;
    const allDifferent = a !== b && b !== c && a !== c;
    return allSame || allDifferent;
  }

  /**
   * Check if this card forms a valid set with two other cards.
   */
  checkIfSet(other1: Card, other2: Card): boolean {
    return Card.checkSet(this, other1, other2);
  }

  /**
   * Draw this card's shapes using p5.
   */
  draw(
    p: p5,
    x: number,
    y: number,
    width: number = CARD_WIDTH,
    height: number = CARD_HEIGHT
  ): void {
    const shapeSurface = shapeRenderer.getShape(this.shape, this.color, this.fill);
    if (!shapeSurface) return;

    // Layout: shapes arranged horizontally
    const totalWidth =
      this.count * SHAPE_SIZE + (this.count - 1) * (SHAPE_SPACING - SHAPE_SIZE);
    const startX = x + (width - totalWidth) / 2;
    const centerY = y + (height - SHAPE_SIZE) / 2;

    for (let i = 0; i < this.count; i++) {
      const sx = startX + i * SHAPE_SPACING;
      p.image(shapeSurface, sx, centerY);
    }
  }

  /**
   * Check if two cards are equal (same attributes).
   */
  equals(other: Card): boolean {
    return (
      this.shape === other.shape &&
      this.color === other.color &&
      this.count === other.count &&
      this.fill === other.fill
    );
  }

  /**
   * Get a string representation of the card.
   */
  toString(): string {
    return `Card(${this.count} ${this.color} ${this.fill} ${this.shape})`;
  }

  /**
   * Get card data as a plain object.
   */
  toData(): CardData {
    return {
      shape: this.shape,
      color: this.color,
      count: this.count,
      fill: this.fill,
    };
  }
}

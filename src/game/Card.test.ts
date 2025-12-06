/**
 * Tests for Set card game logic
 */

import { describe, it, expect } from "vitest";
import { Card } from "./Card";
import type { Shape, Color, Count, Fill } from "./types";

// Helper to create cards quickly
function card(shape: Shape, color: Color, count: Count, fill: Fill): Card {
  return new Card({ shape, color, count, fill });
}

describe("Card", () => {
  describe("checkSet", () => {
    it("should validate set where all attributes are the same", () => {
      const c1 = card("diamond", "red", 1, "solid");
      const c2 = card("diamond", "red", 1, "solid");
      const c3 = card("diamond", "red", 1, "solid");

      expect(Card.checkSet(c1, c2, c3)).toBe(true);
    });

    it("should validate set where all attributes are different", () => {
      const c1 = card("diamond", "red", 1, "solid");
      const c2 = card("oval", "green", 2, "striped");
      const c3 = card("squiggle", "purple", 3, "empty");

      expect(Card.checkSet(c1, c2, c3)).toBe(true);
    });

    it("should validate set with mixed same/different attributes", () => {
      // Same shape (diamond), different colors, different counts, different fills
      const c1 = card("diamond", "red", 1, "solid");
      const c2 = card("diamond", "green", 2, "striped");
      const c3 = card("diamond", "purple", 3, "empty");

      expect(Card.checkSet(c1, c2, c3)).toBe(true);
    });

    it("should validate set with same shape and color, different count and fill", () => {
      const c1 = card("oval", "red", 1, "solid");
      const c2 = card("oval", "red", 2, "striped");
      const c3 = card("oval", "red", 3, "empty");

      expect(Card.checkSet(c1, c2, c3)).toBe(true);
    });

    it("should reject invalid set - shape has two same, one different", () => {
      const c1 = card("diamond", "red", 1, "solid");
      const c2 = card("diamond", "red", 2, "solid");
      const c3 = card("oval", "red", 3, "solid");

      expect(Card.checkSet(c1, c2, c3)).toBe(false);
    });

    it("should reject invalid set - color has two same, one different", () => {
      const c1 = card("diamond", "red", 1, "solid");
      const c2 = card("oval", "red", 2, "solid");
      const c3 = card("squiggle", "green", 3, "solid");

      expect(Card.checkSet(c1, c2, c3)).toBe(false);
    });

    it("should reject invalid set - count has two same, one different", () => {
      const c1 = card("diamond", "red", 1, "solid");
      const c2 = card("oval", "green", 1, "striped");
      const c3 = card("squiggle", "purple", 2, "empty");

      expect(Card.checkSet(c1, c2, c3)).toBe(false);
    });

    it("should reject invalid set - fill has two same, one different", () => {
      const c1 = card("diamond", "red", 1, "solid");
      const c2 = card("oval", "green", 2, "solid");
      const c3 = card("squiggle", "purple", 3, "striped");

      expect(Card.checkSet(c1, c2, c3)).toBe(false);
    });
  });

  describe("checkIfSet (instance method)", () => {
    it("should work the same as static checkSet", () => {
      const c1 = card("diamond", "red", 1, "solid");
      const c2 = card("oval", "green", 2, "striped");
      const c3 = card("squiggle", "purple", 3, "empty");

      expect(c1.checkIfSet(c2, c3)).toBe(true);
      expect(Card.checkSet(c1, c2, c3)).toBe(true);
    });
  });

  describe("equals", () => {
    it("should return true for cards with same attributes", () => {
      const c1 = card("diamond", "red", 1, "solid");
      const c2 = card("diamond", "red", 1, "solid");

      expect(c1.equals(c2)).toBe(true);
    });

    it("should return false for cards with different attributes", () => {
      const c1 = card("diamond", "red", 1, "solid");
      const c2 = card("oval", "red", 1, "solid");

      expect(c1.equals(c2)).toBe(false);
    });
  });

  describe("toString", () => {
    it("should return a readable string representation", () => {
      const c = card("diamond", "red", 2, "striped");
      expect(c.toString()).toBe("Card(2 red striped diamond)");
    });
  });

  describe("toData", () => {
    it("should return the card data as a plain object", () => {
      const c = card("oval", "green", 3, "empty");
      const data = c.toData();

      expect(data).toEqual({
        shape: "oval",
        color: "green",
        count: 3,
        fill: "empty",
      });
    });
  });
});

describe("Set guarantee algorithm", () => {
  // Helper to create a full deck
  function createDeck(): Card[] {
    const shapes: Shape[] = ["diamond", "oval", "squiggle"];
    const colors: Color[] = ["red", "green", "purple"];
    const counts: Count[] = [1, 2, 3];
    const fills: Fill[] = ["solid", "striped", "empty"];

    const deck: Card[] = [];
    for (const shape of shapes) {
      for (const color of colors) {
        for (const count of counts) {
          for (const fill of fills) {
            deck.push(new Card({ shape, color, count, fill }));
          }
        }
      }
    }
    return deck;
  }

  // Helper to check if cards contain a valid set
  function hasValidSet(cards: Card[]): boolean {
    for (let i = 0; i < cards.length - 2; i++) {
      for (let j = i + 1; j < cards.length - 1; j++) {
        for (let k = j + 1; k < cards.length; k++) {
          if (Card.checkSet(cards[i], cards[j], cards[k])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Helper to shuffle array
  function shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // Helper to ensure valid set exists (same algorithm as GameBoard)
  function ensureValidSetExists(cards: Card[], deck: Card[]): void {
    const maxAttempts = 1000;
    let attempts = 0;

    while (!hasValidSet(cards) && deck.length > 0 && attempts < maxAttempts) {
      const boardIdx = Math.floor(Math.random() * cards.length);
      const deckIdx = Math.floor(Math.random() * deck.length);

      const temp = cards[boardIdx];
      cards[boardIdx] = deck[deckIdx];
      deck[deckIdx] = temp;

      attempts++;
    }
  }

  it("should create a deck with exactly 81 cards", () => {
    const deck = createDeck();
    expect(deck.length).toBe(81);
  });

  it("should have all unique cards in the deck", () => {
    const deck = createDeck();
    const seen = new Set<string>();

    for (const card of deck) {
      const key = card.toString();
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it("should always have a valid set after initial deal with guarantee", () => {
    // Test with multiple random seeds
    for (let seed = 0; seed < 50; seed++) {
      // Set up predictable random for this iteration
      const deck = shuffle(createDeck());
      const cards = deck.splice(0, 12);
      ensureValidSetExists(cards, deck);

      expect(hasValidSet(cards)).toBe(true);
    }
  });

  it("should maintain valid set after replacement", () => {
    for (let seed = 0; seed < 30; seed++) {
      const deck = shuffle(createDeck());
      const cards = deck.splice(0, 12);
      ensureValidSetExists(cards, deck);

      // Simulate 5 replacements
      for (let r = 0; r < 5; r++) {
        if (deck.length < 3) break;

        // Replace 3 random cards
        const indices = [0, 4, 8]; // Fixed positions for testing
        for (const i of indices) {
          if (deck.length > 0) {
            cards[i] = deck.pop()!;
          }
        }

        ensureValidSetExists(cards, deck);
        expect(hasValidSet(cards)).toBe(true);
      }
    }
  });

  it("should handle edge case with known valid set", () => {
    const cards = [
      card("diamond", "red", 1, "solid"),
      card("oval", "green", 2, "striped"),
      card("squiggle", "purple", 3, "empty"),
    ];

    expect(hasValidSet(cards)).toBe(true);
  });

  it("should detect when no valid set exists", () => {
    // These 3 cards do NOT form a valid set (shape has 2 same, 1 different)
    const cards = [
      card("diamond", "red", 1, "solid"),
      card("diamond", "green", 2, "striped"),
      card("oval", "purple", 3, "empty"),
    ];

    expect(hasValidSet(cards)).toBe(false);
  });
});

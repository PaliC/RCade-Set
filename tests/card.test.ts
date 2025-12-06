import { describe, it, expect } from 'vitest';
import { Card, createDeck, shuffleDeck, hasValidSet, findAllValidSets } from '../src/card';

describe('Card', () => {
  describe('checkIfSet', () => {
    it('should return true when all attributes are the same', () => {
      const c1 = new Card('diamond', 'red', '1', 'solid');
      const c2 = new Card('diamond', 'red', '1', 'solid');
      const c3 = new Card('diamond', 'red', '1', 'solid');
      expect(c1.checkIfSet(c2, c3)).toBe(true);
    });

    it('should return true when all attributes are different', () => {
      const c1 = new Card('diamond', 'red', '1', 'solid');
      const c2 = new Card('oval', 'green', '2', 'striped');
      const c3 = new Card('squiggle', 'purple', '3', 'empty');
      expect(c1.checkIfSet(c2, c3)).toBe(true);
    });

    it('should return true with mixed same/different attributes', () => {
      // Same shape, different color, count, fill
      const c1 = new Card('diamond', 'red', '1', 'solid');
      const c2 = new Card('diamond', 'green', '2', 'striped');
      const c3 = new Card('diamond', 'purple', '3', 'empty');
      expect(c1.checkIfSet(c2, c3)).toBe(true);
    });

    it('should return false for invalid set (two same, one different)', () => {
      const c1 = new Card('diamond', 'red', '1', 'solid');
      const c2 = new Card('diamond', 'red', '2', 'solid');
      const c3 = new Card('oval', 'red', '3', 'solid');
      expect(c1.checkIfSet(c2, c3)).toBe(false);
    });

    it('should return false when only shape differs incorrectly', () => {
      // Two diamonds, one oval - invalid
      const c1 = new Card('diamond', 'red', '1', 'solid');
      const c2 = new Card('diamond', 'red', '1', 'solid');
      const c3 = new Card('oval', 'red', '1', 'solid');
      expect(c1.checkIfSet(c2, c3)).toBe(false);
    });

    it('should return false when only color differs incorrectly', () => {
      // Two red, one green - invalid
      const c1 = new Card('diamond', 'red', '1', 'solid');
      const c2 = new Card('diamond', 'red', '1', 'solid');
      const c3 = new Card('diamond', 'green', '1', 'solid');
      expect(c1.checkIfSet(c2, c3)).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for identical cards', () => {
      const c1 = new Card('diamond', 'red', '1', 'solid');
      const c2 = new Card('diamond', 'red', '1', 'solid');
      expect(c1.equals(c2)).toBe(true);
    });

    it('should return false for different cards', () => {
      const c1 = new Card('diamond', 'red', '1', 'solid');
      const c2 = new Card('oval', 'red', '1', 'solid');
      expect(c1.equals(c2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return a string representation', () => {
      const c = new Card('diamond', 'red', '1', 'solid');
      expect(c.toString()).toBe('Card(diamond, red, 1, solid)');
    });
  });
});

describe('createDeck', () => {
  it('should create a deck with 81 cards', () => {
    const deck = createDeck();
    expect(deck.length).toBe(81);
  });

  it('should have all unique cards', () => {
    const deck = createDeck();
    const seen = new Set<string>();
    for (const card of deck) {
      const key = card.toString();
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('should have all combinations of attributes', () => {
    const deck = createDeck();
    const shapes = new Set(deck.map(c => c.shape));
    const colors = new Set(deck.map(c => c.color));
    const counts = new Set(deck.map(c => c.count));
    const fills = new Set(deck.map(c => c.fill));

    expect(shapes.size).toBe(3);
    expect(colors.size).toBe(3);
    expect(counts.size).toBe(3);
    expect(fills.size).toBe(3);
  });
});

describe('shuffleDeck', () => {
  it('should maintain deck size', () => {
    const deck = createDeck();
    shuffleDeck(deck);
    expect(deck.length).toBe(81);
  });

  it('should produce a different order (with high probability)', () => {
    const deck1 = createDeck();
    const deck2 = createDeck();
    shuffleDeck(deck2);

    // Check that at least some cards are in different positions
    let differentPositions = 0;
    for (let i = 0; i < deck1.length; i++) {
      if (!deck1[i].equals(deck2[i])) {
        differentPositions++;
      }
    }
    // With 81 cards, at least half should be different after shuffle
    expect(differentPositions).toBeGreaterThan(40);
  });
});

describe('hasValidSet', () => {
  it('should return true when a valid set exists', () => {
    const cards = [
      new Card('diamond', 'red', '1', 'solid'),
      new Card('oval', 'green', '2', 'striped'),
      new Card('squiggle', 'purple', '3', 'empty'),
    ];
    expect(hasValidSet(cards)).toBe(true);
  });

  it('should return false when no valid set exists', () => {
    const cards = [
      new Card('diamond', 'red', '1', 'solid'),
      new Card('diamond', 'red', '2', 'solid'),
      new Card('oval', 'red', '3', 'solid'),
    ];
    expect(hasValidSet(cards)).toBe(false);
  });

  it('should handle null cards', () => {
    const cards = [
      new Card('diamond', 'red', '1', 'solid'),
      null,
      new Card('oval', 'green', '2', 'striped'),
      new Card('squiggle', 'purple', '3', 'empty'),
    ];
    expect(hasValidSet(cards)).toBe(true);
  });

  it('should return false with fewer than 3 cards', () => {
    const cards = [
      new Card('diamond', 'red', '1', 'solid'),
      new Card('oval', 'green', '2', 'striped'),
    ];
    expect(hasValidSet(cards)).toBe(false);
  });
});

describe('findAllValidSets', () => {
  it('should find all valid sets', () => {
    const cards = [
      new Card('diamond', 'red', '1', 'solid'),
      new Card('oval', 'green', '2', 'striped'),
      new Card('squiggle', 'purple', '3', 'empty'),
      new Card('diamond', 'green', '1', 'solid'),
    ];
    const sets = findAllValidSets(cards);
    expect(sets.length).toBeGreaterThanOrEqual(1);
    expect(sets).toContainEqual([0, 1, 2]);
  });

  it('should return empty array when no valid sets exist', () => {
    const cards = [
      new Card('diamond', 'red', '1', 'solid'),
      new Card('diamond', 'red', '2', 'solid'),
      new Card('oval', 'red', '3', 'solid'),
    ];
    const sets = findAllValidSets(cards);
    expect(sets.length).toBe(0);
  });
});

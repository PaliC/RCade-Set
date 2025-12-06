import { describe, it, expect, beforeEach } from 'vitest';
import { Card, createDeck, shuffleDeck, hasValidSet } from '../src/card';

// Seeded random for reproducible tests
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function seededShuffle(deck: Card[], random: () => number): void {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function ensureValidSetExists(cards: (Card | null)[], deck: Card[], random: () => number): void {
  let attempts = 0;
  const maxAttempts = 1000;

  while (!hasValidSet(cards) && deck.length > 0 && attempts < maxAttempts) {
    const boardIndices: number[] = [];
    for (let i = 0; i < cards.length; i++) {
      if (cards[i]) boardIndices.push(i);
    }
    if (boardIndices.length === 0) break;

    const boardIdx = boardIndices[Math.floor(random() * boardIndices.length)];
    const deckIdx = Math.floor(random() * deck.length);
    const temp = cards[boardIdx];
    cards[boardIdx] = deck[deckIdx];
    deck[deckIdx] = temp!;
    attempts++;
  }
}

describe('Set Guarantee', () => {
  describe('Initial deal always has valid set', () => {
    it('should have a valid set for 100 different seeds', () => {
      for (let seed = 0; seed < 100; seed++) {
        const random = seededRandom(seed);
        const deck = createDeck();
        seededShuffle(deck, random);

        // Deal 12 cards
        const cards: Card[] = [];
        for (let i = 0; i < 12; i++) {
          cards.push(deck.pop()!);
        }

        ensureValidSetExists(cards, deck, random);
        expect(hasValidSet(cards)).toBe(true);
      }
    });
  });

  describe('Replacement maintains valid set', () => {
    it('should maintain valid set after 5 replacements for 100 seeds', () => {
      for (let seed = 0; seed < 100; seed++) {
        const random = seededRandom(seed);
        const deck = createDeck();
        seededShuffle(deck, random);

        const cards: (Card | null)[] = [];
        for (let i = 0; i < 12; i++) {
          cards.push(deck.pop()!);
        }
        ensureValidSetExists(cards, deck, random);

        // Do 5 replacements
        for (let rep = 0; rep < 5; rep++) {
          if (deck.length < 3) break;

          // Replace 3 random cards
          const indices: number[] = [];
          while (indices.length < 3) {
            const idx = Math.floor(random() * 12);
            if (!indices.includes(idx)) indices.push(idx);
          }

          for (const i of indices) {
            if (deck.length > 0) {
              cards[i] = deck.pop()!;
            }
          }

          ensureValidSetExists(cards, deck, random);
          expect(hasValidSet(cards)).toBe(true);
        }
      }
    });
  });

  describe('Ensure valid set converges', () => {
    it('should successfully find valid configuration for 50 seeds', () => {
      for (let seed = 0; seed < 50; seed++) {
        const random = seededRandom(seed);
        const deck = createDeck();
        seededShuffle(deck, random);

        const cards: (Card | null)[] = [];
        for (let i = 0; i < 12; i++) {
          cards.push(deck.pop()!);
        }

        // Even if initial deal has no set, ensure should fix it
        ensureValidSetExists(cards, deck, random);
        expect(hasValidSet(cards)).toBe(true);
      }
    });
  });

  describe('Deck exhaustion', () => {
    it('should handle nearly exhausted deck', () => {
      const random = seededRandom(42);
      const deck = createDeck();
      seededShuffle(deck, random);

      // Deal 12 cards
      const cards: (Card | null)[] = [];
      for (let i = 0; i < 12; i++) {
        cards.push(deck.pop()!);
      }

      // Exhaust most of the deck
      while (deck.length > 5) {
        deck.pop();
      }

      ensureValidSetExists(cards, deck, random);
      expect(hasValidSet(cards)).toBe(true);
    });
  });

  describe('Many consecutive deals (stress test)', () => {
    it('should handle 20 games with 10 sets each', () => {
      for (let game = 0; game < 20; game++) {
        const random = seededRandom(game * 1000);
        const deck = createDeck();
        seededShuffle(deck, random);

        const cards: (Card | null)[] = [];
        for (let i = 0; i < 12; i++) {
          cards.push(deck.pop()!);
        }
        ensureValidSetExists(cards, deck, random);

        let setsFound = 0;
        while (deck.length > 0 && setsFound < 10) {
          expect(hasValidSet(cards)).toBe(true);

          // Find and remove a valid set
          let found = false;
          outer: for (let i = 0; i < 12; i++) {
            if (!cards[i]) continue;
            for (let j = i + 1; j < 12; j++) {
              if (!cards[j]) continue;
              for (let k = j + 1; k < 12; k++) {
                if (!cards[k]) continue;
                if (cards[i]!.checkIfSet(cards[j]!, cards[k]!)) {
                  // Replace these cards
                  for (const idx of [i, j, k]) {
                    if (deck.length > 0) {
                      cards[idx] = deck.pop()!;
                    } else {
                      cards[idx] = null;
                    }
                  }
                  ensureValidSetExists(cards, deck, random);
                  setsFound++;
                  found = true;
                  break outer;
                }
              }
            }
          }
          if (!found) break;
        }
      }
    });
  });
});

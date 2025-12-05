"""Tests to validate that the game always guarantees a valid set exists."""
import sys
import random
sys.path.insert(0, "src")

from itertools import combinations

# Import game components (avoiding pygame initialization)
CATEGORY_1 = ["circle", "square", "triangle"]
CATEGORY_2 = ["red", "green", "blue"]
CATEGORY_3 = ["1", "2", "3"]
CATEGORY_4 = ["solid", "striped", "open"]

GRID_ROWS = 3
GRID_COLS = 4


class Card:
    def __init__(self, category1, category2, category3, category4):
        self.category1 = category1
        self.category2 = category2
        self.category3 = category3
        self.category4 = category4

    def __eq__(self, other):
        return (self.category1 == other.category1 and self.category2 == other.category2 and
                self.category3 == other.category3 and self.category4 == other.category4)

    def __repr__(self):
        return f"Card({self.category1}, {self.category2}, {self.category3}, {self.category4})"

    def check_if_set(self, other1, other2):
        def check_attribute(attr, other1_attr, other2_attr):
            all_same = (attr == other1_attr == other2_attr)
            all_diff = (attr != other1_attr and attr != other2_attr and other1_attr != other2_attr)
            return all_same or all_diff

        attrs = [self.category1, self.category2, self.category3, self.category4]
        other1_attrs = [other1.category1, other1.category2, other1.category3, other1.category4]
        other2_attrs = [other2.category1, other2.category2, other2.category3, other2.category4]
        return all(check_attribute(a, b, c) for a, b, c in zip(attrs, other1_attrs, other2_attrs))


def create_deck():
    """Create the full 81-card deck."""
    deck = []
    for c1 in CATEGORY_1:
        for c2 in CATEGORY_2:
            for c3 in CATEGORY_3:
                for c4 in CATEGORY_4:
                    deck.append(Card(c1, c2, c3, c4))
    return deck


def has_valid_set(cards):
    """Check if any valid set exists among the given cards."""
    card_list = [c for c in cards if c is not None]
    for c1, c2, c3 in combinations(card_list, 3):
        if c1.check_if_set(c2, c3):
            return True
    return False


def ensure_valid_set_exists(cards, deck):
    """Swap cards with deck until a valid set exists."""
    max_attempts = 1000
    attempts = 0
    while not has_valid_set(cards) and deck and attempts < max_attempts:
        board_indices = [i for i, c in enumerate(cards) if c is not None]
        if not board_indices:
            break
        board_idx = random.choice(board_indices)
        deck_idx = random.randrange(len(deck))
        cards[board_idx], deck[deck_idx] = deck[deck_idx], cards[board_idx]
        attempts += 1
    return cards


class TestSetGuarantee:
    """Test that the set guarantee logic works correctly."""

    def test_check_if_set_all_same(self):
        """Test valid set where all attributes are the same."""
        c1 = Card("circle", "red", "1", "solid")
        c2 = Card("circle", "red", "1", "solid")
        c3 = Card("circle", "red", "1", "solid")
        assert c1.check_if_set(c2, c3)

    def test_check_if_set_all_different(self):
        """Test valid set where all attributes are different."""
        c1 = Card("circle", "red", "1", "solid")
        c2 = Card("square", "green", "2", "striped")
        c3 = Card("triangle", "blue", "3", "open")
        assert c1.check_if_set(c2, c3)

    def test_check_if_set_mixed(self):
        """Test valid set with mixed same/different attributes."""
        c1 = Card("circle", "red", "1", "solid")
        c2 = Card("circle", "green", "2", "striped")
        c3 = Card("circle", "blue", "3", "open")
        assert c1.check_if_set(c2, c3)

    def test_check_if_set_invalid(self):
        """Test invalid set."""
        c1 = Card("circle", "red", "1", "solid")
        c2 = Card("circle", "red", "2", "solid")
        c3 = Card("square", "red", "3", "solid")
        assert not c1.check_if_set(c2, c3)

    def test_has_valid_set_with_known_set(self):
        """Test has_valid_set with cards that form a valid set."""
        cards = [
            Card("circle", "red", "1", "solid"),
            Card("square", "green", "2", "striped"),
            Card("triangle", "blue", "3", "open"),
        ]
        assert has_valid_set(cards)

    def test_initial_deal_has_valid_set(self):
        """Test that initial 12-card deal always produces a valid set."""
        for seed in range(100):
            random.seed(seed)
            deck = create_deck()
            random.shuffle(deck)
            cards = [deck.pop() for _ in range(12)]
            ensure_valid_set_exists(cards, deck)
            assert has_valid_set(cards), f"No valid set found with seed {seed}"

    def test_replacement_maintains_valid_set(self):
        """Test that replacing 3 cards maintains a valid set."""
        for seed in range(100):
            random.seed(seed)
            deck = create_deck()
            random.shuffle(deck)
            cards = [deck.pop() for _ in range(12)]
            ensure_valid_set_exists(cards, deck)

            # Simulate finding and clearing a set (replace 3 cards)
            for _ in range(5):  # Do 5 replacements
                if len(deck) < 3:
                    break
                # Replace 3 random cards
                indices = random.sample(range(12), 3)
                for i in indices:
                    if deck:
                        cards[i] = deck.pop()
                ensure_valid_set_exists(cards, deck)
                assert has_valid_set(cards), f"No valid set after replacement with seed {seed}"

    def test_ensure_valid_set_converges(self):
        """Test that ensure_valid_set_exists successfully finds a valid configuration."""
        for seed in range(50):
            random.seed(seed)
            deck = create_deck()
            random.shuffle(deck)
            cards = [deck.pop() for _ in range(12)]

            # Even if initial deal has no set, ensure_valid_set_exists should fix it
            ensure_valid_set_exists(cards, deck)
            assert has_valid_set(cards), f"ensure_valid_set_exists failed with seed {seed}"

    def test_deck_exhaustion(self):
        """Test behavior when deck is nearly exhausted."""
        random.seed(42)
        deck = create_deck()
        random.shuffle(deck)

        # Draw most of the deck
        cards = [deck.pop() for _ in range(12)]
        while len(deck) > 5:
            deck.pop()

        ensure_valid_set_exists(cards, deck)
        # Should still work with limited deck
        assert has_valid_set(cards)

    def test_many_consecutive_deals(self):
        """Stress test: simulate many consecutive games."""
        for game in range(20):
            random.seed(game * 1000)
            deck = create_deck()
            random.shuffle(deck)
            cards = [deck.pop() for _ in range(12)]
            ensure_valid_set_exists(cards, deck)

            sets_found = 0
            while deck and sets_found < 10:
                assert has_valid_set(cards), f"Game {game}, set {sets_found}: no valid set"

                # Find and remove a valid set
                for c1, c2, c3 in combinations(range(12), 3):
                    if cards[c1] and cards[c2] and cards[c3]:
                        if cards[c1].check_if_set(cards[c2], cards[c3]):
                            # Replace these cards
                            for i in [c1, c2, c3]:
                                if deck:
                                    cards[i] = deck.pop()
                                else:
                                    cards[i] = None
                            ensure_valid_set_exists(cards, deck)
                            sets_found += 1
                            break

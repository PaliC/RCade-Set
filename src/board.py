import random
import pygame
from itertools import combinations

from card import Card

# RCade game dimensions
WIDTH = 336
HEIGHT = 262
FPS = 60

# Colors
CARD_BG = (240, 240, 235)
CARD_BG_HOVER = (200, 200, 195)
CARD_BG_SELECTED = (255, 255, 250)
CARD_BORDER = (60, 60, 60)
SELECTED_BORDER = (255, 215, 0)
CURSOR_COLOR = (100, 200, 255)
FLASH_GREEN = (50, 205, 50)
FLASH_RED = (220, 50, 50)

# Categories
CATEGORY_1 = ["circle", "square", "triangle"]  # shape
CATEGORY_2 = ["red", "green", "blue"]  # color
CATEGORY_3 = ["1", "2", "3"]  # count
CATEGORY_4 = ["solid", "striped", "open"]  # fill

# Grid layout
CARD_WIDTH = 90
CARD_HEIGHT = 60
CARD_MARGIN = 10
GRID_COLS = 3
GRID_ROWS = 3
GRID_START_X = (WIDTH - (CARD_WIDTH * GRID_COLS + CARD_MARGIN * (GRID_COLS - 1))) // 2
GRID_START_Y = (HEIGHT - (CARD_HEIGHT * GRID_ROWS + CARD_MARGIN * (GRID_ROWS - 1))) // 2


class GameBoard:
    def __init__(self):
        self.deck = self._create_deck()
        random.shuffle(self.deck)
        self.cards = [[None for _ in range(GRID_COLS)] for _ in range(GRID_ROWS)]
        self.selected = set()  # Set of (row, col) tuples
        self.cursor_row = 0
        self.cursor_col = 0
        self._deal_initial_cards()
        self._prev_inputs = {"up": False, "down": False, "left": False, "right": False, "a": False}
        self.score = 0
        self.flash_color = None  # None, FLASH_GREEN, or FLASH_RED
        self.flash_timer = 0
        self.flash_duration = FPS // 2  # Half second
        self.flash_positions = set()  # Positions to flash
        self.game_over = False  # True when no valid sets and deck is empty
        self.debug_mode = True
        self._print_valid_sets()

    def _print_valid_sets(self):
        """Print all valid sets to console (debug mode only)."""
        if not self.debug_mode:
            return
        valid_sets = self._get_all_valid_sets()
        print(f"\n=== Valid sets ({len(valid_sets) // 6}): ===")  # Divide by 6 to account for permutations
        seen = set()
        for s in valid_sets:
            key = tuple(sorted(s))
            if key not in seen:
                seen.add(key)
                print(f"  {s[0]} + {s[1]} + {s[2]}")

    def _get_all_valid_sets(self):
        """Get all valid sets on the board."""
        card_positions = [(row, col) for row in range(GRID_ROWS) for col in range(GRID_COLS)
                         if self.cards[row][col] is not None]
        valid_sets = []
        for pos1, pos2, pos3 in combinations(card_positions, 3):
            if self.cards[pos1[0]][pos1[1]].check_if_set(
                self.cards[pos2[0]][pos2[1]], self.cards[pos3[0]][pos3[1]]):
                valid_sets.append((pos1, pos2, pos3))
        return valid_sets

    def _has_valid_set(self):
        """Quick check if any valid set exists on the board."""
        card_positions = [(row, col) for row in range(GRID_ROWS) for col in range(GRID_COLS)
                         if self.cards[row][col] is not None]
        for pos1, pos2, pos3 in combinations(card_positions, 3):
            if self.cards[pos1[0]][pos1[1]].check_if_set(
                self.cards[pos2[0]][pos2[1]], self.cards[pos3[0]][pos3[1]]):
                return True
        return False

    def _create_deck(self):
        """Create the full 81-card deck."""
        deck = []
        for c1 in CATEGORY_1:
            for c2 in CATEGORY_2:
                for c3 in CATEGORY_3:
                    for c4 in CATEGORY_4:
                        deck.append(Card(c1, c2, c3, c4))
        return deck

    def _deal_initial_cards(self):
        """Deal 9 cards to fill the board, ensuring at least one valid set exists."""
        for row in range(GRID_ROWS):
            for col in range(GRID_COLS):
                if self.deck:
                    self.cards[row][col] = self.deck.pop()
        self._ensure_valid_set_exists()

    def _ensure_valid_set_exists(self):
        """Swap cards with deck until a valid set exists on the board."""
        max_attempts = 1000
        attempts = 0
        while not self._has_valid_set() and self.deck and attempts < max_attempts:
            # Get all board positions with cards
            board_positions = [(r, c) for r in range(GRID_ROWS) for c in range(GRID_COLS)
                              if self.cards[r][c] is not None]
            if not board_positions:
                break
            # Swap a random board card with a random deck card
            r, c = random.choice(board_positions)
            deck_idx = random.randrange(len(self.deck))
            self.cards[r][c], self.deck[deck_idx] = self.deck[deck_idx], self.cards[r][c]
            attempts += 1

    def _replace_cards(self, positions):
        """Replace cards at the given positions with new ones from the deck."""
        for r, c in positions:
            if self.deck:
                self.cards[r][c] = self.deck.pop()
            else:
                self.cards[r][c] = None

    def get_card_rect(self, row, col):
        """Get the rectangle for a card at the given grid position."""
        x = GRID_START_X + col * (CARD_WIDTH + CARD_MARGIN)
        y = GRID_START_Y + row * (CARD_HEIGHT + CARD_MARGIN)
        return pygame.Rect(x, y, CARD_WIDTH, CARD_HEIGHT)

    def update(self, inputs):
        """Handle input for cursor movement and card selection."""
        # Update flash timer
        if self.flash_timer > 0:
            self.flash_timer -= 1
            if self.flash_timer == 0:
                self.flash_color = None
                self.flash_positions.clear()

        # Cursor movement (edge-triggered)
        if inputs["up"] and not self._prev_inputs["up"]:
            self.cursor_row = (self.cursor_row - 1) % GRID_ROWS
        if inputs["down"] and not self._prev_inputs["down"]:
            self.cursor_row = (self.cursor_row + 1) % GRID_ROWS
        if inputs["left"] and not self._prev_inputs["left"]:
            self.cursor_col = (self.cursor_col - 1) % GRID_COLS
        if inputs["right"] and not self._prev_inputs["right"]:
            self.cursor_col = (self.cursor_col + 1) % GRID_COLS

        # Card selection with A button
        if inputs["a"] and not self._prev_inputs["a"]:
            pos = (self.cursor_row, self.cursor_col)
            if pos in self.selected:
                self.selected.remove(pos)
            elif len(self.selected) < 3:
                self.selected.add(pos)
                # Check if we have exactly 3 cards selected
                if len(self.selected) == 3:
                    self._check_set()


        self._prev_inputs = {k: inputs[k] for k in self._prev_inputs}

    def _check_set(self):
        """Check if the 3 selected cards form a valid set."""
        positions = list(self.selected)
        cards = [self.cards[r][c] for r, c in positions]

        # Store positions for flashing before clearing selected
        self.flash_positions = set(positions)
        self.flash_timer = self.flash_duration

        if cards[0].check_if_set(cards[1], cards[2]):
            # Valid set
            self.flash_color = FLASH_GREEN
            self.score += 1
            # Replace cards with new ones from deck
            for r, c in positions:
                if self.deck:
                    self.cards[r][c] = self.deck.pop()
                else:
                    self.cards[r][c] = None
            self._ensure_valid_set_exists()
            self._print_valid_sets()
            # Check for game over: no valid sets and deck is empty
            if not self.deck and not self._has_valid_set():
                self.game_over = True
        else:
            # Invalid set
            self.flash_color = FLASH_RED

        self.selected.clear()

    def draw(self, screen):
        """Draw the game board with all cards."""
        for row in range(GRID_ROWS):
            for col in range(GRID_COLS):
                card = self.cards[row][col]
                if card is None:
                    continue

                rect = self.get_card_rect(row, col)
                is_selected = (row, col) in self.selected
                is_cursor = (row == self.cursor_row and col == self.cursor_col)

                # Card background - darker for hover (including when selected), lighter for selected only
                if is_cursor:
                    pygame.draw.rect(screen, CARD_BG_HOVER, rect)
                elif is_selected:
                    pygame.draw.rect(screen, CARD_BG_SELECTED, rect)
                else:
                    pygame.draw.rect(screen, CARD_BG, rect)

                # Border: flash color overrides, then selected = gold, cursor = blue, normal = dark
                is_flashing = (row, col) in self.flash_positions
                if self.flash_color and is_flashing:
                    pygame.draw.rect(screen, self.flash_color, rect, 3)
                elif is_selected:
                    pygame.draw.rect(screen, SELECTED_BORDER, rect, 3)
                elif is_cursor:
                    pygame.draw.rect(screen, CURSOR_COLOR, rect, 2)
                else:
                    pygame.draw.rect(screen, CARD_BORDER, rect, 1)

                # Draw card shapes
                card.draw(screen, rect.x, rect.y, rect.width, rect.height)

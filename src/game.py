# /// script
# requires-python = ">=3.11"
# dependencies = ["pygame-ce"]
# ///

import asyncio
import random
import pygame
from itertools import combinations

# RCade game dimensions
WIDTH = 336
HEIGHT = 262
FPS = 60

# Colors
BACKGROUND = (26, 26, 46)
WHITE = (255, 255, 255)
CARD_BG = (26, 26, 46)  # Dark card background for 8-bit look
CARD_BG_HOVER = (40, 40, 70)
CARD_BG_SELECTED = (50, 50, 80)
CARD_BORDER = (74, 74, 106)
SELECTED_BORDER = (255, 215, 0)
CURSOR_COLOR = (100, 200, 255)
FLASH_GREEN = (50, 205, 50)
FLASH_RED = (220, 50, 50)

# 8-bit color palette for shapes
COLOR_MAP = {
    "red": (230, 57, 70),
    "green": (42, 157, 143),
    "purple": (123, 44, 191),
}

# Categories
CATEGORY_1 = ["diamond", "oval", "squiggle"]  # shape
CATEGORY_2 = ["red", "green", "purple"]  # color
CATEGORY_3 = ["1", "2", "3"]  # count
CATEGORY_4 = ["solid", "striped", "empty"]  # fill

# Pixel art shape definitions (16x16 grids, scaled down for RCade)
PIXEL_SHAPES = {
    'diamond': [
        '........XX......',
        '.......XXXX.....',
        '......XXXXXX....',
        '.....XXXXXXXX...',
        '....XXXXXXXXXX..',
        '...XXXXXXXXXXXX.',
        '..XXXXXXXXXXXXXX',
        '.XXXXXXXXXXXXXXX',
        '.XXXXXXXXXXXXXXX',
        '..XXXXXXXXXXXXXX',
        '...XXXXXXXXXXXX.',
        '....XXXXXXXXXX..',
        '.....XXXXXXXX...',
        '......XXXXXX....',
        '.......XXXX.....',
        '........XX......',
    ],
    'oval': [
        '.....XXXXXX.....',
        '...XXXXXXXXXX...',
        '..XXXXXXXXXXXX..',
        '.XXXXXXXXXXXXXX.',
        '.XXXXXXXXXXXXXX.',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        'XXXXXXXXXXXXXXXX',
        '.XXXXXXXXXXXXXX.',
        '.XXXXXXXXXXXXXX.',
        '..XXXXXXXXXXXX..',
        '...XXXXXXXXXX...',
        '.....XXXXXX.....',
    ],
    'squiggle': [
        '....XXXXX.......',
        '..XXXXXXXXX.....',
        '.XXXXXXXXXXX....',
        '.XXXXXXXXXXXX...',
        'XXXXXXXXXXXXX...',
        'XXXXXXXXXXXXXX..',
        '.XXXXXXXXXXXXX..',
        '..XXXXXXXXXXXXX.',
        '..XXXXXXXXXXXXX.',
        '..XXXXXXXXXXXXXX',
        '...XXXXXXXXXXXXX',
        '....XXXXXXXXXXXX',
        '....XXXXXXXXXXX.',
        '.....XXXXXXXXX..',
        '.......XXXXX....',
        '................',
    ],
}

# Shape surface cache (populated at init)
_shape_cache = {}


def _is_edge_pixel(shape_data, x, y):
    """Check if a pixel is on the edge of the shape."""
    if shape_data[y][x] != 'X':
        return False
    for nx, ny in [(x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)]:
        if nx < 0 or nx >= 16 or ny < 0 or ny >= 16:
            return True
        if shape_data[ny][nx] == '.':
            return True
    return False


def _create_shape_surface(shape_name, color_name, fill):
    """Create a pygame surface for a single shape with given color and fill."""
    shape_data = PIXEL_SHAPES[shape_name]
    color = COLOR_MAP[color_name]

    # Create surface (16x16 pixels, no scaling needed for RCade's small display)
    surface = pygame.Surface((16, 16), pygame.SRCALPHA)

    for py in range(16):
        for px in range(16):
            if shape_data[py][px] == 'X':
                should_draw = False
                if fill == 'solid':
                    should_draw = True
                elif fill == 'striped':
                    should_draw = (py % 2 == 0)
                elif fill == 'empty':
                    should_draw = _is_edge_pixel(shape_data, px, py)

                if should_draw:
                    surface.set_at((px, py), color)

    return surface


def init_shape_cache():
    """Pre-generate all shape/color/fill combinations."""
    global _shape_cache
    for shape in CATEGORY_1:
        for color in CATEGORY_2:
            for fill in CATEGORY_4:
                key = (shape, color, fill)
                _shape_cache[key] = _create_shape_surface(shape, color, fill)


# Grid layout
CARD_WIDTH = 76
CARD_HEIGHT = 60
CARD_MARGIN = 10
GRID_COLS = 4
GRID_ROWS = 3
GRID_START_X = (WIDTH - (CARD_WIDTH * GRID_COLS + CARD_MARGIN * (GRID_COLS - 1))) // 2
GRID_START_Y = (HEIGHT - (CARD_HEIGHT * GRID_ROWS + CARD_MARGIN * (GRID_ROWS - 1))) // 2


class Card:
    def __init__(self, category1, category2, category3, category4):
        self.category1 = category1  # shape
        self.category2 = category2  # color
        self.category3 = category3  # count
        self.category4 = category4  # fill

    def __eq__(self, other):
        return (self.category1 == other.category1 and self.category2 == other.category2 and
                self.category3 == other.category3 and self.category4 == other.category4)

    def check_if_set(self, other1, other2):
        def check_attribute(attr, other1_attr, other2_attr):
            all_same = (attr == other1_attr == other2_attr)
            all_diff = (attr != other1_attr and attr != other2_attr and other1_attr != other2_attr)
            return all_same or all_diff

        attrs = [self.category1, self.category2, self.category3, self.category4]
        other1_attrs = [other1.category1, other1.category2, other1.category3, other1.category4]
        other2_attrs = [other2.category1, other2.category2, other2.category3, other2.category4]
        return all(check_attribute(a, b, c) for a, b, c in zip(attrs, other1_attrs, other2_attrs))

    def draw(self, screen, x, y, width, height):
        """Draw this card's shapes using cached pixel art surfaces."""
        count = int(self.category3)
        shape = self.category1
        color = self.category2
        fill = self.category4

        # Get cached surface
        surface = _shape_cache.get((shape, color, fill))
        if surface is None:
            return

        # Layout: shapes arranged horizontally
        shape_size = 16
        spacing = 20
        total_width = count * shape_size + (count - 1) * (spacing - shape_size)
        start_x = x + (width - total_width) // 2
        center_y = y + (height - shape_size) // 2

        for i in range(count):
            sx = start_x + i * spacing
            screen.blit(surface, (sx, center_y))


class GameBoard:
    def __init__(self, initial_inputs=None):
        self.deck = self._create_deck()
        random.shuffle(self.deck)
        self.cards = [[None for _ in range(GRID_COLS)] for _ in range(GRID_ROWS)]
        self.selected = set()  # Set of (row, col) tuples
        self.cursor_row = 0
        self.cursor_col = 0
        self._deal_initial_cards()
        # Initialize with current input state to prevent accidental selection on first frame
        if initial_inputs:
            self._prev_inputs = {k: initial_inputs.get(k, False) for k in ["up", "down", "left", "right", "a"]}
        else:
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
        """Deal 12 cards to fill the board, ensuring at least one valid set exists."""
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


class Game:
    # Game states
    STATE_TITLE = "title"
    STATE_HELP = "help"
    STATE_PLAYING = "playing"
    STATE_GAME_OVER = "game_over"

    def __init__(self):
        pygame.init()
        init_shape_cache()  # Pre-generate pixel art shapes
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Set")
        self.clock = pygame.time.Clock()
        self.running = True
        self.state = self.STATE_TITLE
        self.menu_selection = 0  # 0 = Start, 1 = Help
        self.board = GameBoard()
        self.font_large = pygame.font.Font(None, 36)
        self.font_medium = pygame.font.Font(None, 28)
        self.font_small = pygame.font.Font(None, 24)
        self.font_tiny = pygame.font.Font(None, 18)
        self._prev_inputs = {"up": False, "down": False, "a": False, "b": False, "start": False}

    def _edge_triggered(self, key, inputs):
        """Check if a key was just pressed (edge-triggered)."""
        p1 = inputs["p1"]
        sys = inputs["system"]
        current = p1.get(key, False) or (key == "start" and sys.get("start_1p", False))
        prev = self._prev_inputs.get(key, False)
        return current and not prev

    def _update_prev_inputs(self, inputs):
        """Update previous input state for edge detection."""
        p1 = inputs["p1"]
        sys = inputs["system"]
        self._prev_inputs = {
            "up": p1.get("up", False),
            "down": p1.get("down", False),
            "a": p1.get("a", False),
            "b": p1.get("b", False),
            "start": sys.get("start_1p", False),
        }

    def update(self, inputs):
        if self.state == self.STATE_TITLE:
            # Menu navigation
            if self._edge_triggered("up", inputs):
                self.menu_selection = (self.menu_selection - 1) % 2
            if self._edge_triggered("down", inputs):
                self.menu_selection = (self.menu_selection + 1) % 2
            # Selection
            if self._edge_triggered("a", inputs) or self._edge_triggered("start", inputs):
                if self.menu_selection == 0:
                    self.state = self.STATE_PLAYING
                    self.board = GameBoard(inputs["p1"])
                else:
                    self.state = self.STATE_HELP
            self._update_prev_inputs(inputs)
            return

        if self.state == self.STATE_HELP:
            # Return to title with B or START
            if self._edge_triggered("b", inputs) or self._edge_triggered("start", inputs) or self._edge_triggered("a", inputs):
                self.state = self.STATE_TITLE
            self._update_prev_inputs(inputs)
            return

        if self.state == self.STATE_GAME_OVER:
            if self._edge_triggered("start", inputs) or self._edge_triggered("a", inputs):
                self.board = GameBoard(inputs["p1"])
                self.state = self.STATE_PLAYING
            self._update_prev_inputs(inputs)
            return

        # STATE_PLAYING
        self.board.update(inputs["p1"])
        if self.board.game_over:
            self.state = self.STATE_GAME_OVER

    def _draw_title(self):
        """Draw the title screen with menu."""
        # Title
        title = self.font_large.render("SET", True, WHITE)
        self.screen.blit(title, title.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 50)))

        # Menu options
        menu_items = ["Start Game", "How to Play"]
        for i, item in enumerate(menu_items):
            color = SELECTED_BORDER if i == self.menu_selection else WHITE
            prefix = "> " if i == self.menu_selection else "  "
            text = self.font_small.render(f"{prefix}{item}", True, color)
            self.screen.blit(text, text.get_rect(center=(WIDTH // 2, HEIGHT // 2 + i * 25)))

        # Controls hint
        hint = self.font_tiny.render("D-Pad: Select  A/START: Confirm", True, (150, 150, 150))
        self.screen.blit(hint, hint.get_rect(center=(WIDTH // 2, HEIGHT - 20)))

    def _draw_help(self):
        """Draw the help screen with game rules."""
        y = 20

        # Title
        title = self.font_medium.render("How to Play", True, SELECTED_BORDER)
        self.screen.blit(title, title.get_rect(center=(WIDTH // 2, y)))
        y += 30

        # Rules - concise but complete
        rules = [
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
        ]

        for line in rules:
            if line:
                text = self.font_tiny.render(line, True, WHITE)
                self.screen.blit(text, (20, y))
            y += 14

        y += 6
        # Controls
        controls = self.font_tiny.render("D-Pad: Move  A: Select  (3 cards = check)", True, (150, 150, 150))
        self.screen.blit(controls, controls.get_rect(center=(WIDTH // 2, y)))

        # Back hint
        back = self.font_tiny.render("Press any button to return", True, (150, 150, 150))
        self.screen.blit(back, back.get_rect(center=(WIDTH // 2, HEIGHT - 15)))

    def _draw_game_over(self):
        """Draw the game over/congratulations screen."""
        text1 = self.font_large.render("Congratulations You WON!", True, SELECTED_BORDER)
        text2 = self.font_small.render(f"Final Score: {self.board.score} sets", True, WHITE)
        text3 = self.font_tiny.render("Press A or START to play again", True, (150, 150, 150))
        self.screen.blit(text1, text1.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 30)))
        self.screen.blit(text2, text2.get_rect(center=(WIDTH // 2, HEIGHT // 2 + 10)))
        self.screen.blit(text3, text3.get_rect(center=(WIDTH // 2, HEIGHT // 2 + 40)))

    def _draw_playing(self):
        """Draw the game board during play."""
        self.board.draw(self.screen)
        # Draw scoreboard in top left corner
        score_text = self.font_small.render(f"Sets: {self.board.score}", True, WHITE)
        self.screen.blit(score_text, (10, 10))
        # Deck remaining in top right
        deck_text = self.font_tiny.render(f"Deck: {len(self.board.deck)}", True, (150, 150, 150))
        self.screen.blit(deck_text, (WIDTH - deck_text.get_width() - 10, 12))

    def draw(self):
        self.screen.fill(BACKGROUND)

        if self.state == self.STATE_TITLE:
            self._draw_title()
        elif self.state == self.STATE_HELP:
            self._draw_help()
        elif self.state == self.STATE_GAME_OVER:
            self._draw_game_over()
        else:
            self._draw_playing()

        pygame.display.flip()

    async def run(self):
        while self.running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False

            inputs = _get_input().to_py()
            self.update(inputs)
            self.draw()
            self.clock.tick(FPS)
            await asyncio.sleep(0)

        pygame.quit()


async def main():
    game = Game()
    await game.run()


asyncio.run(main())

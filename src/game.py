# /// script
# requires-python = ">=3.11"
# dependencies = ["pygame-ce"]
# ///

import asyncio
import pygame

from board import GameBoard

# RCade game dimensions
WIDTH = 336
HEIGHT = 262
FPS = 60

# Colors
BACKGROUND = (26, 26, 46)
WHITE = (255, 255, 255)
SELECTED_BORDER = (255, 215, 0)


class Game:
    # Game states
    STATE_TITLE = "title"
    STATE_HELP = "help"
    STATE_PLAYING = "playing"
    STATE_GAME_OVER = "game_over"

    def __init__(self):
        pygame.init()
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
                    self.board = GameBoard()
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
                self.board = GameBoard()
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
            "  1 red solid circle",
            "  2 red solid squares",
            "  3 red solid triangles",
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

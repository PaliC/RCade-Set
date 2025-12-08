/**
 * Main entry point for the Set game
 */

import "./style.css";
import { Game } from "./game";
import type { GameInput } from "./game";
import { PLAYER_1, PLAYER_2, SYSTEM } from "@rcade/plugin-input-classic";

function main() {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  if (!canvas) {
    throw new Error("Canvas element not found");
  }

  // Create game instance
  const game = new Game(canvas);

  // Input bridge - reads current controller state
  const getInput = (): GameInput => ({
    p1: {
      up: PLAYER_1.DPAD.up,
      down: PLAYER_1.DPAD.down,
      left: PLAYER_1.DPAD.left,
      right: PLAYER_1.DPAD.right,
      a: PLAYER_1.A,
      b: PLAYER_1.B,
    },
    p2: {
      up: PLAYER_2.DPAD.up,
      down: PLAYER_2.DPAD.down,
      left: PLAYER_2.DPAD.left,
      right: PLAYER_2.DPAD.right,
      a: PLAYER_2.A,
      b: PLAYER_2.B,
    },
    system: {
      start_1p: SYSTEM.ONE_PLAYER,
      start_2p: SYSTEM.TWO_PLAYER,
    },
  });

  // Start the game loop
  game.start(getInput);
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", main);
} else {
  main();
}

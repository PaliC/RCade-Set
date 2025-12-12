/**
 * Main entry point for the Set game using p5.js
 */

import p5 from "p5";
import { PLAYER_1, PLAYER_2, SYSTEM } from "@rcade/plugin-input-classic";
import { Game, WIDTH, HEIGHT } from "./game";
import type { GameInput } from "./game";
import "./style.css";

const sketch = (p: p5) => {
  let game: Game;

  p.setup = () => {
    p.createCanvas(WIDTH, HEIGHT);
    p.frameRate(60);
    game = new Game(p);
  };

  p.draw = () => {
    const inputs: GameInput = {
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
    };

    game.update(inputs);
    game.draw();
  };
};

new p5(sketch, document.getElementById("sketch")!);

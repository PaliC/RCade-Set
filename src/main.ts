import './style.css';
import { Game } from './game';
import { getInput, updatePrevInput, initInput } from './input';
import { FRAME_TIME } from './constants';

let game: Game;
let lastFrameTime = 0;
let running = true;

function gameLoop(timestamp: number): void {
  if (!running) return;

  const deltaTime = timestamp - lastFrameTime;

  if (deltaTime >= FRAME_TIME) {
    const input = getInput();
    game.update(input, timestamp);
    game.draw(timestamp);
    updatePrevInput();
    lastFrameTime = timestamp;
  }

  requestAnimationFrame(gameLoop);
}

function main(): void {
  game = new Game();
  initInput();
  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);
}

// Handle visibility change to pause/resume
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    running = false;
  } else {
    running = true;
    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
});

main();

import type { GameInput, PlayerInput } from './types';
import { PLAYER_1, PLAYER_2, SYSTEM } from '@rcade/plugin-input-classic';

// Reusable input objects to avoid allocations
const gameInput: GameInput = {
  p1: { up: false, down: false, left: false, right: false, a: false, b: false },
  p2: { up: false, down: false, left: false, right: false, a: false, b: false },
  system: { start_1p: false, start_2p: false },
};

const prevInput: GameInput = {
  p1: { up: false, down: false, left: false, right: false, a: false, b: false },
  p2: { up: false, down: false, left: false, right: false, a: false, b: false },
  system: { start_1p: false, start_2p: false },
};

export function getInput(): GameInput {
  gameInput.p1.up = PLAYER_1.DPAD.up;
  gameInput.p1.down = PLAYER_1.DPAD.down;
  gameInput.p1.left = PLAYER_1.DPAD.left;
  gameInput.p1.right = PLAYER_1.DPAD.right;
  gameInput.p1.a = PLAYER_1.A;
  gameInput.p1.b = PLAYER_1.B;

  gameInput.p2.up = PLAYER_2.DPAD.up;
  gameInput.p2.down = PLAYER_2.DPAD.down;
  gameInput.p2.left = PLAYER_2.DPAD.left;
  gameInput.p2.right = PLAYER_2.DPAD.right;
  gameInput.p2.a = PLAYER_2.A;
  gameInput.p2.b = PLAYER_2.B;

  gameInput.system.start_1p = SYSTEM.ONE_PLAYER;
  gameInput.system.start_2p = SYSTEM.TWO_PLAYER;

  return gameInput;
}

export function isEdgeTriggered(key: keyof PlayerInput, player: 'p1' | 'p2' = 'p1'): boolean {
  return gameInput[player][key] && !prevInput[player][key];
}

export function isStartEdgeTriggered(): boolean {
  return gameInput.system.start_1p && !prevInput.system.start_1p;
}

export function updatePrevInput(): void {
  Object.assign(prevInput.p1, gameInput.p1);
  Object.assign(prevInput.p2, gameInput.p2);
  Object.assign(prevInput.system, gameInput.system);
}

export function initInput(): void {
  getInput();
  updatePrevInput();
}

export function getP1Input(): PlayerInput {
  return gameInput.p1;
}

export function getPrevP1Input(): PlayerInput {
  return prevInput.p1;
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Set card game** built for RCade, a custom arcade cabinet at The Recurse Center. Players find three cards that form a "set" — for each attribute (shape, color, count, fill), the three cards must be all the same or all different.

## Commands

```bash
bun run dev          # Start dev server (Vite + RCade emulator)
bun run build        # Production build to dist/
bun run test         # Run tests once with Vitest
bun run test:watch   # Run tests in watch mode
```

## Architecture

### Game Structure

- **State Machine**: Four states in `Game.ts`: `"title"`, `"help"`, `"playing"`, `"game_over"`
- **Fixed Timestep**: 60 FPS game loop using `requestAnimationFrame` with accumulator pattern
- **Board Layout**: 4x3 grid (12 visible cards) from 81-card deck (3^4 combinations)

### Key Components

| File | Purpose |
|------|---------|
| `src/game/Game.ts` | Main game controller, state machine, screen rendering |
| `src/game/GameBoard.ts` | Board logic, deck management, card selection, set validation |
| `src/game/Card.ts` | Card model with static `checkSet()` validation method |
| `src/game/ShapeRenderer.ts` | Pre-caches 27 shape combinations (3 shapes × 3 colors × 3 fills) |
| `src/game/constants.ts` | Game config, colors, pixel art shape definitions |
| `src/main.ts` | Entry point, RCade input bridge |

### Set Validation Algorithm

The core logic in `Card.checkSet()` checks that for each of the 4 attributes, all 3 cards are either all-same or all-different. `GameBoard.ensureValidSetExists()` swaps cards with the deck to guarantee a valid set is always present.

### Rendering

- Canvas-based 2D rendering at 336x262 resolution
- Shapes are pre-rendered to offscreen canvases and cached by `ShapeRenderer`
- Card flip animations use horizontal scaling (shrink old card, grow new card)

## Controls

Uses `@rcade/plugin-input-classic` for arcade input:
- **D-Pad**: Move cursor / navigate menus
- **A Button**: Select card / confirm
- **B Button**: Back (help screen only)
- **Start**: Confirm / restart

Keyboard (development): WASD + F/G for P1, Arrow keys + ./⁄ for P2

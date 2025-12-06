import type { GameState, GameInput } from './types';
import { GameBoard } from './board';
import { Renderer, FONT_LARGE, FONT_SMALL, FONT_TINY } from './renderer';
import { initShapeCache } from './shapes';
import {
  WIDTH, HEIGHT, BACKGROUND, WHITE, SELECTED_BORDER, GRAY,
} from './constants';

export class Game {
  private renderer: Renderer;
  private board: GameBoard;
  private state: GameState;
  private menuSelection: number;
  private prevInputs: Record<string, boolean>;

  constructor() {
    this.renderer = new Renderer('canvas');
    initShapeCache();
    this.board = new GameBoard();
    this.state = 'title';
    this.menuSelection = 0;
    this.prevInputs = { up: false, down: false, a: false, b: false, start: false };
  }

  private edgeTriggered(key: string, input: GameInput): boolean {
    const p1 = input.p1;
    const sys = input.system;
    let current = false;
    if (key === 'up') current = p1.up;
    else if (key === 'down') current = p1.down;
    else if (key === 'a') current = p1.a;
    else if (key === 'b') current = p1.b;
    else if (key === 'start') current = sys.start_1p;
    return current && !this.prevInputs[key];
  }

  private updatePrevInputs(input: GameInput): void {
    const p1 = input.p1;
    const sys = input.system;
    this.prevInputs = {
      up: p1.up,
      down: p1.down,
      a: p1.a,
      b: p1.b,
      start: sys.start_1p,
    };
  }

  update(input: GameInput, now: number): void {
    if (this.state === 'title') {
      if (this.edgeTriggered('up', input)) {
        this.menuSelection = (this.menuSelection - 1 + 2) % 2;
      }
      if (this.edgeTriggered('down', input)) {
        this.menuSelection = (this.menuSelection + 1) % 2;
      }
      if (this.edgeTriggered('a', input) || this.edgeTriggered('start', input)) {
        if (this.menuSelection === 0) {
          this.state = 'playing';
          this.board = new GameBoard(input.p1);
        } else {
          this.state = 'help';
        }
      }
      this.updatePrevInputs(input);
      return;
    }

    if (this.state === 'help') {
      if (this.edgeTriggered('b', input) || this.edgeTriggered('start', input) || this.edgeTriggered('a', input)) {
        this.state = 'title';
      }
      this.updatePrevInputs(input);
      return;
    }

    if (this.state === 'game_over') {
      if (this.edgeTriggered('start', input) || this.edgeTriggered('a', input)) {
        this.board = new GameBoard(input.p1);
        this.state = 'playing';
      }
      this.updatePrevInputs(input);
      return;
    }

    // Playing state
    this.board.update(input.p1, now);
    if (this.board.gameOver) {
      this.state = 'game_over';
    }
    this.updatePrevInputs(input);
  }

  draw(now: number): void {
    this.renderer.fill(BACKGROUND);

    switch (this.state) {
      case 'title':
        this.drawTitle();
        break;
      case 'help':
        this.drawHelp();
        break;
      case 'game_over':
        this.drawGameOver();
        break;
      case 'playing':
        this.drawPlaying(now);
        break;
    }
  }

  private drawTitle(): void {
    this.renderer.drawCenteredText('SET', HEIGHT / 2 - 50, WHITE, FONT_LARGE);

    const menuItems = ['Start Game', 'How to Play'];
    menuItems.forEach((item, i) => {
      const color = i === this.menuSelection ? SELECTED_BORDER : WHITE;
      const prefix = i === this.menuSelection ? '> ' : '  ';
      this.renderer.drawCenteredText(`${prefix}${item}`, HEIGHT / 2 + i * 25, color, FONT_SMALL);
    });

    this.renderer.drawCenteredText('D-Pad: Select  A/START: Confirm', HEIGHT - 20, GRAY, FONT_TINY);
  }

  private drawHelp(): void {
    let y = 20;
    this.renderer.drawCenteredText('How to Play', y, SELECTED_BORDER, FONT_SMALL + 4);
    y += 30;

    const rules = [
      'Find 3 cards that form a SET.',
      '',
      'For each property (shape, color,',
      'count, fill), all 3 cards must be:',
      '  ALL THE SAME  or  ALL DIFFERENT',
      '',
      'Example valid SET:',
      '  1 red solid diamond',
      '  2 red solid ovals',
      '  3 red solid squiggles',
      '  (same color/fill, diff count/shape)',
    ];

    for (const line of rules) {
      if (line) {
        this.renderer.drawText(line, 20, y, WHITE, FONT_TINY);
      }
      y += 14;
    }

    y += 6;
    this.renderer.drawCenteredText('D-Pad: Move  A: Select  (3 cards = check)', y, GRAY, FONT_TINY);
    this.renderer.drawCenteredText('Press any button to return', HEIGHT - 15, GRAY, FONT_TINY);
  }

  private drawGameOver(): void {
    this.renderer.drawCenteredText('Congratulations!', HEIGHT / 2 - 30, SELECTED_BORDER, FONT_LARGE);
    this.renderer.drawCenteredText(`Final Score: ${this.board.score} sets`, HEIGHT / 2 + 10, WHITE, FONT_SMALL);
    this.renderer.drawCenteredText('Press A or START to play again', HEIGHT / 2 + 40, GRAY, FONT_TINY);
  }

  private drawPlaying(now: number): void {
    this.board.draw(this.renderer, now);
    this.renderer.drawText(`Sets: ${this.board.score}`, 10, 10, WHITE, FONT_SMALL);
    this.renderer.drawText(`Deck: ${this.board.deck.length}`, WIDTH - 60, 12, GRAY, FONT_TINY);
  }
}

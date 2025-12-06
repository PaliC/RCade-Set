import type { RGB } from './types';
import { WIDTH, HEIGHT, rgbToCss } from './constants';

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;

  constructor(canvasId: string = 'canvas') {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas "${canvasId}" not found`);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');

    this.canvas = canvas;
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
  }

  fill(color: RGB): void {
    this.ctx.fillStyle = rgbToCss(color);
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  fillRect(x: number, y: number, w: number, h: number, color: RGB): void {
    this.ctx.fillStyle = rgbToCss(color);
    this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  strokeRect(x: number, y: number, w: number, h: number, color: RGB, lineWidth: number = 1): void {
    this.ctx.strokeStyle = rgbToCss(color);
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(
      Math.floor(x) + 0.5,
      Math.floor(y) + 0.5,
      Math.floor(w) - 1,
      Math.floor(h) - 1
    );
  }

  drawText(text: string, x: number, y: number, color: RGB, fontSize: number = 24,
           align: CanvasTextAlign = 'left', baseline: CanvasTextBaseline = 'top'): void {
    this.ctx.fillStyle = rgbToCss(color);
    this.ctx.font = `${fontSize}px sans-serif`;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.fillText(text, Math.floor(x), Math.floor(y));
  }

  drawCenteredText(text: string, y: number, color: RGB, fontSize: number = 24): void {
    this.drawText(text, WIDTH / 2, y, color, fontSize, 'center', 'middle');
  }

  measureText(text: string, fontSize: number): number {
    this.ctx.font = `${fontSize}px sans-serif`;
    return this.ctx.measureText(text).width;
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}

export const FONT_LARGE = 28;
export const FONT_MEDIUM = 22;
export const FONT_SMALL = 18;
export const FONT_TINY = 14;

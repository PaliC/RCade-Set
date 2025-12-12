/**
 * Shape renderer with pre-cached shape surfaces for optimal performance.
 * All 27 shape combinations (3 shapes x 3 colors x 3 fills) are rendered once at startup.
 */

import type p5 from "p5";
import type { Shape, Color, Fill } from "./types";
import { PIXEL_SHAPES, SHAPE_COLORS, SHAPES, CARD_COLORS, FILLS, SHAPE_SIZE } from "./constants";

class ShapeRenderer {
  private cache: Map<string, p5.Graphics> = new Map();
  private initialized = false;
  private p5Instance: p5 | null = null;

  /**
   * Initialize the shape cache by pre-rendering all shape combinations.
   * Must be called before any shapes can be drawn.
   */
  init(p: p5): void {
    if (this.initialized) return;

    this.p5Instance = p;

    for (const shape of SHAPES) {
      for (const color of CARD_COLORS) {
        for (const fill of FILLS) {
          const key = this.getKey(shape, color, fill);
          const surface = this.createShapeSurface(shape, color, fill);
          this.cache.set(key, surface);
        }
      }
    }

    this.initialized = true;
  }

  /**
   * Get a pre-rendered shape surface.
   */
  getShape(shape: Shape, color: Color, fill: Fill): p5.Graphics | undefined {
    return this.cache.get(this.getKey(shape, color, fill));
  }

  private getKey(shape: Shape, color: Color, fill: Fill): string {
    return `${shape}-${color}-${fill}`;
  }

  /**
   * Create a single shape surface with the given color and fill.
   */
  private createShapeSurface(shape: Shape, color: Color, fill: Fill): p5.Graphics {
    const shapeData = PIXEL_SHAPES[shape];
    const colorHex = SHAPE_COLORS[color];

    const graphics = this.p5Instance!.createGraphics(SHAPE_SIZE, SHAPE_SIZE);

    // Parse color hex to RGB for pixel manipulation
    const r = parseInt(colorHex.slice(1, 3), 16);
    const g = parseInt(colorHex.slice(3, 5), 16);
    const b = parseInt(colorHex.slice(5, 7), 16);

    // Load pixel array for direct manipulation
    graphics.loadPixels();
    const d = graphics.pixelDensity();
    const pixelWidth = SHAPE_SIZE * d;
    const pixelHeight = SHAPE_SIZE * d;

    for (let py = 0; py < SHAPE_SIZE; py++) {
      for (let px = 0; px < SHAPE_SIZE; px++) {
        if (shapeData[py][px] === "X") {
          let shouldDraw = false;

          if (fill === "solid") {
            shouldDraw = true;
          } else if (fill === "striped") {
            // Draw every other row
            shouldDraw = py % 2 === 0;
          } else if (fill === "empty") {
            // Draw only edge pixels
            shouldDraw = this.isEdgePixel(shapeData, px, py);
          }

          if (shouldDraw) {
            // For high density displays, we need to fill multiple pixels
            for (let dy = 0; dy < d; dy++) {
              for (let dx = 0; dx < d; dx++) {
                const pixelX = px * d + dx;
                const pixelY = py * d + dy;
                const i = (pixelY * pixelWidth + pixelX) * 4;
                graphics.pixels[i] = r;
                graphics.pixels[i + 1] = g;
                graphics.pixels[i + 2] = b;
                graphics.pixels[i + 3] = 255; // Full alpha
              }
            }
          }
        }
      }
    }

    graphics.updatePixels();
    return graphics;
  }

  /**
   * Check if a pixel is on the edge of the shape (has at least one adjacent empty pixel).
   */
  private isEdgePixel(shapeData: string[], x: number, y: number): boolean {
    if (shapeData[y][x] !== "X") return false;

    const neighbors = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ];

    for (const [nx, ny] of neighbors) {
      // Out of bounds counts as edge
      if (nx < 0 || nx >= SHAPE_SIZE || ny < 0 || ny >= SHAPE_SIZE) {
        return true;
      }
      // Adjacent to empty pixel counts as edge
      if (shapeData[ny][nx] === ".") {
        return true;
      }
    }

    return false;
  }
}

// Export a singleton instance
export const shapeRenderer = new ShapeRenderer();

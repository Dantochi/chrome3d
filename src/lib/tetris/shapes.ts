import generated from "./shapes.generated.json";
import type { TiledShape } from "./tiler";

export type ForgeShape = TiledShape & {
  /** Block silhouette, '#' filled. Row 0 is the top. */
  rows: string[];
  /** Smooth outline: one flat [x, y, x, y, …] list per closed contour, in cell units. */
  contours: number[][];
  /** Per contour, one character per point: '1' if that point of the back face shows in the isometric view. */
  back: string[];
  /** Visible depth lines: [x, y, fromDepth, toDepth]. */
  connectors: number[][];
};

/** Ten real objects, built from vector outlines by `npm run shapes`. */
export const SHAPES = generated as unknown as ForgeShape[];

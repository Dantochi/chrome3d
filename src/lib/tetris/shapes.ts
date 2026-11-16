import generated from "./shapes.generated.json";
import type { TiledShape } from "./tiler";

/** Ten objects, each tiled exactly into tetris pieces by `npm run shapes`. */
export const SHAPES = generated as unknown as TiledShape[];

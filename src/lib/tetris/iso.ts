/** Extrusion depth of every object, in cells. */
export const DEPTH = 3;

const COS30 = 0.866;

/**
 * Projects a grid point to the screen. `t` blends from the flat front view (0)
 * to the isometric view (1). x runs right, y runs down, z runs toward the viewer.
 */
export function project(x: number, y: number, z: number, t: number): [number, number] {
  const ix = (x - z) * COS30;
  const iy = y + (x + z) * 0.5;
  return [x + (ix - x) * t, y + (iy - y) * t];
}

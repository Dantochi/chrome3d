import type { Cell } from "./tiler";

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

export type Edge = { a: [number, number, number]; b: [number, number, number]; front: boolean };

/**
 * The outline of the extruded silhouette as seen in the isometric view: edges of the
 * visible faces, without the seams between coplanar neighbours and without anything
 * hidden behind the object. Pure lines, so the object reads as a wireframe outline.
 */
export function buildEdges(cells: Cell[]): Edge[] {
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  const has = (x: number, y: number) => set.has(`${x},${y}`);
  const maxSteps = cells.reduce((m, [x, y]) => Math.max(m, x, y), 0) + DEPTH + 2;
  const found = new Map<string, Edge>();

  // The viewer looks along (-1, +1, -1). An edge is hidden if solid lies between it and the viewer.
  const hidden = (a: number[], b: number[]) => {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    for (let s = 0.25; s < maxSteps; s += 0.5) {
      const z = m[2] + s;
      if (z >= DEPTH) return false;
      if (z >= 0 && has(Math.floor(m[0] + s), Math.floor(m[1] - s))) return true;
    }
    return false;
  };

  const add = (ax: number, ay: number, az: number, bx: number, by: number, bz: number) => {
    const key = [ax, ay, az, bx, by, bz].join(",");
    if (found.has(key)) return;
    const a: [number, number, number] = [ax, ay, az];
    const b: [number, number, number] = [bx, by, bz];
    if (!hidden(a, b)) found.set(key, { a, b, front: az === DEPTH && bz === DEPTH });
  };

  for (const [x, y] of cells) {
    // Front face: the silhouette itself.
    if (!has(x, y - 1)) add(x, y, DEPTH, x + 1, y, DEPTH);
    if (!has(x, y + 1)) add(x, y + 1, DEPTH, x + 1, y + 1, DEPTH);
    if (!has(x - 1, y)) add(x, y, DEPTH, x, y + 1, DEPTH);
    if (!has(x + 1, y)) add(x + 1, y, DEPTH, x + 1, y + 1, DEPTH);

    // Top face, running back from the silhouette.
    if (!has(x, y - 1)) {
      add(x, y, 0, x + 1, y, 0);
      if (!(has(x - 1, y) && !has(x - 1, y - 1))) for (let z = 0; z < DEPTH; z++) add(x, y, z, x, y, z + 1);
      if (!(has(x + 1, y) && !has(x + 1, y - 1))) for (let z = 0; z < DEPTH; z++) add(x + 1, y, z, x + 1, y, z + 1);
    }
    // Right face.
    if (!has(x + 1, y)) {
      add(x + 1, y, 0, x + 1, y + 1, 0);
      if (!(has(x, y - 1) && !has(x + 1, y - 1))) for (let z = 0; z < DEPTH; z++) add(x + 1, y, z, x + 1, y, z + 1);
      if (!(has(x, y + 1) && !has(x + 1, y + 1))) for (let z = 0; z < DEPTH; z++) add(x + 1, y + 1, z, x + 1, y + 1, z + 1);
    }
  }
  return [...found.values()];
}

/**
 * Builds the footer objects. For every vector outline in src/lib/tetris/outlines.ts:
 *   1. flatten it to polylines and scale it onto a block grid,
 *   2. rasterise it to cells, nudging ambiguous edge cells until tetrominoes tile it exactly,
 *   3. work out which lines of its isometric extrusion are visible.
 * Output: src/lib/tetris/shapes.generated.json
 */
import { writeFileSync } from "node:fs";
import svgpath from "svgpath";
import { DEPTH } from "../src/lib/tetris/iso";
import { OUTLINES } from "../src/lib/tetris/outlines";
import { tile } from "../src/lib/tetris/tiler";

type Pt = [number, number];
const GRIDS = [16, 17, 15, 18, 14]; // cells along the longer side, in order of preference
const CURVE_STEPS = 10;
const MAX_SEGMENT = 0.35;

function flatten(d: string): Pt[][] {
  const contours: Pt[][] = [];
  let current: Pt[] = [];
  svgpath(d)
    .abs()
    .unarc()
    .unshort()
    .iterate((seg, _i, x, y) => {
      const [cmd, ...n] = seg as [string, ...number[]];
      if (cmd === "M") {
        if (current.length > 2) contours.push(current);
        current = [[n[0], n[1]]];
      } else if (cmd === "L") current.push([n[0], n[1]]);
      else if (cmd === "H") current.push([n[0], y]);
      else if (cmd === "V") current.push([x, n[0]]);
      else if (cmd === "C") {
        for (let k = 1; k <= CURVE_STEPS; k++) {
          const t = k / CURVE_STEPS;
          const u = 1 - t;
          current.push([
            u * u * u * x + 3 * u * u * t * n[0] + 3 * u * t * t * n[2] + t * t * t * n[4],
            u * u * u * y + 3 * u * u * t * n[1] + 3 * u * t * t * n[3] + t * t * t * n[5],
          ]);
        }
      } else if (cmd === "Q") {
        for (let k = 1; k <= CURVE_STEPS; k++) {
          const t = k / CURVE_STEPS;
          const u = 1 - t;
          current.push([u * u * x + 2 * u * t * n[0] + t * t * n[2], u * u * y + 2 * u * t * n[1] + t * t * n[3]]);
        }
      } else if (cmd === "Z" || cmd === "z") {
        if (current.length > 2) contours.push(current);
        current = [];
      }
    });
  if (current.length > 2) contours.push(current);
  return contours;
}

/** Scale to the grid, drop repeated points, and split long straight runs so the morph has points to move. */
function normalise(contours: Pt[][], grid: number): { contours: Pt[][]; width: number; height: number } {
  const all = contours.flat();
  const minX = Math.min(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1]));
  const w = Math.max(...all.map((p) => p[0])) - minX;
  const h = Math.max(...all.map((p) => p[1])) - minY;
  const k = grid / Math.max(w, h);
  const width = Math.ceil(w * k - 1e-6);
  const height = Math.ceil(h * k - 1e-6);
  // Centre inside the whole-cell box.
  const ox = (width - w * k) / 2;
  const oy = (height - h * k) / 2;
  const out = contours.map((c) => {
    const scaled = c.map(([x, y]) => [(x - minX) * k + ox, (y - minY) * k + oy] as Pt);
    const pts: Pt[] = [];
    scaled.forEach((p, i) => {
      const q = scaled[(i + 1) % scaled.length];
      const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (len < 1e-4) return;
      pts.push(p);
      const parts = Math.ceil(len / MAX_SEGMENT);
      for (let j = 1; j < parts; j++) pts.push([p[0] + ((q[0] - p[0]) * j) / parts, p[1] + ((q[1] - p[1]) * j) / parts]);
    });
    return pts;
  });
  return { contours: out, width, height };
}

/** Non-zero winding test across all contours (holes wind the other way). */
function makeInside(contours: Pt[][]) {
  return (x: number, y: number) => {
    let winding = 0;
    for (const c of contours) {
      for (let i = 0; i < c.length; i++) {
        const a = c[i];
        const b = c[(i + 1) % c.length];
        if (a[1] <= y) {
          if (b[1] > y && (b[0] - a[0]) * (y - a[1]) - (x - a[0]) * (b[1] - a[1]) > 0) winding++;
        } else if (b[1] <= y && (b[0] - a[0]) * (y - a[1]) - (x - a[0]) * (b[1] - a[1]) < 0) winding--;
      }
    }
    return winding !== 0;
  };
}

function components(grid: boolean[][]): [number, number][][] {
  const h = grid.length;
  const w = grid[0].length;
  const seen = grid.map((r) => r.map(() => false));
  const out: [number, number][][] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!grid[y][x] || seen[y][x]) continue;
      const comp: [number, number][] = [];
      const stack: [number, number][] = [[x, y]];
      seen[y][x] = true;
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        comp.push([cx, cy]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && ny >= 0 && nx < w && ny < h && grid[ny][nx] && !seen[ny][nx]) {
            seen[ny][nx] = true;
            stack.push([nx, ny]);
          }
        }
      }
      out.push(comp);
    }
  return out;
}

function rasterise(name: string, inside: (x: number, y: number) => boolean, width: number, height: number, seed: number) {
  const N = 6;
  const cover = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      let hits = 0;
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (inside(x + (i + 0.5) / N, y + (j + 0.5) / N)) hits++;
      return hits / (N * N);
    }),
  );
  const base = cover.map((r) => r.map((c) => c >= 0.5));
  // Specks too small to hold a tetromino are dropped.
  for (const comp of components(base)) if (comp.length < 4) for (const [x, y] of comp) base[y][x] = false;

  // Edge cells we may flip, most ambiguous first.
  const candidates: [number, number][] = [];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (base[y + dy]?.[x + dx] ?? false) !== base[y][x]);
      if (near && (base[y][x] || cover[y][x] > 0.04)) candidates.push([x, y]);
    }
  candidates.sort((a, b) => Math.abs(cover[a[1]][a[0]] - 0.5) - Math.abs(cover[b[1]][b[0]] - 0.5));
  const pool = candidates.slice(0, 18);

  const attempt = (flips: [number, number][]) => {
    const grid = base.map((r) => [...r]);
    for (const [x, y] of flips) grid[y][x] = !grid[y][x];
    if (components(grid).some((c) => c.length % 4 !== 0)) return null;
    return tile(name, grid.map((r) => r.map((c) => (c ? "#" : ".")).join("")), seed, 120_000);
  };

  const sets: [number, number][][] = [[]];
  pool.forEach((a) => sets.push([a]));
  pool.forEach((a, i) => pool.slice(i + 1).forEach((b) => sets.push([a, b])));
  pool.forEach((a, i) => pool.slice(i + 1).forEach((b, j) => pool.slice(i + j + 2).forEach((c) => sets.push([a, b, c]))));
  for (const flips of sets) {
    const tiled = attempt(flips);
    if (tiled) return { tiled, flips: flips.length };
  }
  return null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const SHARP = Math.cos((38 * Math.PI) / 180);
const EPS = 0.07;

function extrusion(contours: Pt[][], inside: (x: number, y: number) => boolean) {
  // Seen from the isometric viewpoint, nearer slices of the solid sit toward (-1, +1).
  // A point is hidden when solid lies between it and the viewer.
  const occluded = (p: Pt, reach: number) => {
    for (let u = EPS; u <= reach; u += 0.07) if (inside(p[0] + u, p[1] - u)) return true;
    return false;
  };
  const back = contours.map((c) => c.map((p) => (occluded(p, DEPTH) ? "0" : "1")).join(""));

  const connectors: number[][] = [];
  const STEPS = 10;
  for (const c of contours) {
    for (let i = 0; i < c.length; i++) {
      const prev = c[(i - 1 + c.length) % c.length];
      const p = c[i];
      const next = c[(i + 1) % c.length];
      const ax = p[0] - prev[0];
      const ay = p[1] - prev[1];
      const bx = next[0] - p[0];
      const by = next[1] - p[1];
      // Side of the extrusion direction (-1, 1) each edge lies on: a change means a silhouette line.
      const c1 = ax + ay;
      const c2 = bx + by;
      const silhouette = c1 * c2 < 0 || (c1 === 0) !== (c2 === 0);
      const cos = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by) || 1);
      if (!silhouette && cos > SHARP) continue;
      let start = -1;
      for (let k = 0; k <= STEPS; k++) {
        const s = ((k + 0.5) / STEPS) * DEPTH;
        const visible = k < STEPS && !occluded(p, DEPTH - s);
        if (visible && start < 0) start = k;
        if (!visible && start >= 0) {
          if (k - start >= 2) connectors.push([r2(p[0]), r2(p[1]), r2((start / STEPS) * DEPTH), r2((k / STEPS) * DEPTH)]);
          start = -1;
        }
      }
    }
  }
  return { back, connectors };
}

const out: unknown[] = [];
let failed = false;
OUTLINES.forEach((outline, i) => {
  const flat = flatten(outline.d);
  let found: { contours: Pt[][]; width: number; height: number; inside: (x: number, y: number) => boolean; raster: NonNullable<ReturnType<typeof rasterise>> } | null = null;
  for (const grid of GRIDS) {
    const n = normalise(flat, grid);
    const inside = makeInside(n.contours);
    const raster = rasterise(outline.name, inside, n.width, n.height, i + 7);
    if (raster) {
      found = { ...n, inside, raster };
      break;
    }
  }
  if (!found) {
    console.log(`${outline.name.padEnd(15)} NOT TILEABLE`);
    failed = true;
    return;
  }
  const { contours, width, height, inside, raster } = found;
  const { tiled, flips } = raster;
  const rows = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => (tiled.pieces.some((p) => p.cells.some((c) => c[0] === x && c[1] === y)) ? "#" : ".")).join(""),
  );
  const { back, connectors } = extrusion(contours, inside);
  console.log(
    `${outline.name.padEnd(15)} ${width}x${height} pieces=${String(tiled.pieces.length).padStart(2)} nudged=${flips} contours=${contours.length} points=${contours.flat().length} depthLines=${connectors.length}`,
  );
  rows.forEach((r) => console.log("   " + r));
  out.push({ ...tiled, rows, contours: contours.map((c) => c.flatMap(([x, y]) => [r2(x), r2(y)])), back, connectors });
});
if (failed) process.exit(1);
writeFileSync(new URL("../src/lib/tetris/shapes.generated.json", import.meta.url), JSON.stringify(out) + "\n");
console.log(`wrote ${out.length} shapes`);

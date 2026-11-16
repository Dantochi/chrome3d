export type Cell = [x: number, y: number];
export type PieceKind = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
export type Piece = { kind: PieceKind; cells: Cell[] };
export type TiledShape = { name: string; width: number; height: number; pieces: Piece[] };

const BASE: Record<PieceKind, Cell[]> = {
  I: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  J: [[0, 0], [0, 1], [1, 1], [2, 1]],
  L: [[2, 0], [0, 1], [1, 1], [2, 1]],
};

function normalise(cells: Cell[]): Cell[] {
  // Anchor on the first cell in reading order (top row, then leftmost).
  const sorted = [...cells].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const [ax, ay] = sorted[0];
  return sorted.map(([x, y]) => [x - ax, y - ay]);
}

/** Every distinct rotation of every tetromino, anchored on its first cell in reading order. */
export const ORIENTATIONS: { kind: PieceKind; cells: Cell[] }[] = (() => {
  const out: { kind: PieceKind; cells: Cell[] }[] = [];
  const seen = new Set<string>();
  for (const kind of Object.keys(BASE) as PieceKind[]) {
    let cells = BASE[kind];
    for (let r = 0; r < 4; r++) {
      const n = normalise(cells);
      const key = kind + JSON.stringify(n);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ kind, cells: n });
      }
      cells = cells.map(([x, y]) => [-y, x]);
    }
  }
  return out;
})();

/**
 * Tiles a silhouette exactly with tetrominoes. Returns null when no tiling exists.
 * Row 0 of `rows` is the top; returned cells use y = 0 at the top as well.
 */
export function tile(name: string, rows: string[], seed = 1): TiledShape | null {
  const height = rows.length;
  const width = Math.max(...rows.map((r) => r.length));
  const open = rows.map((r) => Array.from({ length: width }, (_, x) => r[x] === "#"));
  const total = open.flat().filter(Boolean).length;
  if (total % 4 !== 0) return null;

  // Deterministic shuffle so each shape gets a varied mix of pieces.
  let s = seed;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  const pieces: Piece[] = [];
  let budget = 2_000_000;

  const solve = (): boolean => {
    if (--budget < 0) return false;
    let fx = -1;
    let fy = -1;
    outer: for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (open[y][x]) {
          fx = x;
          fy = y;
          break outer;
        }
      }
    }
    if (fx < 0) return true;
    const order = [...ORIENTATIONS].sort(() => rand() - 0.5);
    for (const o of order) {
      const placed = o.cells.map(([dx, dy]) => [fx + dx, fy + dy] as Cell);
      if (placed.every(([x, y]) => y >= 0 && y < height && x >= 0 && x < width && open[y][x])) {
        for (const [x, y] of placed) open[y][x] = false;
        pieces.push({ kind: o.kind, cells: placed });
        if (solve()) return true;
        pieces.pop();
        for (const [x, y] of placed) open[y][x] = true;
      }
    }
    return false;
  };

  return solve() ? { name, width, height, pieces } : null;
}

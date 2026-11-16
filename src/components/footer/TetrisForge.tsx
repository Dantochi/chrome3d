"use client";

import { useEffect, useRef, useState } from "react";
import { buildEdges, DEPTH, project, type Edge } from "@/lib/tetris/iso";
import { SHAPES } from "@/lib/tetris/shapes";
import type { Cell, Piece, TiledShape } from "@/lib/tetris/tiler";

/**
 * Footer animation. Tetris pieces drop in to build an object, the flat build turns to an
 * isometric view and extrudes, and what remains is a clean 3D outline. Ten objects, on a loop.
 */

const STAGGER = 150;
const FALL = 460;
const SETTLE = 350;
const FUSE = 550;
const TURN = 1500;
const HOLD = 2400;
const OUT = 650;

type Prepared = {
  shape: TiledShape;
  pieces: Piece[];
  cells: Cell[];
  edges: Edge[];
  dropEnd: number;
  total: number;
};

function prepare(shape: TiledShape): Prepared {
  // Lowest pieces land first.
  const pieces = [...shape.pieces].sort(
    (a, b) => Math.max(...b.cells.map((c) => c[1])) - Math.max(...a.cells.map((c) => c[1])),
  );
  const cells = pieces.flatMap((p) => p.cells);
  const dropEnd = (pieces.length - 1) * STAGGER + FALL;
  return { shape, pieces, cells, edges: buildEdges(cells), dropEnd, total: dropEnd + SETTLE + FUSE + TURN + HOLD + OUT };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Outline of a single piece: the cell edges not shared with another cell of the same piece. */
function strokePiece(ctx: CanvasRenderingContext2D, cells: Cell[], ox: number, oy: number, s: number, dx: number, dy: number) {
  const own = new Set(cells.map(([x, y]) => `${x},${y}`));
  ctx.beginPath();
  for (const [x, y] of cells) {
    const px = ox + (x + dx) * s;
    const py = oy + (y + dy) * s;
    ctx.rect(px, py, s, s);
  }
  ctx.fill();
  ctx.beginPath();
  for (const [x, y] of cells) {
    const px = ox + (x + dx) * s;
    const py = oy + (y + dy) * s;
    if (!own.has(`${x},${y - 1}`)) { ctx.moveTo(px, py); ctx.lineTo(px + s, py); }
    if (!own.has(`${x},${y + 1}`)) { ctx.moveTo(px, py + s); ctx.lineTo(px + s, py + s); }
    if (!own.has(`${x - 1},${y}`)) { ctx.moveTo(px, py); ctx.lineTo(px, py + s); }
    if (!own.has(`${x + 1},${y}`)) { ctx.moveTo(px + s, py); ctx.lineTo(px + s, py + s); }
  }
  ctx.stroke();
}

/** A quarter turn about the piece's own centre, kept on the grid, for the mid-fall rotation. */
function quarterTurn(cells: Cell[]): Cell[] {
  const cx = Math.round(cells.reduce((s, c) => s + c[0], 0) / 4);
  const cy = Math.round(cells.reduce((s, c) => s + c[1], 0) / 4);
  return cells.map(([x, y]) => [cx - (y - cy), cy + (x - cx)]);
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, p: Prepared, time: number, colors: Colors, staticView: boolean) {
  ctx.clearRect(0, 0, w, h);
  const { shape } = p;

  const tDrop = p.dropEnd + SETTLE;
  const fuse = staticView ? 1 : clamp01((time - tDrop) / FUSE);
  const turn = staticView ? 1 : ease(clamp01((time - tDrop - FUSE) / TURN));
  const out = staticView ? 0 : clamp01((time - (p.total - OUT)) / OUT);
  const alpha = 1 - out;

  // Fit: the isometric view is the widest/tallest, so size for it.
  const isoW = (shape.width + DEPTH) * 0.866;
  const isoH = shape.height + (shape.width + DEPTH) * 0.5;
  const s = Math.max(6, Math.min(30, (w * 0.9) / isoW, (h * 0.84) / isoH));

  // Centre the object for the current blend.
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [cx, cy] of [[0, 0], [shape.width, 0], [0, shape.height], [shape.width, shape.height]]) {
    for (const z of [0, DEPTH]) {
      const [px, py] = project(cx, cy, z, turn);
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
  }
  const ox = w / 2 - ((minX + maxX) / 2) * s;
  const oy = h / 2 - ((minY + maxY) / 2) * s + (out ? out * 10 : 0);

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 1. Pieces dropping in and locking (flat view).
  if (fuse < 1) {
    ctx.globalAlpha = (1 - fuse) * alpha;
    p.pieces.forEach((piece, i) => {
      const local = (time - i * STAGGER) / FALL;
      if (local <= 0) return;
      const landed = local >= 1;
      const k = clamp01(local);
      // Tetris-like motion: whole-cell steps down, a sideways shuffle and one rotation on the way.
      const dy = landed ? 0 : -Math.round((1 - k) * (shape.height + 4));
      const side = (i % 2 ? 1 : -1) * (2 + (i % 3));
      const dx = landed ? 0 : Math.round(side * Math.max(0, 1 - k / 0.6));
      const cells = !landed && k < 0.35 ? quarterTurn(piece.cells) : piece.cells;
      const fresh = landed ? clamp01(1 - (local - 1) * 2.5) : 1;
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = fresh > 0 ? colors.accent : colors.line;
      ctx.fillStyle = fresh > 0 ? colors.accentFill : colors.fill;
      strokePiece(ctx, cells, ox, oy, s, dx, dy);
      if (fresh > 0 && fresh < 1) {
        // Cross-fade from the highlight to the resting colour.
        ctx.save();
        ctx.globalAlpha *= 1 - fresh;
        ctx.strokeStyle = colors.line;
        ctx.fillStyle = colors.fill;
        strokePiece(ctx, cells, ox, oy, s, dx, dy);
        ctx.restore();
      }
    });
  }

  // 2. The fused object: outline only, turning to isometric and extruding.
  if (fuse > 0) {
    ctx.globalAlpha = fuse * alpha;
    ctx.strokeStyle = colors.outline;
    const pt = (x: number, y: number, z: number): [number, number] => {
      const [px, py] = project(x, y, z, turn);
      return [ox + px * s, oy + py * s];
    };
    // Depth lines first and lighter, then the silhouette on top.
    for (const front of [false, true]) {
      ctx.lineWidth = front ? 1.6 : 1.1;
      ctx.globalAlpha = fuse * alpha * (front ? 1 : 0.55 * turn);
      ctx.beginPath();
      for (const edge of p.edges) {
        if (edge.front !== front) continue;
        const [x1, y1] = pt(...edge.a);
        const [x2, y2] = pt(...edge.b);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

type Colors = { line: string; fill: string; accent: string; accentFill: string; outline: string };

export function TetrisForge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim();
    const colors: Colors = {
      line: v("--steel"),
      fill: "rgb(141 148 160 / 0.07)",
      accent: v("--blueprint"),
      accentFill: "rgb(92 200 255 / 0.14)",
      outline: v("--chrome"),
    };

    const prepared = SHAPES.map(prepare);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let current = 0;
    let started = performance.now();
    let frame = 0;
    let visible = false;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw(ctx, w, h, prepared[current], 0, colors, true);
    };

    const tick = (now: number) => {
      let time = now - started;
      if (time >= prepared[current].total) {
        current = (current + 1) % prepared.length;
        started = now;
        time = 0;
        setIndex(current);
      }
      draw(ctx, w, h, prepared[current], time, colors, false);
      frame = requestAnimationFrame(tick);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    // Only animate while the footer is on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (reduced) return;
      if (entry.isIntersecting && !visible) {
        visible = true;
        started = performance.now();
        frame = requestAnimationFrame(tick);
      } else if (!entry.isIntersecting && visible) {
        visible = false;
        cancelAnimationFrame(frame);
      }
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="block h-80 w-full sm:h-[28rem]" aria-hidden />
      <p className="label absolute bottom-3 left-0 tabular-nums" aria-hidden>
        Now building · {String(index + 1).padStart(2, "0")} / {SHAPES.length} · {SHAPES[index].name}
      </p>
      <p className="sr-only">
        Animation: tetris pieces assemble into ten objects, each turning into a 3D outline: {SHAPES.map((s) => s.name).join(", ")}.
      </p>
    </div>
  );
}

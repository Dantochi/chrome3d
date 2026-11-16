"use client";

import { useEffect, useRef, useState } from "react";
import { DEPTH, project } from "@/lib/tetris/iso";
import { SHAPES, type ForgeShape } from "@/lib/tetris/shapes";
import type { Cell, Piece } from "@/lib/tetris/tiler";

/**
 * Footer animation. Tetris pieces drop in to build a real object, the blocky build relaxes
 * into the object's smooth outline, and that outline turns to an isometric view and gains
 * depth. Ten objects, on a loop.
 */

const STAGGER = 110;
const FALL = 460;
const SETTLE = 350;
const FUSE = 500;
const SMOOTH = 1300;
const PAUSE = 500;
const TURN = 1500;
const HOLD = 2400;
const OUT = 650;

type Contour = { to: Float32Array; from: Float32Array; back: string };

type Prepared = {
  shape: ForgeShape;
  pieces: Piece[];
  /** Outer edges of the block silhouette, as [x1, y1, x2, y2]. */
  blockEdges: number[][];
  contours: Contour[];
  dropEnd: number;
  total: number;
};

function prepare(shape: ForgeShape): Prepared {
  // Lowest pieces land first.
  const pieces = [...shape.pieces].sort(
    (a, b) => Math.max(...b.cells.map((c) => c[1])) - Math.max(...a.cells.map((c) => c[1])),
  );
  const filled = new Set(pieces.flatMap((p) => p.cells.map(([x, y]) => `${x},${y}`)));
  const has = (x: number, y: number) => filled.has(`${x},${y}`);
  const blockEdges: number[][] = [];
  for (const piece of pieces)
    for (const [x, y] of piece.cells) {
      if (!has(x, y - 1)) blockEdges.push([x, y, x + 1, y]);
      if (!has(x, y + 1)) blockEdges.push([x, y + 1, x + 1, y + 1]);
      if (!has(x - 1, y)) blockEdges.push([x, y, x, y + 1]);
      if (!has(x + 1, y)) blockEdges.push([x + 1, y, x + 1, y + 1]);
    }

  // Every point of the smooth outline starts from the nearest point on the block outline.
  const contours = shape.contours.map((flat, i) => {
    const to = Float32Array.from(flat);
    const from = new Float32Array(flat.length);
    for (let k = 0; k < flat.length; k += 2) {
      let best = Infinity;
      for (const [x1, y1, x2, y2] of blockEdges) {
        const px = Math.min(Math.max(flat[k], Math.min(x1, x2)), Math.max(x1, x2));
        const py = Math.min(Math.max(flat[k + 1], Math.min(y1, y2)), Math.max(y1, y2));
        const d = (px - flat[k]) ** 2 + (py - flat[k + 1]) ** 2;
        if (d < best) {
          best = d;
          from[k] = px;
          from[k + 1] = py;
        }
      }
    }
    return { to, from, back: shape.back[i] };
  });

  const dropEnd = (pieces.length - 1) * STAGGER + FALL;
  return {
    shape,
    pieces,
    blockEdges,
    contours,
    dropEnd,
    total: dropEnd + SETTLE + FUSE + SMOOTH + PAUSE + TURN + HOLD + OUT,
  };
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
  const smooth = staticView ? 1 : ease(clamp01((time - tDrop - FUSE) / SMOOTH));
  const turn = staticView ? 1 : ease(clamp01((time - tDrop - FUSE - SMOOTH - PAUSE) / TURN));
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
  const oy = h / 2 - ((minY + maxY) / 2) * s + out * 10;

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // 1. Pieces dropping in and locking.
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

  if (fuse <= 0) {
    ctx.globalAlpha = 1;
    return;
  }
  ctx.strokeStyle = colors.outline;

  // 2. The fused block silhouette, fading as the smooth outline takes over.
  const blockAlpha = fuse * (1 - clamp01(smooth * 2.2)) * alpha;
  if (blockAlpha > 0) {
    ctx.globalAlpha = blockAlpha;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of p.blockEdges) {
      ctx.moveTo(ox + x1 * s, oy + y1 * s);
      ctx.lineTo(ox + x2 * s, oy + y2 * s);
    }
    ctx.stroke();
  }

  // 3. The smooth outline: relaxes out of the blocks, then turns to isometric and gains depth.
  const lineAlpha = fuse * clamp01(smooth * 2.2) * alpha;
  if (lineAlpha <= 0) {
    ctx.globalAlpha = 1;
    return;
  }
  const pt = (x: number, y: number, z: number): [number, number] => {
    const [px, py] = project(x, y, z, turn);
    return [ox + px * s, oy + py * s];
  };

  if (turn > 0) {
    // Depth lines and the visible part of the back face, lighter than the front.
    ctx.globalAlpha = lineAlpha * 0.5 * turn;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (const [x, y, from, to] of shape.connectors) {
      const [x1, y1] = pt(x, y, from);
      const [x2, y2] = pt(x, y, to);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    for (const c of p.contours) {
      const n = c.to.length / 2;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        if (c.back[i] !== "1" || c.back[j] !== "1") continue;
        const [x1, y1] = pt(c.to[i * 2], c.to[i * 2 + 1], 0);
        const [x2, y2] = pt(c.to[j * 2], c.to[j * 2 + 1], 0);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
    }
    ctx.stroke();
  }

  // Front face: the object's outline.
  ctx.globalAlpha = lineAlpha;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (const c of p.contours) {
    const n = c.to.length / 2;
    for (let i = 0; i < n; i++) {
      const x = c.from[i * 2] + (c.to[i * 2] - c.from[i * 2]) * smooth;
      const y = c.from[i * 2 + 1] + (c.to[i * 2 + 1] - c.from[i * 2 + 1]) * smooth;
      const [px, py] = pt(x, y, DEPTH);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  ctx.stroke();
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

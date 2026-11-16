import assert from "node:assert/strict";
import { test } from "node:test";
import { OUTLINES } from "./outlines";
import { SHAPES } from "./shapes";
import { ORIENTATIONS } from "./tiler";

test("there are ten objects, one per outline", () => {
  assert.equal(SHAPES.length, 10);
  assert.deepEqual(
    SHAPES.map((s) => s.name),
    OUTLINES.map((o) => o.name),
  );
});

for (const shape of SHAPES) {
  test(`${shape.name} is covered exactly by valid tetrominoes`, () => {
    const wanted = new Set<string>();
    shape.rows.forEach((row, y) => [...row].forEach((c, x) => c === "#" && wanted.add(`${x},${y}`)));
    assert.ok(wanted.size > 0);

    const covered = new Set<string>();
    for (const piece of shape.pieces) {
      assert.equal(piece.cells.length, 4);
      const sorted = [...piece.cells].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      const rel = JSON.stringify(sorted.map(([x, y]) => [x - sorted[0][0], y - sorted[0][1]]));
      assert.ok(
        ORIENTATIONS.some((o) => o.kind === piece.kind && JSON.stringify(o.cells) === rel),
        `piece is a real ${piece.kind} tetromino`,
      );
      for (const [x, y] of piece.cells) {
        const key = `${x},${y}`;
        assert.ok(wanted.has(key), `cell ${key} is inside the silhouette`);
        assert.ok(!covered.has(key), `cell ${key} is covered once`);
        covered.add(key);
      }
    }
    assert.equal(covered.size, wanted.size, "every cell is covered");
  });

  test(`${shape.name} has a smooth outline with matching visibility data`, () => {
    assert.ok(shape.contours.length > 0);
    shape.contours.forEach((c, i) => assert.equal(shape.back[i].length, c.length / 2));
  });
}

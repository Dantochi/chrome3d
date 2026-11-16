import assert from "node:assert/strict";
import { test } from "node:test";
import { SHAPES } from "./shapes";
import { SILHOUETTES } from "./silhouettes";
import { ORIENTATIONS } from "./tiler";

test("there are ten objects", () => {
  assert.equal(SHAPES.length, 10);
  assert.equal(SILHOUETTES.length, 10);
});

for (const shape of SHAPES) {
  test(`${shape.name} is covered exactly by valid tetrominoes`, () => {
    const source = SILHOUETTES.find((s) => s.name === shape.name);
    assert.ok(source, "silhouette exists");
    const wanted = new Set<string>();
    source.rows.forEach((row, y) => [...row].forEach((c, x) => c === "#" && wanted.add(`${x},${y}`)));

    const covered = new Set<string>();
    for (const piece of shape.pieces) {
      assert.equal(piece.cells.length, 4);
      const [ax, ay] = [...piece.cells].sort((a, b) => a[1] - b[1] || a[0] - b[0])[0];
      const rel = JSON.stringify(
        [...piece.cells].sort((a, b) => a[1] - b[1] || a[0] - b[0]).map(([x, y]) => [x - ax, y - ay]),
      );
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
}

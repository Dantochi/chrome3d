import { writeFileSync } from "node:fs";
import { SILHOUETTES } from "../src/lib/tetris/silhouettes";
import { tile, type TiledShape } from "../src/lib/tetris/tiler";

const out: TiledShape[] = [];
let failed = false;
SILHOUETTES.forEach((s, i) => {
  const count = s.rows.join("").split("#").length - 1;
  const tiled = tile(s.name, s.rows, i + 7);
  console.log(`${s.name.padEnd(8)} cells=${count} ${tiled ? `pieces=${tiled.pieces.length}` : "NOT TILEABLE"}`);
  if (!tiled) failed = true;
  else out.push(tiled);
});
if (failed) process.exit(1);
writeFileSync(
  new URL("../src/lib/tetris/shapes.generated.json", import.meta.url),
  JSON.stringify(out) + "\n",
);
console.log(`wrote ${out.length} shapes`);

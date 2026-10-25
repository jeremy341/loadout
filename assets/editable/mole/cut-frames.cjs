// Blanks the frames Orry no longer plays in the atlas the homepage reads (apps/landing/public/loadout/mole/mole.png). The cells stay
// in place, so every frame number in app/_components/mole/frames.ts is unchanged; they are just transparent now. The drawings
// remain in the sliced sheets (see build-atlas.cjs), so nothing is lost at the source.
//   node assets/editable/mole/cut-frames.cjs [atlas.png]
// The list is the audit of 2026-10-16 (.ulpi/design/mole-record.md, "Frame reconciliation").
const fs = require("fs");
const path = require("path");
const K = require("./png.cjs");

const SHEETS = "ABCDEGHIJKLM";
const CUT = [
  "A1 A2 A3 A4 A5 A6 A7 A8",                // the first walk cycle (side view): replaced by the run
  "H1 H2 H3 H4 H5 H6 H7 H8 H15 H16",        // the second walk cycle and two stray frames
  "J1 J2 J3 J4 J5 J6 J7 J8",                // the third walk cycle
  "B6 B9 G9 D16",                           // near-duplicates of neutral frames in use
  "D13 M9 M10 M11 M12 M16",                 // dazed again, confused, wobble and the last get-up frame (dazed beats play once)
  "D14",                                    // shake it off after standing up (one recovery per fall)
  "E1",                                     // draws a hand, which clashes with the real cursor
  "E8 E9 K11",                              // the annoyed and hurt faces (owner: remove)
].join(" ").split(" ");

const file = process.argv[2] || path.join(__dirname, "../../../apps/landing/public/loadout/mole/mole.png");
const atlas = K.decode(file);
const COLS = 10, SIZE = 64;
for (const label of CUT) {
  const index = SHEETS.indexOf(label[0]) * 16 + Number(label.slice(1)) - 1;
  const ox = (index % COLS) * SIZE, oy = Math.floor(index / COLS) * SIZE;
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) atlas.rgba.fill(0, ((oy + y) * atlas.w + ox + x) * 4, ((oy + y) * atlas.w + ox + x) * 4 + 4);
}
fs.writeFileSync(file, K.encode(atlas.w, atlas.h, atlas.rgba));
console.log("blanked", CUT.length, "frames in", file);

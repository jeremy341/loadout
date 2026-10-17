// Packs the cleaned mole frames into two atlases the homepage mascot reads:
//   mole.png  the mole, 64 px cells, 10 columns: sheets A (moving), B (expressions), C (dig), D (picked up), E (petted), G (reactions), H (walk and run cycles), I (idle, jump, fall, landing), J (a second walk cycle, half full), K (looking in 8 directions and moods), L (falling, landing, jumping for joy, pinched), M (dazed, confused, getting up), 16 frames each
//   fx.png    the effects, 32 px cells, 8 columns: 19 frames
// Frame index = sheet position * 16 + (frame number - 1); see app/_components/mole/frames.ts.
//   node assets/editable/mole/build-atlas.cjs <frames folder> <output folder>
// The frames come from slicing the GPT sheets (see docs/design/asset-catalog.md); the sheets and the slicer are not in the repository.
const fs = require("fs");
const path = require("path");
const K = require("./png.cjs");

const [frames, out] = process.argv.slice(2);
if (!frames || !out) throw new Error("Usage: node build-atlas.cjs <frames folder> <output folder>");
fs.mkdirSync(out, { recursive: true });

function pack(list, size, cols, file) {
  const rows = Math.ceil(list.length / cols);
  const atlas = { w: cols * size, h: rows * size, rgba: Buffer.alloc(cols * size * rows * size * 4) };
  list.forEach((png, i) => {
    if (!png) return;
    const img = K.decode(png);
    if (img.w !== size || img.h !== size) throw new Error(`${png} is ${img.w}x${img.h}, expected ${size}`);
    const ox = (i % cols) * size, oy = Math.floor(i / cols) * size;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) img.rgba.copy(atlas.rgba, ((oy + y) * atlas.w + ox + x) * 4, (y * size + x) * 4, (y * size + x) * 4 + 4);
  });
  fs.writeFileSync(path.join(out, file), K.encode(atlas.w, atlas.h, atlas.rgba));
  console.log(file, atlas.w + "x" + atlas.h, list.filter(Boolean).length + " frames");
}

const frame = (size, sheet, n) => path.join(frames, String(size), sheet, String(n).padStart(2, "0") + ".png");
const mole = [];
for (const sheet of ["A-moving", "B-expressions", "C-dig", "D-picked-up", "E-pet", "G-reactions", "H-cycles", "I-more", "J-walk", "K-gaze", "L-falls", "M-dazed"]) for (let n = 1; n <= 16; n++) mole.push(fs.existsSync(frame(64, sheet, n)) ? frame(64, sheet, n) : null); // a sheet may be half full
pack(mole, 64, 10, "mole.png");
const fx = [];
for (let n = 1; n <= 19; n++) fx.push(frame(64, "F-effects", n)); // the effects are 32 px in every size folder
pack(fx, 32, 8, "fx.png");

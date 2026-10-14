// Builds the homepage cursors from two tiles of Kenney's Cursor Pixel Pack (CC0, see source/kenney-LICENSE.txt):
// the classic arrow and the index-finger hand. Kenney draws them white with a black outline; this recolours them to
// LOADOUT's ink outline and the theme's fill (blue in the dark theme like its icons, yellow in the light theme),
// and writes 32 px (1x) and 64 px (2x) PNGs, pixel for pixel, no smoothing.
//   bun assets/editable/cursors/make-cursors.js apps/landing/public/loadout/cursors
// It prints each cursor's hotspot (the click point, in CSS pixels at 1x) for app/cursor.css.
// Tiny PNG helpers: decode a palette or RGBA PNG to RGBA, encode RGBA to PNG, and recolour Kenney's white and black cursors.
const fs = require("fs");
const zlib = require("zlib");

function decode(file) {
  const b = fs.readFileSync(file);
  let o = 8, w, h, depth, ctype, plte = null, trns = null;
  const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), type = b.toString("ascii", o + 4, o + 8), data = b.slice(o + 8, o + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; }
    if (type === "PLTE") plte = data;
    if (type === "tRNS") trns = data;
    if (type === "IDAT") idat.push(data);
    o += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype];
  const bitsPerPixel = channels * depth;
  const stride = Math.ceil((w * bitsPerPixel) / 8);
  const bpp = Math.max(1, bitsPerPixel >> 3);
  const rows = [];
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const row = Buffer.from(raw.slice(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? row[i - bpp] : 0, up = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = row[i];
      if (f === 1) v += a;
      else if (f === 2) v += up;
      else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      row[i] = v & 255;
    }
    rows.push(row);
    prev = row;
  }
  const rgba = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (ctype === 3) {
        const bit = x * depth, idx = (rows[y][bit >> 3] >> (8 - depth - (bit & 7))) & ((1 << depth) - 1);
        rgba[i] = plte[idx * 3]; rgba[i + 1] = plte[idx * 3 + 1]; rgba[i + 2] = plte[idx * 3 + 2];
        rgba[i + 3] = trns && idx < trns.length ? trns[idx] : 255;
      } else if (ctype === 6) {
        for (let k = 0; k < 4; k++) rgba[i + k] = rows[y][x * 4 + k];
      } else if (ctype === 2) {
        for (let k = 0; k < 3; k++) rgba[i + k] = rows[y][x * 3 + k];
        rgba[i + 3] = 255;
      } else throw new Error("unsupported colour type " + ctype);
    }
  }
  return { w, h, rgba };
}

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const x of buf) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, "ascii"), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
function encode(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// Scale by an integer factor (nearest neighbour).
function scale({ w, h, rgba }, k) {
  const out = Buffer.alloc(w * k * h * k * 4);
  for (let y = 0; y < h * k; y++) for (let x = 0; x < w * k; x++) rgba.copy(out, (y * w * k + x) * 4, (Math.floor(y / k) * w + Math.floor(x / k)) * 4, (Math.floor(y / k) * w + Math.floor(x / k)) * 4 + 4);
  return { w: w * k, h: h * k, rgba: out };
}

// Recolour a white-fill, black-outline cursor: bright pixels become `fill`, dark pixels `ink`, mid greys a darker shade of the fill.
function recolour({ w, h, rgba }, fill, ink) {
  const out = Buffer.from(rgba);
  for (let i = 0; i < w * h; i++) {
    const a = rgba[i * 4 + 3];
    if (!a) continue;
    const lum = (rgba[i * 4] + rgba[i * 4 + 1] + rgba[i * 4 + 2]) / 3;
    let c;
    if (lum > 200) c = fill;
    else if (lum < 70) c = ink;
    else c = fill.map((v) => Math.round(v * 0.62));
    out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = a;
  }
  return { w, h, rgba: out };
}

// Alpha-composite `src` onto an RGB background and place it at (x, y) of `dst` (RGBA, w x h).
function blit(dst, src, x0, y0) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const s = (y * src.w + x) * 4, d = ((y0 + y) * dst.w + (x0 + x)) * 4;
    const a = src.rgba[s + 3] / 255;
    if (!a) continue;
    for (let k = 0; k < 3; k++) dst.rgba[d + k] = Math.round(src.rgba[s + k] * a + dst.rgba[d + k] * (1 - a));
  }
}
function canvas(w, h, bg) {
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { rgba[i * 4] = bg[0]; rgba[i * 4 + 1] = bg[1]; rgba[i * 4 + 2] = bg[2]; rgba[i * 4 + 3] = 255; }
  return { w, h, rgba };
}

const path = require("path");
const here = __dirname.split(path.sep).join("/");
const out = process.argv[2];
if (!out) throw new Error("Pass the output folder as the first argument.");
fs.mkdirSync(out, { recursive: true });

const INK = [14, 18, 21];
const FILLS = { dark: [94, 158, 244], light: [253, 207, 3] };
const SOURCES = { arrow: "source/kenney-0168-arrow.png", hand: "source/kenney-0157-hand.png" };

// The click point: the arrow's tip is its top left corner; the hand's is the middle of its top row (the fingertip).
function hotspot(kind, img) {
  const opaque = (x, y) => img.rgba[(y * img.w + x) * 4 + 3] > 0;
  if (kind === "hand") {
    for (let y = 0; y < img.h; y++) {
      const xs = [...Array(img.w).keys()].filter((x) => opaque(x, y));
      if (xs.length) return [Math.round((xs[0] + xs[xs.length - 1]) / 2), y];
    }
  }
  let best = null;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (opaque(x, y) && (!best || x + y < best[0] + best[1])) best = [x, y];
  return best;
}

for (const [kind, file] of Object.entries(SOURCES)) {
  const source = decode(path.join(here, file));
  const [hx, hy] = hotspot(kind, source);
  console.log(kind, source.w + "x" + source.h, "hotspot at 1x (32 px):", hx * 2 + 1, hy * 2 + 1);
  for (const [theme, fill] of Object.entries(FILLS)) {
    const art = recolour(source, fill, INK);
    for (const [suffix, factor] of [["", 2], ["@2x", 4]]) {
      const big = scale(art, factor);
      fs.writeFileSync(`${out}/${kind}-${theme}${suffix}.png`, encode(big.w, big.h, big.rgba));
    }
  }
}

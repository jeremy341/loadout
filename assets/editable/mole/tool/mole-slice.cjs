// Slices GPT-made sprite sheets into clean pixel frames: keys out the magenta, finds each sprite, anchors it on the ground,
// shrinks it to the target size with a box filter, and locks the colours to one shared palette (k-means).
const fs = require("fs");
const path = require("path");
const app = "C:/Users/jerem/Documents/LOADOUT/loadout-plan/apps/landing";
const { chromium } = require(require.resolve("@playwright/test", { paths: [app] }));
const K = require("./kpx.js");

const IMG = "C:/Users/jerem/AppData/Local/Temp/claude/C--Users-jerem-Documents-LOADOUT/97ad5c01-06d9-418b-973f-b089f6a67d04/images/";
const OUT = process.argv[2];
const SHEETS = [
  { id: "A-moving", file: "2.jpg", cols: 4, rows: 4, group: "mole" },
  { id: "B-expressions", file: "5.jpg", cols: 4, rows: 4, group: "mole" },
  { id: "C-dig", file: "3.jpg", cols: 4, rows: 4, group: "mole" },
  { id: "D-picked-up", file: "6.jpg", cols: 4, rows: 4, group: "mole" },
  { id: "E-pet", file: "4.jpg", cols: 4, rows: 4, group: "mole" },
  { id: "F-effects", file: "1.jpg", cols: 8, rows: 4, group: "fx" },
];
const TARGETS = [32, 48, 64];

async function decode(browser, file) {
  const page = await browser.newPage();
  const b64 = fs.readFileSync(IMG + file).toString("base64");
  const data = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = "data:image/jpeg;base64," + src;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height);
    let s = "";
    const chunk = 0x8000;
    for (let i = 0; i < d.data.length; i += chunk) s += String.fromCharCode.apply(null, d.data.subarray(i, i + chunk));
    return { w: c.width, h: c.height, b64: btoa(s) };
  }, b64);
  await page.close();
  return { w: data.w, h: data.h, rgba: Buffer.from(data.b64, "base64") };
}

// Magenta background and its JPEG halos: the average of red and blue is far above green.
const isBg = (r, g, b) => (r + b) / 2 - g > 90;

function mask(img) {
  const m = new Uint8Array(img.w * img.h);
  for (let i = 0; i < m.length; i++) m[i] = isBg(img.rgba[i * 4], img.rgba[i * 4 + 1], img.rgba[i * 4 + 2]) ? 0 : 1;
  // Drop specks: connected groups smaller than 40 pixels.
  const seen = new Uint8Array(m.length);
  const stack = [];
  for (let s = 0; s < m.length; s++) {
    if (!m[s] || seen[s]) continue;
    const comp = [];
    stack.push(s);
    seen[s] = 1;
    while (stack.length) {
      const p = stack.pop();
      comp.push(p);
      const x = p % img.w, y = (p / img.w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= img.w || ny >= img.h) continue;
        const q = ny * img.w + nx;
        if (m[q] && !seen[q]) { seen[q] = 1; stack.push(q); }
      }
    }
    if (comp.length < 40) for (const p of comp) m[p] = 0;
  }
  return m;
}

// Finds each sprite as its own shape: the mask is grown by 'radius' pixels so loose bits (shake lines, hands) join their sprite,
// then every connected group is one sprite. Returns, per pixel, the id of the sprite it belongs to (0 for none).
function sprites(m, w, h, radius) {
  const grown = new Uint8Array(m.length);
  const tmp = new Uint8Array(m.length);
  for (let y = 0; y < h; y++) { let last = -1e9; for (let x = 0; x < w; x++) { if (m[y * w + x]) last = x; if (x - last <= radius) tmp[y * w + x] = 1; } last = 1e9; for (let x = w - 1; x >= 0; x--) { if (m[y * w + x]) last = x; if (last - x <= radius) tmp[y * w + x] = 1; } }
  for (let x = 0; x < w; x++) { let last = -1e9; for (let y = 0; y < h; y++) { if (tmp[y * w + x]) last = y; if (y - last <= radius) grown[y * w + x] = 1; } last = 1e9; for (let y = h - 1; y >= 0; y--) { if (tmp[y * w + x]) last = y; if (last - y <= radius) grown[y * w + x] = 1; } }
  const label = new Int32Array(m.length);
  let next = 0;
  const stack = [];
  for (let st = 0; st < m.length; st++) {
    if (!grown[st] || label[st]) continue;
    next++;
    stack.push(st); label[st] = next;
    while (stack.length) {
      const p = stack.pop(); const x = p % w, y = (p / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue; const q = ny * w + nx; if (grown[q] && !label[q]) { label[q] = next; stack.push(q); } }
    }
  }
  const own = new Int32Array(m.length);
  const boxes = {};
  for (let p = 0; p < m.length; p++) if (m[p]) { const id = label[p]; own[p] = id; const x = p % w, y = (p / w) | 0; const bx = boxes[id] || (boxes[id] = { id, minX: 1e9, minY: 1e9, maxX: -1, maxY: -1, n: 0 }); bx.minX = Math.min(bx.minX, x); bx.maxX = Math.max(bx.maxX, x); bx.minY = Math.min(bx.minY, y); bx.maxY = Math.max(bx.maxY, y); bx.n++; }
  return { own, boxes: Object.values(boxes).filter((bx) => bx.n > 120) };
}

// Puts the sprites in reading order: rows by height, then left to right. Returns { index, box } with index = row * cols + column.
function order(boxes, cols, cellH) {
  const sorted = boxes.map((bx) => ({ bx, cy: (bx.minY + bx.maxY) / 2, cx: (bx.minX + bx.maxX) / 2 })).sort((p, q) => p.cy - q.cy);
  const rowsOut = [];
  for (const it of sorted) {
    const row = rowsOut[rowsOut.length - 1];
    if (row && it.cy - row.cy < cellH * 0.5) { row.items.push(it); row.cy = row.items.reduce((t, v) => t + v.cy, 0) / row.items.length; }
    else rowsOut.push({ cy: it.cy, items: [it] });
  }
  const out = [];
  rowsOut.forEach((row, r) => row.items.sort((p, q) => p.cx - q.cx).forEach((it, c) => out.push({ index: r * cols + c, box: it.bx, row: r, col: c })));
  return out;
}

// Shrink one sprite to size x size: it is moved so its feet sit on the ground row and it is centred in its cell.
function frame(img, own, item, cell, size, ground, mode) {
  const out = new Uint8Array(size * size * 4);
  const box = item.box;
  const scale = size / Math.max(cell.x1 - cell.x0, cell.y1 - cell.y0);
  const cx = mode === "bbox" ? (box.minX + box.maxX) / 2 : (box.minX + box.maxX) / 2;
  const shiftX = (cell.x0 + cell.x1) / 2 - cx;
  const shiftY = mode === "bbox" ? cell.y0 + (cell.y1 - cell.y0) * ground - box.maxY : (cell.y0 + cell.y1) / 2 - (box.minY + box.maxY) / 2;
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      const sx0 = cell.x0 + dx / scale - shiftX, sx1 = cell.x0 + (dx + 1) / scale - shiftX;
      const sy0 = cell.y0 + dy / scale - shiftY, sy1 = cell.y0 + (dy + 1) / scale - shiftY;
      let r = 0, g = 0, b = 0, n = 0, total = 0;
      for (let y = Math.floor(sy0); y < Math.ceil(sy1); y++) {
        for (let x = Math.floor(sx0); x < Math.ceil(sx1); x++) {
          if (x < 0 || y < 0 || x >= img.w || y >= img.h) continue;
          total++;
          if (own[y * img.w + x] !== box.id) continue;
          const i = (y * img.w + x) * 4;
          r += img.rgba[i]; g += img.rgba[i + 1]; b += img.rgba[i + 2]; n++;
        }
      }
      if (total && n / total >= 0.5) { const o = (dy * size + dx) * 4; out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = 255; }
    }
  }
  return { out, empty: false, box };
}

function kmeans(samples, k, iterations = 14) {
  // Start from the most common colours spread apart, then refine.
  const centres = [];
  const first = samples[(samples.length / 2) | 0];
  centres.push(first.slice());
  while (centres.length < k) {
    let best = null, bestD = -1;
    for (let i = 0; i < samples.length; i += 7) {
      const s = samples[i];
      const d = Math.min(...centres.map((c) => (c[0] - s[0]) ** 2 + (c[1] - s[1]) ** 2 + (c[2] - s[2]) ** 2));
      if (d > bestD) { bestD = d; best = s; }
    }
    centres.push(best.slice());
  }
  for (let it = 0; it < iterations; it++) {
    const sum = centres.map(() => [0, 0, 0, 0]);
    for (const s of samples) {
      let bi = 0, bd = 1e12;
      for (let c = 0; c < centres.length; c++) {
        const d = (centres[c][0] - s[0]) ** 2 + (centres[c][1] - s[1]) ** 2 + (centres[c][2] - s[2]) ** 2;
        if (d < bd) { bd = d; bi = c; }
      }
      sum[bi][0] += s[0]; sum[bi][1] += s[1]; sum[bi][2] += s[2]; sum[bi][3]++;
    }
    sum.forEach((s, c) => { if (s[3]) centres[c] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
  }
  return centres.map((c) => c.map(Math.round));
}

function snap(buf, palette) {
  for (let i = 0; i < buf.length; i += 4) {
    if (!buf[i + 3]) continue;
    let bi = 0, bd = 1e12;
    for (let c = 0; c < palette.length; c++) {
      const d = (palette[c][0] - buf[i]) ** 2 + (palette[c][1] - buf[i + 1]) ** 2 + (palette[c][2] - buf[i + 2]) ** 2;
      if (d < bd) { bd = d; bi = c; }
    }
    buf[i] = palette[bi][0]; buf[i + 1] = palette[bi][1]; buf[i + 2] = palette[bi][2];
  }
}

(async () => {
  const browser = await chromium.launch();
  const sheets = [];
  for (const s of SHEETS) {
    const img = await decode(browser, s.file);
    sheets.push({ ...s, img, m: mask(img) });
    console.log(s.id, img.w + "x" + img.h);
  }
  await browser.close();

  for (const size of TARGETS) {
    const framesBySheet = {};
    for (const s of sheets) {
      const cw = s.img.w / s.cols, ch = s.img.h / s.rows;
      const cellSize = s.group === "fx" ? Number(process.env.FX_SIZE || 32) : size;
      const list = [];
      if (!s.sprite) {
        // Try grouping distances from wide to narrow and keep the first that finds exactly the expected number of sprites.
        const want = s.cols * s.rows;
        let pick = null;
        for (const radius of s.group === "fx" ? [10] : [16, 14, 12, 10, 8, 6, 5, 4, 3]) {
          const found = sprites(s.m, s.img.w, s.img.h, radius);
          pick = pick || found;
          if (found.boxes.length === want) { pick = found; s.radius = radius; break; }
        }
        s.sprite = pick;
      }
      const { own, boxes } = s.sprite;
      const items = order(boxes, s.cols, ch);
      if (items.length !== s.cols * s.rows && s.group !== "fx") console.log("WARNING", s.id, "found", items.length, "sprites, expected", s.cols * s.rows);
      for (const item of items) {
        const cell = { x0: Math.round(item.col * cw), y0: Math.round(item.row * ch), x1: Math.round((item.col + 1) * cw), y1: Math.round((item.row + 1) * ch) };
        const f = s.group === "fx" ? frame(s.img, own, item, cell, cellSize, 0.5, "cell") : frame(s.img, own, item, cell, size, 0.93, "bbox");
        list.push({ ...f, index: item.index, size: cellSize });
      }
      framesBySheet[s.id] = list;
    }
    // One shared palette for the mole, another for the effects.
    for (const group of ["mole", "fx"]) {
      const samples = [];
      for (const s of sheets.filter((x) => x.group === group)) for (const f of framesBySheet[s.id]) for (let i = 0; i < f.out.length; i += 4) if (f.out[i + 3]) samples.push([f.out[i], f.out[i + 1], f.out[i + 2]]);
      const palette = kmeans(samples, group === "mole" ? 22 : 14);
      fs.writeFileSync(`${OUT}/palette-${group}.json`, JSON.stringify(palette.map((c) => "#" + c.map((v) => v.toString(16).padStart(2, "0")).join(""))));
      for (const s of sheets.filter((x) => x.group === group)) for (const f of framesBySheet[s.id]) snap(f.out, palette);
    }
    // Write frames and contact sheets.
    for (const s of sheets) {
      const list = framesBySheet[s.id];
      const dir = `${OUT}/${size}/${s.id}`;
      fs.mkdirSync(dir, { recursive: true });
      list.forEach((f) => { if (!f.empty) fs.writeFileSync(`${dir}/${String(f.index + 1).padStart(2, "0")}.png`, K.encode(f.size, f.size, Buffer.from(f.out))); });
      const zoom = s.group === "fx" ? Math.max(2, Math.round(192 / Number(process.env.FX_SIZE || 32))) : Math.max(2, Math.round(256 / size));
      const cellPx = list[0].size * zoom;
      for (const [theme, bg] of [["dark", [34, 38, 39]], ["light", [221, 211, 191]]]) {
        const sheet = K.canvas(s.cols * cellPx, s.rows * cellPx, bg);
        list.forEach((f) => {
          if (f.empty) return;
          K.blit(sheet, K.scale({ w: f.size, h: f.size, rgba: Buffer.from(f.out) }, zoom), (f.index % s.cols) * cellPx, Math.floor(f.index / s.cols) * cellPx);
        });
        fs.writeFileSync(`${OUT}/sheet-${size}-${s.id}-${theme}.png`, K.encode(sheet.w, sheet.h, sheet.rgba));
      }
    }
    console.log("done", size);
  }
})();

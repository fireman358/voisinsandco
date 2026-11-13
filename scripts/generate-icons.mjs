import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const GREEN = [21, 128, 61];
const AMBER = [217, 119, 6];
const WHITE = [255, 255, 255];

function makeImage(size) {
  return new Uint8ClampedArray(size * size * 4);
}

function setPx(img, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  img[i] = color[0];
  img[i + 1] = color[1];
  img[i + 2] = color[2];
  img[i + 3] = 255;
}

function fillRect(img, size, x0, y0, w, h, color) {
  for (let y = Math.round(y0); y < y0 + h; y++) {
    for (let x = Math.round(x0); x < x0 + w; x++) setPx(img, size, x, y, color);
  }
}

function fillCircle(img, size, cx, cy, r, color) {
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) setPx(img, size, x, y, color);
    }
  }
}

function fillTriangle(img, size, x1, y1, x2, y2, x3, y3, color) {
  const minX = Math.floor(Math.min(x1, x2, x3));
  const maxX = Math.ceil(Math.max(x1, x2, x3));
  const minY = Math.floor(Math.min(y1, y2, y3));
  const maxY = Math.ceil(Math.max(y1, y2, y3));
  const d = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / d;
      const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / d;
      const c = 1 - a - b;
      if (a >= -0.001 && b >= -0.001 && c >= -0.001) setPx(img, size, x, y, color);
    }
  }
}

function fillRoundedRect(img, size, x0, y0, w, h, r, color) {
  for (let y = Math.round(y0); y < y0 + h; y++) {
    for (let x = Math.round(x0); x < x0 + w; x++) {
      const cx = Math.max(x0 + r, Math.min(x, x0 + w - r));
      const cy = Math.max(y0 + r, Math.min(y, y0 + h - r));
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) setPx(img, size, x, y, color);
    }
  }
}

function drawLogo(img, size, { maskable = false } = {}) {
  const s = size / 512;
  const k = maskable ? 0.78 : 1;
  const cx = size / 2;
  const cy = size / 2;
  const map = (x, y) => [cx + (x - 256) * s * k, cy + (y - 256) * s * k];

  if (maskable) {
    fillRect(img, size, 0, 0, size, size, GREEN);
  } else {
    fillRoundedRect(img, size, 0, 0, size, size, 110 * s, GREEN);
  }

  const [rx1, ry1] = map(256, 96);
  const [rx2, ry2] = map(116, 240);
  const [rx3, ry3] = map(396, 240);
  fillTriangle(img, size, rx1, ry1, rx2, ry2, rx3, ry3, WHITE);

  const [bx, by] = map(150, 240);
  fillRect(img, size, bx, by, 212 * s * k, 170 * s * k, WHITE);

  const [dx, dy] = map(232, 300);
  fillRect(img, size, dx, dy, 48 * s * k, 110 * s * k, GREEN);

  const [ccx, ccy] = map(392, 118);
  fillCircle(img, size, ccx, ccy, 59 * s * k, WHITE);
  fillCircle(img, size, ccx, ccy, 46 * s * k, AMBER);
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function encodePng(img, size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    Buffer.from(img.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const outputs = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-192-maskable.png", size: 192, maskable: true },
  { file: "icon-512-maskable.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const { file, size, maskable } of outputs) {
  const img = makeImage(size);
  drawLogo(img, size, { maskable: maskable ?? false });
  fs.writeFileSync(path.join(outDir, file), encodePng(img, size));
  console.log(`OK public/icons/${file} (${size}x${size})`);
}

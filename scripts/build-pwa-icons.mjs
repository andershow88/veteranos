#!/usr/bin/env node
/**
 * Builds Veteranos PWA icons in /public — soccer ball + small beer mug
 * on the brand dark-green background.
 *   - icon-192.png
 *   - icon-512.png
 *   - icon-512-maskable.png (motif kept inside the inner 80% safe zone)
 *   - apple-touch-icon.png (180x180, no transparency for iOS)
 *
 * No external deps. Draws raw RGBA pixels and encodes them with
 * node:zlib (deflate + crc32). Replace with a real designed logo
 * whenever you have one — the manifest already references these names.
 *
 * Run:  node scripts/build-pwa-icons.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { deflateSync, crc32 } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = dirname(dirname(__filename));
const PUBLIC_DIR = join(ROOT, "public");
mkdirSync(PUBLIC_DIR, { recursive: true });

/* ---------- Brand palette ---------- */
const BG = rgb(0x07, 0x12, 0x0a);             // app background
const PITCH_GREEN = rgb(0x10, 0xa3, 0x6e);    // mid pitch
const PITCH_GREEN_DARK = rgb(0x0a, 0x7a, 0x4f); // pitch shadow stripe
const PITCH_LINE = rgb(0xf5, 0xfa, 0xf7);     // line markings
const BEER_GOLD = rgb(0xf2, 0xb3, 0x35);
const BEER_GOLD_DEEP = rgb(0xc1, 0x8a, 0x1c);
const BEER_FOAM = rgb(0xfb, 0xf8, 0xe9);
const BEER_FOAM_SHADE = rgb(0xe2, 0xdb, 0xb6);
const GLASS_LINE = rgb(0xff, 0xff, 0xff);

function rgb(r, g, b) { return { r, g, b }; }
function blend(a, b, t) { return rgb(Math.round(a.r * (1 - t) + b.r * t), Math.round(a.g * (1 - t) + b.g * t), Math.round(a.b * (1 - t) + b.b * t)); }

/* ---------- PNG encoder ---------- */
function chunk(typeStr, data) {
  const type = Buffer.from(typeStr, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([type, data])), 0);
  return Buffer.concat([len, type, data, crc]);
}

function encodePng(size, pixelBuffer) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.writeUInt8(8, 8);  // bit depth
  ihdr.writeUInt8(2, 9);  // color type RGB
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const stride = size * 3;
  const raw = Buffer.alloc(size * (1 + stride));
  for (let y = 0; y < size; y++) {
    const dst = y * (1 + stride);
    raw[dst] = 0;
    pixelBuffer.copy(raw, dst + 1, y * stride, (y + 1) * stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function makeCanvas(size) {
  const buf = Buffer.alloc(size * size * 3);
  return {
    size,
    buf,
    set(x, y, c) {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      const i = (Math.floor(y) * size + Math.floor(x)) * 3;
      buf[i] = c.r;
      buf[i + 1] = c.g;
      buf[i + 2] = c.b;
    },
    fill(c) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          this.set(x, y, c);
        }
      }
    },
  };
}

function distance(x, y, cx, cy) {
  const dx = x - cx, dy = y - cy;
  return Math.sqrt(dx * dx + dy * dy);
}

/* ---------- Drawing ---------- */

function drawPitch(canvas, cx, cy, halfW, halfH) {
  const left = cx - halfW;
  const right = cx + halfW;
  const top = cy - halfH;
  const bottom = cy + halfH;

  const lineThick = Math.max(2, Math.round(halfW * 0.04));
  const stripeBand = Math.max(4, Math.round(halfH / 6));

  // Pitch fill with horizontal mowed stripes for depth
  for (let y = top; y < bottom; y++) {
    if (y < 0 || y >= canvas.size) continue;
    const stripeIndex = Math.floor((y - top) / stripeBand);
    const base = stripeIndex % 2 === 0 ? PITCH_GREEN : PITCH_GREEN_DARK;
    for (let x = left; x < right; x++) {
      if (x < 0 || x >= canvas.size) continue;
      canvas.set(x, y, base);
    }
  }

  // Outer rectangle border
  drawRectStroke(canvas, left, top, right - left, bottom - top, lineThick, PITCH_LINE);

  // Halfway vertical line
  for (let y = top; y < bottom; y++) {
    for (let dx = 0; dx < lineThick; dx++) {
      canvas.set(cx - Math.floor(lineThick / 2) + dx, y, PITCH_LINE);
    }
  }

  // Center circle
  const circleR = Math.min(halfW, halfH) * 0.32;
  drawCircleStroke(canvas, cx, cy, circleR, lineThick, PITCH_LINE);

  // Center spot
  for (let y = cy - lineThick; y <= cy + lineThick; y++) {
    for (let x = cx - lineThick; x <= cx + lineThick; x++) {
      if (distance(x, y, cx, cy) <= lineThick * 0.6) canvas.set(x, y, PITCH_LINE);
    }
  }

  // Penalty boxes (left + right)
  const penWidth = halfW * 0.22;
  const penHeight = halfH * 1.0;
  // left penalty box
  drawRectStroke(canvas, left, cy - penHeight / 2, penWidth, penHeight, lineThick, PITCH_LINE);
  // right penalty box
  drawRectStroke(canvas, right - penWidth, cy - penHeight / 2, penWidth, penHeight, lineThick, PITCH_LINE);

  // Goal areas (smaller boxes inside the penalty boxes)
  const goalWidth = penWidth * 0.4;
  const goalHeight = penHeight * 0.5;
  drawRectStroke(canvas, left, cy - goalHeight / 2, goalWidth, goalHeight, lineThick, PITCH_LINE);
  drawRectStroke(canvas, right - goalWidth, cy - goalHeight / 2, goalWidth, goalHeight, lineThick, PITCH_LINE);
}

function drawRectStroke(canvas, x, y, w, h, t, color) {
  // top
  for (let yy = y; yy < y + t; yy++) {
    for (let xx = x; xx < x + w; xx++) canvas.set(xx, yy, color);
  }
  // bottom
  for (let yy = y + h - t; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) canvas.set(xx, yy, color);
  }
  // left
  for (let xx = x; xx < x + t; xx++) {
    for (let yy = y; yy < y + h; yy++) canvas.set(xx, yy, color);
  }
  // right
  for (let xx = x + w - t; xx < x + w; xx++) {
    for (let yy = y; yy < y + h; yy++) canvas.set(xx, yy, color);
  }
}

function drawCircleStroke(canvas, cx, cy, r, t, color) {
  const outer = r;
  const inner = r - t;
  for (let y = cy - outer - 1; y <= cy + outer + 1; y++) {
    for (let x = cx - outer - 1; x <= cx + outer + 1; x++) {
      const d = distance(x, y, cx, cy);
      if (d <= outer && d >= inner) canvas.set(x, y, color);
    }
  }
}

function drawBeer(canvas, x0, y0, w, h) {
  // Mug body (gold)
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const t = (x - x0) / w; // horizontal gradient
      const c = blend(BEER_GOLD, BEER_GOLD_DEEP, t * 0.7);
      canvas.set(x, y, c);
    }
  }

  // Foam crown on top
  const foamH = Math.max(2, Math.round(h * 0.18));
  for (let y = y0 - foamH; y < y0; y++) {
    for (let x = x0 - 1; x < x0 + w + 1; x++) {
      // Wavy top edge: dip every few pixels
      const wave = Math.sin((x - x0) * 1.3) * (foamH * 0.25);
      if (y > y0 - foamH + wave) {
        const t = (y - (y0 - foamH)) / foamH;
        canvas.set(x, y, blend(BEER_FOAM, BEER_FOAM_SHADE, t * 0.5));
      }
    }
  }

  // Handle (right side)
  const hxOuter = x0 + w + Math.max(1, Math.round(w * 0.25));
  const hyTop = y0 + Math.round(h * 0.20);
  const hyBottom = y0 + Math.round(h * 0.75);
  const hThick = Math.max(2, Math.round(w * 0.18));
  for (let y = hyTop; y <= hyBottom; y++) {
    // outer line of the handle
    for (let off = 0; off < hThick; off++) {
      canvas.set(hxOuter - off, y, BEER_GOLD);
    }
  }
  // Close top + bottom of the handle so it forms a ring
  for (let x = x0 + w; x <= hxOuter; x++) {
    for (let off = 0; off < hThick; off++) {
      canvas.set(x, hyTop + off, BEER_GOLD);
      canvas.set(x, hyBottom - off, BEER_GOLD);
    }
  }

  // Vertical highlight line on the mug body
  const lineX = x0 + Math.round(w * 0.7);
  for (let y = y0 + 2; y < y0 + h - 2; y++) {
    canvas.set(lineX, y, blend(GLASS_LINE, BEER_GOLD, 0.3));
  }
}

/* ---------- Compose icon ---------- */

function drawIcon(size, { maskable = false } = {}) {
  const canvas = makeCanvas(size);
  canvas.fill(BG);

  // Maskable: keep visuals in inner ~70% so Android's mask doesn't clip.
  const safe = maskable ? 0.34 : 0.42;

  // Pitch is shown in horizontal orientation, rounded to the brand center.
  const pitchHalfW = Math.round(size * safe);
  const pitchHalfH = Math.round(size * safe * 0.62);
  const cx = Math.round(size * 0.46);
  const cy = Math.round(size * 0.50);

  drawPitch(canvas, cx, cy, pitchHalfW, pitchHalfH);

  // Beer mug overlapping the bottom-right corner of the pitch.
  const mugW = Math.round(size * 0.22);
  const mugH = Math.round(size * 0.28);
  const mugX = Math.round(cx + pitchHalfW * 0.55 - mugW * 0.4);
  const mugY = Math.round(cy + pitchHalfH * 0.30);
  drawBeer(canvas, mugX, mugY, mugW, mugH);

  return canvas.buf;
}

const targets = [
  { name: "icon-192.png", size: 192, opts: {} },
  { name: "icon-512.png", size: 512, opts: {} },
  { name: "icon-512-maskable.png", size: 512, opts: { maskable: true } },
  { name: "apple-touch-icon.png", size: 180, opts: {} },
];

for (const t of targets) {
  const pixels = drawIcon(t.size, t.opts);
  const png = encodePng(t.size, pixels);
  const out = join(PUBLIC_DIR, t.name);
  writeFileSync(out, png);
  console.log(`✓ ${t.name} (${t.size}x${t.size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

console.log("Done.");

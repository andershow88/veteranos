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
const BG = rgb(0x07, 0x12, 0x0a);        // app background
const BG_RING = rgb(0x05, 0x96, 0x69);   // pitch-700 glow ring on bigger icons
const BALL_WHITE = rgb(0xf5, 0xfa, 0xf7);
const BALL_SHADE = rgb(0xc2, 0xcd, 0xc8);
const BALL_PATCH = rgb(0x0e, 0x18, 0x12);
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

function drawBall(canvas, cx, cy, r) {
  // Ball outline + interior shading
  for (let y = cy - r - 1; y <= cy + r + 1; y++) {
    for (let x = cx - r - 1; x <= cx + r + 1; x++) {
      const d = distance(x, y, cx, cy);
      if (d > r + 1) continue;

      // Soft anti-aliased edge
      if (d > r) {
        const t = Math.min(1, d - r);
        const base = blend(BALL_WHITE, BG, t);
        canvas.set(x, y, base);
        continue;
      }

      // Vertical light gradient inside the ball: bright top, slight shade bottom
      const t = Math.max(0, (y - (cy - r)) / (2 * r));
      const base = blend(BALL_WHITE, BALL_SHADE, t * 0.55);
      canvas.set(x, y, base);
    }
  }

  // Pentagonal patches placed in a classic football arrangement.
  const patches = [
    { cx, cy: cy - r * 0.55, rr: r * 0.20 },
    { cx: cx - r * 0.55, cy: cy - r * 0.05, rr: r * 0.16 },
    { cx: cx + r * 0.55, cy: cy - r * 0.05, rr: r * 0.16 },
    { cx: cx - r * 0.28, cy: cy + r * 0.45, rr: r * 0.16 },
    { cx: cx + r * 0.28, cy: cy + r * 0.45, rr: r * 0.16 },
  ];

  for (const p of patches) {
    // 5-sided pentagon-ish shape, scaled to radius
    drawPentagon(canvas, p.cx, p.cy, p.rr, BALL_PATCH);
  }

  // Black seams connecting the patches and edge — short lines
  drawSeam(canvas, patches[0], patches[1], r * 0.04);
  drawSeam(canvas, patches[0], patches[2], r * 0.04);
  drawSeam(canvas, patches[1], patches[3], r * 0.04);
  drawSeam(canvas, patches[2], patches[4], r * 0.04);
  drawSeam(canvas, patches[3], patches[4], r * 0.04);
}

function drawPentagon(canvas, cx, cy, r, color) {
  // Approximate pentagon by rasterizing pixels inside it.
  // Build 5 vertices (top vertex pointing up), then fill via point-in-polygon.
  const verts = [];
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + i * (2 * Math.PI / 5);
    verts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }

  // Bounding box
  const minX = Math.floor(Math.min(...verts.map(v => v.x)));
  const maxX = Math.ceil(Math.max(...verts.map(v => v.x)));
  const minY = Math.floor(Math.min(...verts.map(v => v.y)));
  const maxY = Math.ceil(Math.max(...verts.map(v => v.y)));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInPolygon(x + 0.5, y + 0.5, verts)) {
        canvas.set(x, y, color);
      }
    }
  }
}

function pointInPolygon(px, py, verts) {
  let inside = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const a = verts[i], b = verts[j];
    const intersect =
      (a.y > py) !== (b.y > py) &&
      px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

function drawSeam(canvas, a, b, w) {
  const dx = b.cx - a.cx, dy = b.cy - a.cy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(len);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = a.cx + dx * t;
    const y = a.cy + dy * t;
    for (let oy = -w; oy <= w; oy += 0.5) {
      for (let ox = -w; ox <= w; ox += 0.5) {
        if (ox * ox + oy * oy <= w * w) {
          canvas.set(x + ox, y + oy, BALL_PATCH);
        }
      }
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

function drawGlow(canvas, cx, cy, rOuter, rInner) {
  // Soft ring glow behind the ball
  for (let y = cy - rOuter; y <= cy + rOuter; y++) {
    for (let x = cx - rOuter; x <= cx + rOuter; x++) {
      const d = distance(x, y, cx, cy);
      if (d <= rOuter && d >= rInner) {
        const t = (d - rInner) / (rOuter - rInner);
        canvas.set(x, y, blend(BG_RING, BG, t));
      }
    }
  }
}

/* ---------- Compose icon ---------- */

function drawIcon(size, { maskable = false } = {}) {
  const canvas = makeCanvas(size);
  canvas.fill(BG);

  // Maskable: keep visuals in inner ~70% so Android's mask doesn't clip.
  const safe = maskable ? 0.36 : 0.46;

  // Slight offset: ball sits a bit up and to the left so the beer mug fits
  // into the lower-right without clipping.
  const bx = size * 0.43;
  const by = size * 0.46;
  const ballR = size * safe;

  drawGlow(canvas, bx, by, ballR * 1.05, ballR * 0.98);
  drawBall(canvas, bx, by, ballR);

  // Beer mug: bottom-right of the ball, slightly overlapping.
  const mugW = Math.round(size * 0.22);
  const mugH = Math.round(size * 0.28);
  const mugX = Math.round(bx + ballR * 0.45 - mugW * 0.2);
  const mugY = Math.round(by + ballR * 0.30);
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

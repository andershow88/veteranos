#!/usr/bin/env node
/**
 * Builds placeholder PWA icons in /public:
 *   - icon-192.png        (192x192, any)
 *   - icon-512.png        (512x512, any)
 *   - icon-512-maskable.png (512x512, with safe-zone padding for maskable)
 *   - apple-touch-icon.png (180x180, iOS)
 *
 * No external deps. Uses node:zlib for crc32 + deflate. Replace the PNGs
 * with your real brand logo whenever you have one — the manifest already
 * references these filenames.
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

// Brand palette
const BG = { r: 0x07, g: 0x12, b: 0x0a };       // app background
const RING = { r: 0x05, g: 0x96, b: 0x69 };     // pitch-700 (#059669)
const ACCENT = { r: 0xd2, g: 0xff, b: 0x5b };   // accent-2

function chunk(typeStr, data) {
  const type = Buffer.from(typeStr, "ascii");
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([type, data])), 0);
  return Buffer.concat([lengthBuf, type, data, crcBuf]);
}

function encodePng(width, height, pixelBuffer /* RGB */) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);    // bit depth
  ihdr.writeUInt8(2, 9);    // color type: RGB
  ihdr.writeUInt8(0, 10);   // compression
  ihdr.writeUInt8(0, 11);   // filter
  ihdr.writeUInt8(0, 12);   // interlace

  // Each scanline prefixed with filter byte 0 (None)
  const stride = width * 3;
  const raw = Buffer.alloc(height * (1 + stride));
  for (let y = 0; y < height; y++) {
    const dst = y * (1 + stride);
    raw[dst] = 0;
    pixelBuffer.copy(raw, dst + 1, y * stride, (y + 1) * stride);
  }

  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function fillPixels(size, paint /* (x, y) => {r,g,b} */) {
  const buf = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = paint(x, y);
      const i = (y * size + x) * 3;
      buf[i] = c.r;
      buf[i + 1] = c.g;
      buf[i + 2] = c.b;
    }
  }
  return buf;
}

function drawIcon(size, { maskable = false } = {}) {
  const cx = size / 2;
  const cy = size / 2;

  // Maskable: safe zone is the central 80% (Android crops ~10% per side).
  // Non-maskable: use bigger marks because there's no crop.
  const safe = maskable ? 0.4 : 0.5;
  const outerR = size * safe;
  const ringR = outerR * 0.95;
  const ringInner = outerR * 0.75;
  const dotR = outerR * 0.18;

  return fillPixels(size, (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);

    // Maskable corners must be fully covered by the icon, so fill the
    // entire image with the brand background when maskable.
    if (maskable) {
      if (d <= dotR) return ACCENT;
      if (d <= ringInner) return BG;
      if (d <= ringR) return RING;
      // Fade ring -> bg
      return BG;
    }

    if (d <= dotR) return ACCENT;
    if (d <= ringInner) return BG;
    if (d <= ringR) return RING;
    if (d <= outerR) return BG;

    // Outside the disc: transparent-ish look using pure BG
    return BG;
  });
}

const targets = [
  { name: "icon-192.png", size: 192, opts: {} },
  { name: "icon-512.png", size: 512, opts: {} },
  { name: "icon-512-maskable.png", size: 512, opts: { maskable: true } },
  { name: "apple-touch-icon.png", size: 180, opts: {} },
];

for (const t of targets) {
  const pixels = drawIcon(t.size, t.opts);
  const png = encodePng(t.size, t.size, pixels);
  const out = join(PUBLIC_DIR, t.name);
  writeFileSync(out, png);
  console.log(`✓ ${t.name} (${t.size}x${t.size}, ${(png.length / 1024).toFixed(1)} KB)`);
}

console.log("Done. Replace these PNGs with your real logo whenever you have one.");

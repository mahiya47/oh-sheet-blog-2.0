#!/usr/bin/env node
// Regenerates every static logo file from the single logo source in
// src/lib/logoMark.js. Run this ONE command any time you change the
// logo shape or colors there:
//
//   npm run icons
//
// It rewrites:
//   public/favicon.svg
//   public/icons/apple-touch-icon.png
//   public/icons/icon-192.png
//   public/icons/icon-512.png
//   public/icons/icon-maskable-192.png
//   public/icons/icon-maskable-512.png
//
// Nothing else needs to be touched by hand — no more removing and
// re-adding icon files one at a time.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { buildBadgeSVG, APP_ICON_COLOR } from "../src/lib/logoMark.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const iconsDir = join(publicDir, "icons");

async function writePng(svg, size, outPath) {
  const buf = await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(outPath, buf);
  console.log("wrote", outPath.replace(root + "/", ""));
}

async function main() {
  await mkdir(iconsDir, { recursive: true });

  // Live-matching favicon file (before JS swaps in the random badge
  // color) — badge circle + mark, transparent corners.
  const faviconSvg = buildBadgeSVG({ badge: APP_ICON_COLOR });
  await writeFile(join(publicDir, "favicon.svg"), faviconSvg);
  console.log("wrote", "public/favicon.svg");

  // Regular icons (manifest purpose "any" + apple-touch-icon) — badge
  // circle on a transparent square.
  await writePng(buildBadgeSVG({ badge: APP_ICON_COLOR }), 180, join(iconsDir, "apple-touch-icon.png"));
  await writePng(buildBadgeSVG({ badge: APP_ICON_COLOR }), 192, join(iconsDir, "icon-192.png"));
  await writePng(buildBadgeSVG({ badge: APP_ICON_COLOR }), 512, join(iconsDir, "icon-512.png"));

  // Maskable icons (manifest purpose "maskable") — color fills the
  // FULL square, no transparent corners, and the mark sits inside the
  // safe zone so the OS can crop to any shape without cutting it off.
  await writePng(
    buildBadgeSVG({ badge: APP_ICON_COLOR, fullBleed: true }),
    192,
    join(iconsDir, "icon-maskable-192.png"),
  );
  await writePng(
    buildBadgeSVG({ badge: APP_ICON_COLOR, fullBleed: true }),
    512,
    join(iconsDir, "icon-maskable-512.png"),
  );
}

main();

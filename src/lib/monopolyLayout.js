// ==========================================================
// Board geometry + colours for the Monopoly board — Hogwarts Edition.
//
// The board itself (names, prices, rents) comes from the SERVER — it
// arrives with the first `mono:state` push and is cached. This file only
// works out WHERE each of the 32 tiles sits in the SVG, which is pure
// geometry and never needs to agree with the server about anything.
//
// 32 tiles = 4 corners + 7 tiles per side. Anticlockwise layout: START
// at the bottom-right, Azkaban bottom-left, Platform 9¾ top-left, the
// Auction House top-right; corners sit at indexes 0 / 8 / 16 / 24.
// ==========================================================

export const BOARD_PX = 1320; // viewBox is BOARD_PX square
const CORNER = 180;
const SIDE_TILES = 7; // non-corner tiles between each pair of corners
const TILE = (BOARD_PX - CORNER * 2) / SIDE_TILES;
const DEPTH = 150; // how far a side tile reaches in from the edge
export const BAND = 36; // colour stripe thickness

// side: which edge the tile sits on — decides text rotation and which
// edge the colour band hugs.
function cornerAt(i, x, y) {
  return { i, x, y, w: CORNER, h: CORNER, side: "corner", cx: x + CORNER / 2, cy: y + CORNER / 2 };
}

function buildTiles() {
  const tiles = Array.from({ length: 32 });

  // START — bottom-right corner
  tiles[0] = cornerAt(0, BOARD_PX - CORNER, BOARD_PX - CORNER);
  // Bottom edge, running right to left
  for (let k = 1; k <= SIDE_TILES; k++) {
    const x = BOARD_PX - CORNER - k * TILE;
    const y = BOARD_PX - DEPTH;
    tiles[k] = { i: k, x, y, w: TILE, h: DEPTH, side: "bottom", cx: x + TILE / 2, cy: y + DEPTH / 2 };
  }
  // Azkaban — bottom-left corner
  tiles[8] = cornerAt(8, 0, BOARD_PX - CORNER);
  // Left edge, running bottom to top
  for (let k = 1; k <= SIDE_TILES; k++) {
    const x = 0;
    const y = BOARD_PX - CORNER - k * TILE;
    tiles[8 + k] = { i: 8 + k, x, y, w: DEPTH, h: TILE, side: "left", cx: x + DEPTH / 2, cy: y + TILE / 2 };
  }
  // Platform 9¾ — top-left corner
  tiles[16] = cornerAt(16, 0, 0);
  // Top edge, running left to right
  for (let k = 1; k <= SIDE_TILES; k++) {
    const x = CORNER + (k - 1) * TILE;
    const y = 0;
    tiles[16 + k] = { i: 16 + k, x, y, w: TILE, h: DEPTH, side: "top", cx: x + TILE / 2, cy: y + DEPTH / 2 };
  }
  // Auction House — top-right corner
  tiles[24] = cornerAt(24, BOARD_PX - CORNER, 0);
  // Right edge, running top to bottom
  for (let k = 1; k <= SIDE_TILES; k++) {
    const x = BOARD_PX - DEPTH;
    const y = CORNER + (k - 1) * TILE;
    tiles[24 + k] = { i: 24 + k, x, y, w: DEPTH, h: TILE, side: "right", cx: x + DEPTH / 2, cy: y + TILE / 2 };
  }

  return tiles;
}

export const TILES = buildTiles();

// The colour band sits on the inner edge of each tile (facing the middle
// of the board), like a real board.
export function bandRect(t) {
  switch (t.side) {
    case "bottom": return { x: t.x, y: t.y, w: t.w, h: BAND };
    case "top": return { x: t.x, y: t.y + t.h - BAND, w: t.w, h: BAND };
    case "left": return { x: t.x + t.w - BAND, y: t.y, w: BAND, h: t.h };
    case "right": return { x: t.x, y: t.y, w: BAND, h: t.h };
    default: return null;
  }
}

// A thin strip on the OUTER edge showing the owner's colour — readable
// even when the board is shrunk down on a phone.
export function ownerRect(t) {
  const s = 14;
  switch (t.side) {
    case "bottom": return { x: t.x, y: t.y + t.h - s, w: t.w, h: s };
    case "top": return { x: t.x, y: t.y, w: t.w, h: s };
    case "left": return { x: t.x, y: t.y, w: s, h: t.h };
    case "right": return { x: t.x + t.w - s, y: t.y, w: s, h: t.h };
    default: return null;
  }
}

// The usable part of a tile — everything the colour band doesn't take.
// All tile text is laid out horizontally inside this box: a real board
// rotates its text, but rotated (and, along the top edge, upside-down)
// labels are miserable to read on a screen.
export function contentBox(t) {
  switch (t.side) {
    case "bottom": return { x: t.x, y: t.y + BAND, w: t.w, h: t.h - BAND };
    case "top": return { x: t.x, y: t.y, w: t.w, h: t.h - BAND };
    case "left": return { x: t.x, y: t.y, w: t.w - BAND, h: t.h };
    case "right": return { x: t.x + BAND, y: t.y, w: t.w - BAND, h: t.h };
    default: return { x: t.x, y: t.y, w: t.w, h: t.h };
  }
}

// Greedy word wrap for tile names, which have roughly this many
// characters of room per line at the board's text size.
export function wrapName(name, perLine = 12, maxLines = 2) {
  const words = String(name).split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  let used = 0; // how many words actually made it onto the board

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= perLine || !line) {
      line = candidate;
      used++;
    } else {
      lines.push(line);
      if (lines.length === maxLines) { line = ""; break; }
      line = word;
      used++;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);

  // Two things can still need an ellipsis: a single word too long to fit
  // a line, and words that ran out of lines entirely.
  const clipped = lines.map((l) => (l.length > perLine ? `${l.slice(0, perLine - 1)}…` : l));
  if (used < words.length && clipped.length) {
    const last = clipped[clipped.length - 1];
    if (!last.endsWith("…")) {
      clipped[clipped.length - 1] =
        last.length >= perLine ? `${last.slice(0, perLine - 1)}…` : `${last}…`;
    }
  }
  return clipped;
}

export const GROUP_COLORS = {
  brown: "#8d6244",
  lightblue: "#8ccdf0",
  pink: "#ef8fb6",
  orange: "#f2973f",
  red: "#e5484d",
  yellow: "#f5c945",
  green: "#42ad7c",
  navy: "#2f5fd8",
};

// The 4 Hogwarts Houses stand in for utilities — each gets its own
// crest colour instead of a shared "utility" colour.
export const HOUSE_COLORS = {
  "Gryffindor Tower": "#7f0e0e",
  "Hufflepuff Basement": "#ecb939",
  "Ravenclaw Tower": "#222f5b",
  "Slytherin Dungeon": "#1a472a",
};

// Tokens sit over the colour band at the inner edge of a tile rather
// than dead centre, so they don't cover the name and price.
export function tokenAnchor(t) {
  switch (t.side) {
    case "bottom": return { x: t.cx, y: t.y + BAND / 2 + 2 };
    case "top": return { x: t.cx, y: t.y + t.h - BAND / 2 - 2 };
    case "left": return { x: t.x + t.w - BAND / 2 - 2, y: t.cy };
    case "right": return { x: t.x + BAND / 2 + 2, y: t.cy };
    // On a corner the icon and label take the top two-thirds, so tokens
    // sit in the space below them.
    default: return { x: t.cx, y: t.y + 142 };
  }
}

// Up to 4 tokens can share a tile — spread them along the tile's long
// axis instead of stacking into a blob.
export function tokenOffset(slot, total, side) {
  const perRow = Math.max(total, 1);
  const along = (slot - (perRow - 1) / 2) * 21;
  const vertical = side === "left" || side === "right";
  if (vertical) {
    return { dx: side === "left" ? -12 : 12, dy: along };
  }
  return { dx: along, dy: side === "top" ? 12 : -12 };
}

// ==========================================================
// Board geometry + colours for the Monopoly board — Hogwarts Edition.
//
// The board itself (names, prices, rents) comes from the SERVER — it
// arrives with the first `mono:state` push and is cached. This file only
// works out WHERE each of the 30 tiles sits in the SVG, which is pure
// geometry and never needs to agree with the server about anything.
//
// 30 tiles = 4 corners + 6 tiles on the top/bottom edges + 7 tiles on the
// left/right edges (the board is slightly wider than it is tall isn't
// the point — fewer tiles across the top/bottom just gives each one more
// room). Clockwise layout: START at the bottom-left, Azkaban top-left,
// the Community Chest corner top-right, the Auction House bottom-right;
// corners sit at indexes 0 / 8 / 15 / 23. Increasing index always walks
// clockwise: up the left side, across the top, down the right side,
// back along the bottom.
// ==========================================================

export const BOARD_PX = 1320; // viewBox is BOARD_PX square
const CORNER = 180;
const SIDE_TILES_V = 7; // non-corner tiles on the left/right (vertical) edges
const SIDE_TILES_H = 6; // non-corner tiles on the top/bottom (horizontal) edges
const TILE_V = (BOARD_PX - CORNER * 2) / SIDE_TILES_V; // left/right tile length
const TILE_H = (BOARD_PX - CORNER * 2) / SIDE_TILES_H; // top/bottom tile length — bigger, since there are fewer of them
const DEPTH = 168; // how far a side tile reaches in from the edge — bigger tiles all round, less padding
export const BAND = 36; // colour stripe thickness

// side: which edge the tile sits on — decides text rotation and which
// edge the colour band hugs.
function cornerAt(i, x, y) {
  return { i, x, y, w: CORNER, h: CORNER, side: "corner", cx: x + CORNER / 2, cy: y + CORNER / 2 };
}

function buildTiles() {
  const tiles = Array.from({ length: 30 });

  // START — bottom-left corner
  tiles[0] = cornerAt(0, 0, BOARD_PX - CORNER);
  // Left edge, running bottom to top — 7 tiles
  for (let k = 1; k <= SIDE_TILES_V; k++) {
    const x = 0;
    const y = BOARD_PX - CORNER - k * TILE_V;
    tiles[k] = { i: k, x, y, w: DEPTH, h: TILE_V, side: "left", cx: x + DEPTH / 2, cy: y + TILE_V / 2 };
  }
  // Azkaban — top-left corner
  tiles[8] = cornerAt(8, 0, 0);
  // Top edge, running left to right — 6 tiles
  for (let k = 1; k <= SIDE_TILES_H; k++) {
    const x = CORNER + (k - 1) * TILE_H;
    const y = 0;
    tiles[8 + k] = { i: 8 + k, x, y, w: TILE_H, h: DEPTH, side: "top", cx: x + TILE_H / 2, cy: y + DEPTH / 2 };
  }
  // Community Chest — top-right corner (was Platform 9¾, now just a card tile)
  tiles[15] = cornerAt(15, BOARD_PX - CORNER, 0);
  // Right edge, running top to bottom — 7 tiles
  for (let k = 1; k <= SIDE_TILES_V; k++) {
    const x = BOARD_PX - DEPTH;
    const y = CORNER + (k - 1) * TILE_V;
    tiles[15 + k] = { i: 15 + k, x, y, w: DEPTH, h: TILE_V, side: "right", cx: x + DEPTH / 2, cy: y + TILE_V / 2 };
  }
  // Auction House — bottom-right corner
  tiles[23] = cornerAt(23, BOARD_PX - CORNER, BOARD_PX - CORNER);
  // Bottom edge, running right to left — 6 tiles
  for (let k = 1; k <= SIDE_TILES_H; k++) {
    const x = BOARD_PX - CORNER - k * TILE_H;
    const y = BOARD_PX - DEPTH;
    tiles[23 + k] = { i: 23 + k, x, y, w: TILE_H, h: DEPTH, side: "bottom", cx: x + TILE_H / 2, cy: y + DEPTH / 2 };
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

// Kept clear of red / yellow / green / blue on purpose — those 4 are the
// player token colours (see TOKEN_COLORS in MonopolyPage.jsx), and a tile
// in the same colour as a token reads as confusing, not thematic. The
// group keys (still "red", "yellow", etc. — that's just internal naming
// carried over from the character groupings) map to these instead. Rich,
// saturated tones rather than muted ones — vibrant, just not primary.
export const GROUP_COLORS = {
  brown: "#8b5a2b",
  lightblue: "#9b6fd6", // vivid purple
  pink: "#ec5f98", // hot pink
  orange: "#f2851f",
  red: "#c2185b", // magenta/fuchsia
  yellow: "#b8752f", // amber/copper
  green: "#5b4a6f", // deep plum-grey
  navy: "#6b3a2a", // mahogany
};

// The 4 Hogwarts Houses stand in for utilities. Unlike the streets, all
// 4 share the SAME colour — an off-white — rather than each getting its
// own, so they read as a distinct "neutral" category on the board (and
// stay well clear of the red/yellow/green/blue token colours).
const HOUSE_COLOR = "#f6f3ea";
export const HOUSE_COLORS = {
  "Gryffindor Tower": HOUSE_COLOR,
  "Hufflepuff Basement": HOUSE_COLOR,
  "Ravenclaw Tower": HOUSE_COLOR,
  "Slytherin Dungeon": HOUSE_COLOR,
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
  // Bigger tokens (see MonopolyBoard.jsx) need more room between them —
  // some overlap onto the name is fine, they're the point of the board.
  const along = (slot - (perRow - 1) / 2) * 30;
  const vertical = side === "left" || side === "right";
  if (vertical) {
    return { dx: side === "left" ? -12 : 12, dy: along };
  }
  return { dx: along, dy: side === "top" ? 12 : -12 };
}

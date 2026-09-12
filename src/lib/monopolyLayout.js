// ==========================================================
// Board geometry + colours for the Monopoly board — Hogwarts Edition.
//
// The board itself (names, prices, rents) comes from the SERVER — it
// arrives with the first `mono:state` push and is cached. This file only
// works out WHERE each of the 30 tiles sits in the SVG, which is pure
// geometry and never needs to agree with the server about anything.
//
// 30 tiles = 4 corners + 6 tiles on the top/bottom edges + 7 tiles on the
// left/right edges (fewer tiles across the top/bottom just gives each one
// more room). The board is a portrait rectangle, not a square — see
// TALLER below. Clockwise layout: START at the bottom-left, Azkaban top-left,
// the Community Chest corner top-right, the Auction House bottom-right;
// corners sit at indexes 0 / 8 / 15 / 23. Increasing index always walks
// clockwise: up the left side, across the top, down the right side,
// back along the bottom.
// ==========================================================

// The board is NOT square: it's 20% taller than it is wide, to use the
// screen space that was going spare underneath it. Every vertical
// measurement below is the horizontal one times TALLER, so each tile —
// corners included — is 20% taller while staying the same width.
const TALLER = 1.2;

export const BOARD_PX = 1320; // viewBox width
export const BOARD_PY = BOARD_PX * TALLER; // viewBox height
const CORNER_W = 180;
const CORNER_H = CORNER_W * TALLER;
const SIDE_TILES_V = 7; // non-corner tiles on the left/right (vertical) edges
const SIDE_TILES_H = 6; // non-corner tiles on the top/bottom (horizontal) edges
const TILE_V = (BOARD_PY - CORNER_H * 2) / SIDE_TILES_V; // left/right tile length
const TILE_H = (BOARD_PX - CORNER_W * 2) / SIDE_TILES_H; // top/bottom tile length — bigger, since there are fewer of them
// How far a side tile reaches in from the edge. This is a WIDTH for the
// left/right tiles and a HEIGHT for the top/bottom ones, so only the
// second one grows.
const DEPTH_H = 168;
const DEPTH_V = DEPTH_H * TALLER;
export const BAND = 36; // colour stripe thickness — kept as-is, so the extra height all goes to the name

// side: which edge the tile sits on — decides text rotation and which
// edge the colour band hugs.
function cornerAt(i, x, y) {
  return { i, x, y, w: CORNER_W, h: CORNER_H, side: "corner", cx: x + CORNER_W / 2, cy: y + CORNER_H / 2 };
}

function buildTiles() {
  const tiles = Array.from({ length: 30 });

  // START — bottom-left corner
  tiles[0] = cornerAt(0, 0, BOARD_PY - CORNER_H);
  // Left edge, running bottom to top — 7 tiles
  for (let k = 1; k <= SIDE_TILES_V; k++) {
    const x = 0;
    const y = BOARD_PY - CORNER_H - k * TILE_V;
    tiles[k] = { i: k, x, y, w: DEPTH_H, h: TILE_V, side: "left", cx: x + DEPTH_H / 2, cy: y + TILE_V / 2 };
  }
  // Azkaban — top-left corner
  tiles[8] = cornerAt(8, 0, 0);
  // Top edge, running left to right — 6 tiles
  for (let k = 1; k <= SIDE_TILES_H; k++) {
    const x = CORNER_W + (k - 1) * TILE_H;
    const y = 0;
    tiles[8 + k] = { i: 8 + k, x, y, w: TILE_H, h: DEPTH_V, side: "top", cx: x + TILE_H / 2, cy: y + DEPTH_V / 2 };
  }
  // Community Chest — top-right corner (was Platform 9¾, now just a card tile)
  tiles[15] = cornerAt(15, BOARD_PX - CORNER_W, 0);
  // Right edge, running top to bottom — 7 tiles
  for (let k = 1; k <= SIDE_TILES_V; k++) {
    const x = BOARD_PX - DEPTH_H;
    const y = CORNER_H + (k - 1) * TILE_V;
    tiles[15 + k] = { i: 15 + k, x, y, w: DEPTH_H, h: TILE_V, side: "right", cx: x + DEPTH_H / 2, cy: y + TILE_V / 2 };
  }
  // Auction House — bottom-right corner
  tiles[23] = cornerAt(23, BOARD_PX - CORNER_W, BOARD_PY - CORNER_H);
  // Bottom edge, running right to left — 6 tiles
  for (let k = 1; k <= SIDE_TILES_H; k++) {
    const x = BOARD_PX - CORNER_W - k * TILE_H;
    const y = BOARD_PY - DEPTH_V;
    tiles[23 + k] = { i: 23 + k, x, y, w: TILE_H, h: DEPTH_V, side: "bottom", cx: x + TILE_H / 2, cy: y + DEPTH_V / 2 };
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
// Board order, going round from GO: brown, purple, pink, orange, then
// four pale shades. The board sits on a dark grey page now, so the back
// half of the board deliberately goes light — and none of the pale ones
// borrow a player's token colour (blue, red, green, yellow), so a tile
// can never be mistaken for someone's piece.
export const GROUP_COLORS = {
  brown: "#8b5a2b",
  lightblue: "#9b6fd6", // vivid purple
  pink: "#ec5f98", // hot pink
  orange: "#f2851f",
  red: "#e0cba4", // beige
  yellow: "#c9e8c2", // very light green
  green: "#bfdcf5", // very light blue
  navy: "#d9c6f2", // light lilac
};

// The 4 Hogwarts Houses stand in for utilities. Unlike the streets, all
// 4 share the SAME colour — a pale blush — rather than each getting its
// own, so they read as a distinct category on the board (and stay well
// clear of the red/yellow/green/blue token colours).
const HOUSE_COLOR = "#f2ccd4"; // pale blush — the last of the light shades
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
    // sit in the space below them. Kept as a fraction of the corner's own
    // height so it still lands correctly now corners are taller.
    default: return { x: t.cx, y: t.y + t.h * 0.79 };
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

import { useEffect, useRef, useState } from "react";
import {
  BOARD_PX,
  TILES,
  wrapName,
  tokenAnchor,
  GROUP_COLORS,
  HOUSE_COLORS,
  tokenOffset,
} from "../../lib/monopolyLayout.js";

const MAX_LEVEL = 3;

// A whole hop-across-the-board animation aims for about this long, however
// many tiles it has to cross — few tiles (a normal dice roll) means a slow,
// readable hop per tile; many tiles (a long card move) speeds up so it
// never drags. Never faster than MIN_HOP_MS or slower than MAX_HOP_MS.
const TOTAL_HOP_MS = 1950;
const MIN_HOP_MS = 120;
const MAX_HOP_MS = 340;

// Lighten a hex colour toward white — used for the unowned price band, a
// paler tint of the tile's group colour.
function tint(hex, amt = 0.55) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * amt);
  const toHex = (c) => c.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

// Pick black or white text for whatever colour a price band ends up —
// tinted group colour, or a player's own token colour once it's owned.
function contrastText(hex) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.substring(i, i + 2), 16) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.55 ? "#1c1810" : "#ffffff";
}

// The board itself: one SVG, so it stays crisp at any size and scales
// from a phone to a desktop without a second layout. Tiles are tappable —
// tapping one opens its title deed.
export default function MonopolyBoard({ board, game, mySeat, onTileClick, selected }) {
  const total = TILES.length;

  // Tokens hop tile-by-tile to their real position instead of teleporting.
  // `displayPos[seat]` is where a token is actually drawn right now;
  // `game.players[seat].pos` is where the server says it belongs. When
  // those disagree, step displayPos toward it one tile at a time.
  const [displayPos, setDisplayPos] = useState(() => game.players.map((p) => p.pos));
  const timersRef = useRef([]);
  const posKey = game.players.map((p) => p.pos).join(",");

  useEffect(() => {
    game.players.forEach((p, seat) => {
      const from = displayPos[seat];
      const to = p.pos;
      if (from === undefined) return;
      if (from === to) return;
      if (timersRef.current[seat]) clearInterval(timersRef.current[seat]);

      // Walk the shorter way around — except a short backward hop (like a
      // "go back 3 spaces" card) always animates backward even when the
      // long way forward would technically be shorter to wrap into.
      const fwd = (to - from + total) % total;
      const back = (from - to + total) % total;
      const goBack = back <= 5 && back < fwd;
      const steps = goBack ? back : fwd;
      const dir = goBack ? -1 : 1;
      const hopMs = Math.max(MIN_HOP_MS, Math.min(MAX_HOP_MS, Math.round(TOTAL_HOP_MS / steps)));

      let cur = from;
      let hop = 0;
      timersRef.current[seat] = setInterval(() => {
        hop += 1;
        cur = (cur + dir + total) % total;
        setDisplayPos((prev) => {
          const next = [...prev];
          next[seat] = cur;
          return next;
        });
        if (hop >= steps) {
          clearInterval(timersRef.current[seat]);
          timersRef.current[seat] = null;
        }
      }, hopMs);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posKey, total]);

  useEffect(
    () => () => timersRef.current.forEach((t) => t && clearInterval(t)),
    []
  );

  if (!board) return null;

  // Group tokens by tile so several players on one square lay out neatly —
  // by their animated position, not necessarily where they'll end up yet.
  const byTile = new Map();
  game.players.forEach((p, seat) => {
    if (p.bankrupt) return;
    const pos = displayPos[seat] ?? p.pos;
    if (!byTile.has(pos)) byTile.set(pos, []);
    byTile.get(pos).push(p);
  });

  return (
    <svg
      className="app-mono-board"
      viewBox={`0 0 ${BOARD_PX} ${BOARD_PX}`}
      role="img"
      aria-label="Monopoly board"
    >
      <rect x="0" y="0" width={BOARD_PX} height={BOARD_PX} rx="26" className="app-mono-felt" />

      {TILES.map((t) => {
        const tile = board[t.i];
        if (!tile) return null;
        const st = game.tiles[t.i];
        const owner = st?.owner ?? null;
        const owned = owner !== null;
        const ownerColor = owned ? game.players[owner]?.color : null;
        const isCorner = t.side === "corner";
        const bandColor = tile.group
          ? GROUP_COLORS[tile.group]
          : tile.type === "utility"
          ? HOUSE_COLORS[tile.name]
          : null;
        const level = st?.houses || 0;
        const rentNow = tile.rent ? tile.rent[level] : null;

        // Every tile is a two-tone card: a price/rent band on top (tinted
        // group colour while unowned, the owning player's own colour once
        // bought), and the group colour underneath it for the name.
        // Chance/Chest tiles have no group colour, so they stay a plain
        // single white card. Text is positioned against this same `t` rect
        // (via `box`/`topH` below) so it lines up with the split exactly.
        const box = t;
        const topH = t.h * 0.26;
        const topColor = bandColor ? (owned ? ownerColor : tint(bandColor)) : null;
        const priceTextColor = topColor ? contrastText(topColor) : null;
        // Computed per-tile rather than a fixed white — the Hogwarts House
        // tiles are a pale off-white background, so white text there would
        // vanish.
        const nameTextColor = bandColor ? contrastText(bandColor) : null;

        return (
          <g
            key={t.i}
            className={
              "app-mono-tile" +
              (selected === t.i ? " is-selected" : "") +
              (st?.mortgaged ? " is-mortgaged" : "")
            }
            onClick={() => onTileClick?.(t.i)}
          >
            {bandColor ? (
              <>
                <rect x={t.x} y={t.y} width={t.w} height={topH} fill={topColor} />
                <rect x={t.x} y={t.y + topH} width={t.w} height={t.h - topH} fill={bandColor} />
              </>
            ) : (
              <rect x={t.x} y={t.y} width={t.w} height={t.h} fill="#ffffff" />
            )}
            <rect x={t.x} y={t.y} width={t.w} height={t.h} className="app-mono-tile-outline" />

            {isCorner ? (
              <CornerLabel tile={tile} t={t} />
            ) : (
              <TileLabel
                tile={tile}
                box={box}
                topH={topH}
                mortgaged={!!st?.mortgaged}
                level={level}
                rentNow={rentNow}
                owned={owned}
                onColor={!!bandColor}
                priceTextColor={priceTextColor}
                nameTextColor={nameTextColor}
              />
            )}
          </g>
        );
      })}

      {/* The centre panel itself is an HTML overlay (see CenterPanel in
          MonopolyPage.jsx) positioned on top of this empty middle square —
          it needs real buttons and text wrapping, which is awkward inside
          SVG. Nothing is drawn here; the felt background already shows
          through underneath it. */}

      {/* Player tokens, drawn last so they sit on top of everything */}
      {[...byTile.entries()].map(([pos, occupants]) =>
        occupants.map((p, slot) => {
          const t = TILES[pos];
          if (!t) return null;
          const anchor = tokenAnchor(t);
          const { dx, dy } = tokenOffset(slot, occupants.length, t.side);
          return (
            <g
              key={p.seat}
              className={"app-mono-token" + (p.seat === mySeat ? " is-me" : "") + (p.connected ? "" : " is-away")}
              transform={`translate(${anchor.x + dx} ${anchor.y + dy})`}
            >
              <circle r="22" fill={p.color} />
              <text textAnchor="middle" y="6" className="app-mono-token-label">
                {p.seat + 1}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
}

// A side tile's contents. Streets and Hogwarts Houses (anything with a
// two-tone card background — see `onColor`) get the price/rent pinned in
// the top band and the name centred in the bottom band, matching the
// card split drawn behind them. Chance/Chest tiles have no band split, so
// they keep a simple centred icon + name. Font size scales down at
// narrow viewports via CSS (see .app-mono-tile-name) — the name is never
// hidden outright, so every tile stays identifiable on a phone.
function TileLabel({ tile, box, topH, mortgaged, level, rentNow, owned, onColor, priceTextColor, nameTextColor }) {
  const cx = box.x + box.w / 2;

  if (onColor) {
    const icon = tile.group ? null : tileIcon(tile); // Hogwarts Houses only
    // Once a street is owned, the price is swapped for its current rent —
    // not just once it's been upgraded. Utilities have no flat rent table
    // (theirs depends on the dice roll), so they keep showing price.
    const showRent = owned && tile.rent;
    let topText = showRent ? `$${rentNow}` : tile.price ? `$${tile.price}` : "";
    if (showRent && level > 0) topText += level >= MAX_LEVEL ? " · MAX" : ` · L${level}`;
    if (icon) topText = `${icon} ${topText}`;

    const lines = wrapName(tile.name, 9, 2);
    const LINE_H = 44;
    const nameZoneH = box.h - topH;
    const nameStackH = lines.length * LINE_H;
    const nameStartY = box.y + topH + Math.max(1, (nameZoneH - nameStackH) / 2);

    return (
      <g className="app-mono-tile-text">
        {topText && (
          <text
            className="app-mono-tile-price"
            style={{ fill: priceTextColor }}
            x={cx}
            y={box.y + topH / 2 + 6}
            textAnchor="middle"
          >
            {topText}
          </text>
        )}
        {lines.map((line, k) => (
          <text key={k} className="app-mono-tile-name" style={{ fill: nameTextColor }} x={cx} y={nameStartY + 17 + k * LINE_H} textAnchor="middle">
            {line}
          </text>
        ))}
        {mortgaged && (
          <text className="app-mono-mortgage-mark" x={cx} y={box.y + box.h - 5} textAnchor="middle">
            MORTGAGED
          </text>
        )}
      </g>
    );
  }

  // Chance / Community Chest — simple centred icon + name, no price band.
  const icon = tileIcon(tile);
  const lines = wrapName(tile.name, 9, 2);
  const LINE_H = 38;
  const ICON_H = icon ? 32 : 0;
  const stackH = ICON_H + lines.length * LINE_H;
  let y = box.y + (box.h - stackH) / 2;
  const parts = [];
  if (icon) {
    parts.push(
      <text key="icon" className="app-mono-tile-icon" x={cx} y={y + ICON_H / 2 + 8} textAnchor="middle">
        {icon}
      </text>
    );
    y += ICON_H;
  }
  lines.forEach((line, k) => {
    parts.push(
      <text key={`n${k}`} className="app-mono-tile-name" x={cx} y={y + 17 + k * LINE_H} textAnchor="middle">
        {line}
      </text>
    );
  });
  return <g className="app-mono-tile-text">{parts}</g>;
}

function CornerLabel({ tile, t }) {
  // Corner labels use the tile's own name (upper-cased) rather than a
  // fixed per-type label — a corner's name can change (START became
  // "Platform 9¾") or its type can become an ordinary card tile (the old
  // Platform corner is now just a Community Chest square).
  const lines = wrapName(tile.name.toUpperCase(), 10, 2);
  const startY = t.y + 100;
  return (
    <g>
      <text className="app-mono-corner-icon" x={t.cx} y={t.y + 52} textAnchor="middle">
        {tileIcon(tile)}
      </text>
      <g className="app-mono-tile-text">
        {lines.map((line, k) => (
          <text key={k} className="app-mono-corner-label" x={t.cx} y={startY + k * 22} textAnchor="middle">
            {line}
          </text>
        ))}
      </g>
    </g>
  );
}

// Each Hogwarts House gets its own crest emoji instead of a shared
// "utility" icon.
const HOUSE_ICONS = {
  "Gryffindor Tower": "🦁",
  "Hufflepuff Basement": "🦡",
  "Ravenclaw Tower": "🦅",
  "Slytherin Dungeon": "🐍",
};

function tileIcon(tile) {
  if (tile.type === "utility") return HOUSE_ICONS[tile.name] || "🏰";
  switch (tile.type) {
    case "go": return "🚉";
    case "jail": return "🏰";
    case "auction": return "🔨";
    case "chance": return "❓";
    case "chest": return "🎁";
    default: return "";
  }
}

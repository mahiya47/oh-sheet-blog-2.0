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
  if (!board) return null;

  // Group tokens by tile so several players on one square lay out neatly.
  const byTile = new Map();
  game.players.forEach((p) => {
    if (p.bankrupt) return;
    if (!byTile.has(p.pos)) byTile.set(p.pos, []);
    byTile.get(p.pos).push(p);
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
        const topH = t.h * 0.32;
        const topColor = bandColor ? (owned ? ownerColor : tint(bandColor)) : null;
        const priceTextColor = topColor ? contrastText(topColor) : null;

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
function TileLabel({ tile, box, topH, mortgaged, level, rentNow, owned, onColor, priceTextColor }) {
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

    const lines = wrapName(tile.name, 8, 2);
    const LINE_H = 24;
    const nameZoneH = box.h - topH;
    const nameStackH = lines.length * LINE_H;
    const nameStartY = box.y + topH + Math.max(4, (nameZoneH - nameStackH) / 2);

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
          <text key={k} className="app-mono-tile-name is-on-color" x={cx} y={nameStartY + 17 + k * LINE_H} textAnchor="middle">
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
  const lines = wrapName(tile.name, 8, 2);
  const LINE_H = 26;
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
  const lines = wrapName(cornerLabel(tile.type), 9, 2);
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
    case "go": return "✨";
    case "jail": return "🏰";
    case "platform": return "🚉";
    case "auction": return "🔨";
    case "chance": return "❓";
    case "chest": return "🎁";
    default: return "";
  }
}

function cornerLabel(type) {
  switch (type) {
    case "go": return "START";
    case "jail": return "AZKABAN";
    case "platform": return "PLATFORM 9¾";
    case "auction": return "AUCTION";
    default: return "";
  }
}

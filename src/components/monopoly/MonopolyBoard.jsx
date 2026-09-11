import {
  BOARD_PX,
  TILES,
  ownerRect,
  contentBox,
  wrapName,
  tokenAnchor,
  GROUP_COLORS,
  HOUSE_COLORS,
  tokenOffset,
} from "../../lib/monopolyLayout.js";

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
        const ownerColor = owner !== null ? game.players[owner]?.color : null;
        const own = ownerRect(t);
        const box = contentBox(t);
        const isCorner = t.side === "corner";
        const bandColor = tile.group
          ? GROUP_COLORS[tile.group]
          : tile.type === "utility"
          ? HOUSE_COLORS[tile.name]
          : null;
        const level = st?.houses || 0;
        const rentNow = tile.rent ? tile.rent[level] : null;
        const owned = owner !== null;

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
            <rect
              x={t.x}
              y={t.y}
              width={t.w}
              height={t.h}
              className="app-mono-tile-bg"
              style={bandColor ? { fill: bandColor } : undefined}
            />

            {ownerColor && own && (
              <rect x={own.x} y={own.y} width={own.w} height={own.h} fill={ownerColor} className="app-mono-owner" />
            )}

            {isCorner ? (
              <CornerLabel tile={tile} t={t} />
            ) : (
              <TileLabel
                tile={tile}
                box={box}
                mortgaged={!!st?.mortgaged}
                level={level}
                rentNow={rentNow}
                owned={owned}
                onColor={!!bandColor}
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
              <circle r="14" fill={p.color} />
              <text textAnchor="middle" y="5" className="app-mono-token-label">
                {p.seat + 1}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
}

// A side tile's contents — matching a classic "solid colour card" board:
// price (or, once upgraded, the current rent) sits at the top in a small
// bold line, and the name sits big and bold below it. Non-street tiles
// (Hogwarts Houses, Chance, Chest) get a small icon up top instead of a
// price. Text switches to white automatically when the tile itself is
// painted in its group colour (see `onColor`). Font size scales down at
// narrow viewports via CSS (see .app-mono-tile-name) — the name is never
// hidden outright, so every tile stays identifiable on a phone.
function TileLabel({ tile, box, mortgaged, level, rentNow, owned, onColor }) {
  const icon = tile.group ? null : tileIcon(tile);
  const cls = onColor ? " is-on-color" : "";
  // 8 characters is what actually fits across a tile at this larger text
  // size — more than that and names bleed into their neighbours.
  const lines = wrapName(tile.name, 8, 2);
  const LINE_H = 26;
  const ICON_H = icon ? 32 : 0;
  const PRICE_H = tile.price ? 24 : 0;
  const stackH = ICON_H + PRICE_H + lines.length * LINE_H;
  const cx = box.x + box.w / 2;
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
  if (tile.price) {
    // Once a street is owned, the price is swapped for its current rent —
    // not just once it's been upgraded. Utilities have no flat rent table
    // (theirs depends on the dice roll), so they keep showing price.
    const showRent = owned && tile.rent;
    parts.push(
      <text
        key="price"
        className={"app-mono-tile-price" + cls + (level > 0 ? " is-upgraded" : "")}
        x={cx}
        y={y + 15}
        textAnchor="middle"
      >
        {showRent ? `RENT $${rentNow}` : `$${tile.price}`}
      </text>
    );
    y += PRICE_H;
  }

  lines.forEach((line, k) => {
    parts.push(
      <text key={`n${k}`} className={"app-mono-tile-name" + cls} x={cx} y={y + 17 + k * LINE_H} textAnchor="middle">
        {line}
      </text>
    );
  });
  y += lines.length * LINE_H;
  if (level > 0) {
    parts.push(
      <text key="lvl" className={"app-mono-tile-level" + cls} x={cx} y={y + 15} textAnchor="middle">
        {level >= 5 ? "MAX LEVEL" : `LEVEL ${level}`}
      </text>
    );
  }
  if (mortgaged) {
    parts.push(
      <text key="mtg" className="app-mono-mortgage-mark" x={cx} y={box.y + box.h - 6} textAnchor="middle">
        MORTGAGED
      </text>
    );
  }
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

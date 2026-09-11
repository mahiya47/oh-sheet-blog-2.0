import {
  BOARD_PX,
  TILES,
  bandRect,
  ownerRect,
  contentBox,
  wrapName,
  tokenAnchor,
  GROUP_COLORS,
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
        const band = bandRect(t);
        const own = ownerRect(t);
        const box = contentBox(t);
        const isCorner = t.side === "corner";
        const groupColor = tile.group ? GROUP_COLORS[tile.group] : null;

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
            <rect x={t.x} y={t.y} width={t.w} height={t.h} className="app-mono-tile-bg" />

            {groupColor && band && (
              <rect x={band.x} y={band.y} width={band.w} height={band.h} fill={groupColor} className="app-mono-band" />
            )}

            {ownerColor && own && (
              <rect x={own.x} y={own.y} width={own.w} height={own.h} fill={ownerColor} className="app-mono-owner" />
            )}

            {isCorner ? (
              <CornerLabel tile={tile} t={t} />
            ) : (
              <TileLabel tile={tile} box={box} mortgaged={!!st?.mortgaged} />
            )}

            {/* Houses / hotel */}
            {st?.houses > 0 && band && <Buildings tile={t} band={band} houses={st.houses} />}
          </g>
        );
      })}

      {/* Centre panel — the brand mark, plus the dice when they've been rolled */}
      <g className="app-mono-center">
        <rect
          x={200}
          y={200}
          width={BOARD_PX - 400}
          height={BOARD_PX - 400}
          rx="20"
          className="app-mono-center-bg"
        />
        <text className="app-mono-center-title" x={BOARD_PX / 2} y={BOARD_PX / 2 - 60} textAnchor="middle">
          OH SHEET!
        </text>
        <text className="app-mono-center-sub" x={BOARD_PX / 2} y={BOARD_PX / 2 + 10} textAnchor="middle">
          MONOPOLY
        </text>
        {game.dice && (
          <g transform={`translate(${BOARD_PX / 2 - 130} ${BOARD_PX / 2 + 60})`}>
            <Die value={game.dice[0]} x={0} />
            <Die value={game.dice[1]} x={150} />
          </g>
        )}
      </g>

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

// A side tile's contents: an icon for the non-street squares, the name
// wrapped to fit, and the price. Everything is centred in the space the
// colour band leaves, and stays horizontal on all four sides. Font size
// scales down at narrow viewports via CSS (see .app-mono-tile-name) —
// the name is never hidden outright, so every tile stays identifiable
// on a phone.
function TileLabel({ tile, box, mortgaged }) {
  const icon = tile.group ? null : tileIcon(tile.type);
  // 10 characters is what actually fits across a tile at this text size —
  // more than that and names bleed into their neighbours.
  const lines = wrapName(tile.name, 10, 2);
  const LINE_H = 18;
  const ICON_H = icon ? 34 : 0;
  const PRICE_H = tile.price ? 20 : 0;
  const stackH = ICON_H + lines.length * LINE_H + PRICE_H;
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

  lines.forEach((line, k) => {
    parts.push(
      <text key={`n${k}`} className="app-mono-tile-name" x={cx} y={y + 14 + k * LINE_H} textAnchor="middle">
        {line}
      </text>
    );
  });
  y += lines.length * LINE_H;
  if (tile.price) {
    parts.push(
      <text key="price" className="app-mono-tile-price" x={cx} y={y + 15} textAnchor="middle">
        ${tile.price}
      </text>
    );
  }
  if (mortgaged) {
    parts.push(
      <text key="mtg" className="app-mono-mortgage-mark" x={cx} y={box.y + box.h - 5} textAnchor="middle">
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
        {tileIcon(tile.type)}
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

// Houses sit in a row along the colour band; a hotel replaces them.
function Buildings({ tile, band, houses }) {
  const horizontal = tile.side === "bottom" || tile.side === "top";
  const isHotel = houses === 5;
  const count = isHotel ? 1 : houses;
  const size = isHotel ? 26 : 17;
  const gap = isHotel ? 0 : 5;
  const span = count * size + (count - 1) * gap;

  return (
    <g className={isHotel ? "app-mono-hotel" : "app-mono-house"}>
      {Array.from({ length: count }, (_, k) => {
        const offset = -span / 2 + k * (size + gap);
        const cx = horizontal ? band.x + band.w / 2 + offset : band.x + band.w / 2;
        const cy = horizontal ? band.y + band.h / 2 : band.y + band.h / 2 + offset;
        return (
          <rect
            key={k}
            x={cx - size / 2}
            y={cy - size / 2}
            width={size}
            height={size}
            rx="3"
          />
        );
      })}
    </g>
  );
}

const PIPS = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

function Die({ value, x }) {
  const size = 110;
  const step = 28;
  return (
    <g transform={`translate(${x} 0)`} className="app-mono-die">
      <rect x="0" y="0" width={size} height={size} rx="18" />
      {(PIPS[value] || []).map(([px, py], k) => (
        <circle key={k} cx={size / 2 + px * step} cy={size / 2 + py * step} r="10" className="app-mono-pip" />
      ))}
    </g>
  );
}

function tileIcon(type) {
  switch (type) {
    case "go": return "→";
    case "jail": return "🔒";
    case "parking": return "🅿";
    case "gotojail": return "👮";
    case "chance": return "❓";
    case "chest": return "🎁";
    case "tax": return "💸";
    case "rail": return "🚄";
    case "utility": return "💡";
    default: return "";
  }
}

function cornerLabel(type) {
  switch (type) {
    case "go": return "GO";
    case "jail": return "JAIL";
    case "parking": return "FREE PARKING";
    case "gotojail": return "GO TO JAIL";
    default: return "";
  }
}

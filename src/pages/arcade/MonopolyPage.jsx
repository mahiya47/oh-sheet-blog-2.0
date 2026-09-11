import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MonopolyBoard from "../../components/monopoly/MonopolyBoard.jsx";
import MultiplayerHeader from "../../components/MultiplayerHeader.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getGameMeta } from "../../lib/arcadeGames.js";
import { GROUP_COLORS, HOUSE_COLORS } from "../../lib/monopolyLayout.js";
import { useMonopolyRoom } from "../../lib/useMonopolyRoom.js";

const GAME = getGameMeta("monopoly");
const JAIL_FINE = 50;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
// Seat order matches the 4 HUD corners: top-left, top-right, bottom-left,
// bottom-right — same order the server assigns TOKEN_COLORS in.
const TOKEN_COLORS = ["#3e9dd8", "#e5484d", "#4caf82", "#f5c945"];
const CORNER_CLASS = ["is-tl", "is-tr", "is-bl", "is-br"];

export default function MonopolyPage() {
  const { user, loading } = useAuth();
  const room = useMonopolyRoom();
  const { phase } = room;

  if (loading) return <div className="app-page"><p className="app-empty">Loading...</p></div>;

  if (!user) {
    return (
      <div className="app-page">
        <MultiplayerHeader title={GAME.label} emoji={GAME.emoji} subtitle="4 players" />
        <div className="app-arcade-board">
          <p className="app-empty">Log in to play Monopoly with your friends.</p>
          <Link to="/login" className="app-arcade-btn">Log in</Link>
        </div>
      </div>
    );
  }

  if (phase === "playing" && room.game) return <GameView room={room} />;
  if (phase === "lobby") return <LobbyView room={room} />;
  return <MenuView room={room} />;
}

// ---------------------------------------------------------------
// Create / join
// ---------------------------------------------------------------
function MenuView({ room }) {
  const [joinCode, setJoinCode] = useState("");
  const resuming = room.phase === "resuming";

  return (
    <div className="app-page">
      <MultiplayerHeader title={GAME.label} emoji={GAME.emoji} subtitle="2-4 players · online" />
      <div className="app-mono-menu">
        <p className="app-mono-menu-blurb">
          Buy up the wizarding world, charge rent, and bankrupt everyone
          else. 2 to 4 players a game. Start a room and share the code,
          or join a friend's.
        </p>

        {!room.connected && (
          <p className="app-mono-offline">Connecting to the game server...</p>
        )}
        {room.error && <p className="app-auth-error">{room.error}</p>}

        <button
          type="button"
          className="app-arcade-btn app-mono-primary"
          onClick={room.createRoom}
          disabled={room.busy || resuming}
        >
          {resuming ? "Reconnecting..." : "Start a new game"}
        </button>

        <div className="app-mono-or"><span>or join with a code</span></div>

        <form
          className="app-mono-join"
          onSubmit={(e) => {
            e.preventDefault();
            room.joinRoom(joinCode);
          }}
        >
          <input
            className="app-mono-code-input"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 5))}
            placeholder="ABC12"
            maxLength={5}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck="false"
            aria-label="Room code"
          />
          <button type="submit" className="app-arcade-btn" disabled={room.busy}>Join</button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Waiting room
// ---------------------------------------------------------------
function LobbyView({ room }) {
  const { lobby, code, isHost } = room;
  const [copied, setCopied] = useState(false);

  function copyCode() {
    if (navigator.clipboard) navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const count = lobby?.players.length || 0;
  const need = MIN_PLAYERS - count;

  return (
    <div className="app-page">
      <MultiplayerHeader title={GAME.label} emoji={GAME.emoji} subtitle="Waiting room" />
      <div className="app-mono-lobby">
        <p className="app-mono-lobby-label">Room code</p>
        <button type="button" className="app-mono-code-display" onClick={copyCode}>
          {code}
          <span className="app-mono-code-copy">{copied ? "Copied!" : "Tap to copy"}</span>
        </button>
        <p className="app-mono-lobby-hint">Share this code — friends join from the Monopoly page. 2 to 4 players.</p>

        <div className="app-mono-seat-list">
          {lobby?.players.map((p, seat) => (
            <div key={p.userId} className="app-mono-seat">
              <span className="app-mono-seat-dot" style={{ background: TOKEN_COLORS[seat] }}>{seat + 1}</span>
              <span className="app-mono-seat-name">{p.name || p.username}</span>
              {p.userId === lobby.hostUserId && <span className="app-mono-seat-host">Host</span>}
            </div>
          ))}
          {Array.from({ length: Math.max(0, (lobby?.max || MAX_PLAYERS) - count) }, (_, k) => (
            <div key={`empty-${k}`} className="app-mono-seat is-empty">
              <span className="app-mono-seat-dot" />
              <span className="app-mono-seat-name">Waiting for a player...</span>
            </div>
          ))}
        </div>

        <div className="app-mp-actions">
          {isHost ? (
            <button
              type="button"
              className="app-arcade-btn app-mono-primary"
              onClick={room.startGame}
              disabled={count < MIN_PLAYERS}
            >
              {count < MIN_PLAYERS
                ? `Need ${need} more player${need > 1 ? "s" : ""}`
                : `Start game (${count}/${MAX_PLAYERS})`}
            </button>
          ) : (
            <p className="app-empty">Waiting for the host to start...</p>
          )}
          <button type="button" className="app-arcade-btn app-mp-leave" onClick={room.leaveRoom}>Leave</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// The game
// ---------------------------------------------------------------
function GameView({ room }) {
  const { game, players, board, mySeat, act } = room;
  const [selected, setSelected] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const logRef = useRef(null);

  const me = mySeat >= 0 ? game.players[mySeat] : null;
  const myTurn = me && game.turn === mySeat && game.phase !== "over";
  const current = game.players[game.turn];
  const currentName = players[game.turn]?.name || players[game.turn]?.username || `Seat ${game.turn + 1}`;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [game.log, showLog]);

  // Net worth = cash + face value of everything owned (unmortgaged
  // discount ignored — this is a display estimate, not a game figure).
  const netWorths = useMemo(() => {
    if (!board) return [];
    return game.players.map((p) => {
      let total = p.cash;
      for (const [idxStr, st] of Object.entries(game.tiles)) {
        if (st.owner !== p.seat) continue;
        total += board[Number(idxStr)]?.price || 0;
      }
      return total;
    });
  }, [game.players, game.tiles, board]);

  // Everything the current player owns, grouped for the manage panel.
  const myProperties = useMemo(() => {
    if (!board || mySeat < 0) return [];
    return Object.entries(game.tiles)
      .filter(([, st]) => st.owner === mySeat)
      .map(([i, st]) => ({ index: Number(i), tile: board[Number(i)], st }))
      .sort((a, b) => a.index - b.index);
  }, [game.tiles, board, mySeat]);

  const debt = game.phase === "debt" && myTurn ? game.pending : null;
  const buying = game.phase === "buy" && myTurn ? board[game.pending?.index] : null;

  return (
    <div className="app-page app-mono-page">
      <MultiplayerHeader
        title={GAME.label}
        emoji={GAME.emoji}
        subtitle={game.phase === "over" ? "Game over" : `${currentName}'s turn`}
      />

      <div className="app-mono-arena">
        {game.players.map((p, seat) => (
          <PlayerCorner
            key={seat}
            seat={seat}
            player={p}
            info={players[seat] || {}}
            netWorth={netWorths[seat] || 0}
            isMe={seat === mySeat}
            isTurn={game.turn === seat && game.phase !== "over"}
            cornerClass={CORNER_CLASS[seat] || "is-tl"}
          />
        ))}

        <div className="app-mono-board-wrap">
          <MonopolyBoard
            board={board}
            game={game}
            mySeat={mySeat}
            selected={selected}
            onTileClick={setSelected}
          />

          {/* Drawn cards, and a quick flash of the latest event, land right
              over the board's centre — like a live event popup. */}
          {game.card && myTurn ? (
            <div className="app-mono-card-pop">
              <span className="app-mono-card-kind">
                {game.card.deck === "chance" ? "❓ Chance" : "🎁 Community Chest"}
              </span>
              <p>{game.card.text}</p>
            </div>
          ) : (
            <EventBubble log={game.log} />
          )}
        </div>
      </div>

      <div className="app-mono-hud-bottom">
        {me && (
          <div className="app-mono-you" style={{ borderColor: me.color }}>
            <span className="app-mono-you-dot" style={{ background: me.color }}>{mySeat + 1}</span>
            <span className="app-mono-you-cash">${me.cash}</span>
            {me.jailTurns >= 0 && <span className="app-mono-tag">In Azkaban</span>}
            {me.getOut > 0 && <span className="app-mono-tag">🔑 {me.getOut}</span>}
            {me.bankrupt && <span className="app-mono-tag is-bad">Bankrupt</span>}
          </div>
        )}

        <ActionPanel
          game={game}
          me={me}
          myTurn={myTurn}
          buying={buying}
          debt={debt}
          act={act}
          currentName={currentName}
          currentConnected={current?.connected !== false}
        />

        {myProperties.length > 0 && (
          <ManagePanel
            properties={myProperties}
            game={game}
            board={board}
            mySeat={mySeat}
            act={act}
            canManage={myTurn && ["action", "debt"].includes(game.phase)}
            onSelect={setSelected}
          />
        )}

        <div className="app-mono-tabs">
          <button type="button" className="app-mono-tab" onClick={() => setShowLog((v) => !v)}>
            {showLog ? "Hide history" : "Show history"}
          </button>
          <button type="button" className="app-arcade-btn app-mp-leave" onClick={room.leaveRoom}>
            Leave game
          </button>
        </div>

        {showLog && (
          <div className="app-mono-log" ref={logRef}>
            {game.log.map((entry, k) => (
              <p key={k} className="app-mono-log-line">{entry.text}</p>
            ))}
          </div>
        )}
      </div>

      {buying && (
        <BuyPrompt tile={buying} me={me} onBuy={() => act("mono:buy")} onPass={() => act("mono:decline_buy")} />
      )}

      {!buying && selected !== null && board[selected] && (
        <TitleDeed
          tile={board[selected]}
          st={game.tiles[selected]}
          players={players}
          game={game}
          onClose={() => setSelected(null)}
        />
      )}

      {game.phase === "over" && (
        <div className="app-mono-over">
          <h3>{game.winner === mySeat ? "You win! 🎉" : `${players[game.winner]?.name || `Seat ${game.winner + 1}`} wins!`}</h3>
          <button type="button" className="app-arcade-btn" onClick={room.leaveRoom}>Back to arcade</button>
        </div>
      )}
    </div>
  );
}

// One player's status card, pinned to a corner of the arena — matches all
// 4 seats to the 4 corners of the board, same way the reference layout
// does it.
function PlayerCorner({ seat, player, info, netWorth, isMe, isTurn, cornerClass }) {
  return (
    <div className={"app-mono-corner " + cornerClass + (isTurn ? " is-turn" : "") + (player.bankrupt ? " is-out" : "")}>
      <div className="app-mono-corner-avatar" style={{ borderColor: player.color }}>
        {info.avatarUrl ? (
          <img src={info.avatarUrl} alt="" />
        ) : (
          <span className="app-mono-corner-avatar-fallback" style={{ background: player.color }} />
        )}
        {isTurn && <span className="app-mono-corner-ring" style={{ borderColor: player.color }} />}
      </div>
      <div className="app-mono-corner-info">
        <span className="app-mono-corner-name">
          {info.name || info.username || `Seat ${seat + 1}`}
          {isMe && " (you)"}
        </span>
        <span className="app-mono-corner-cash">
          {player.bankrupt ? "Bankrupt" : <>${player.cash} <em>(${netWorth})</em></>}
        </span>
      </div>
      {isTurn && isMe && <span className="app-mono-corner-pill">Your Turn</span>}
      {isTurn && !isMe && <span className="app-mono-corner-pill is-waiting">Playing…</span>}
      {!player.connected && !player.bankrupt && <span className="app-mono-tag">away</span>}
    </div>
  );
}

// A brief popup of the most recent thing that happened — rent paid, a
// salary collected, and so on — shown centred over the board the same
// way a drawn card is.
function EventBubble({ log }) {
  const [visible, setVisible] = useState(false);
  const last = log[log.length - 1];
  const lastText = last?.text;

  useEffect(() => {
    if (!lastText) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(t);
  }, [lastText]);

  if (!visible || !lastText) return null;
  const icon = /rolled|doubles/i.test(lastText) ? "🎲" : /wins|won|House Cup/i.test(lastText) ? "🏆" : "🏦";

  return (
    <div className="app-mono-event-pop">
      <span className="app-mono-event-icon">{icon}</span>
      <p>{lastText}</p>
    </div>
  );
}

// The unowned-property decision — buy it, or pass and leave it on the
// market. Shown as a centred card over everything, with the same
// price/rent/sell-price layout as the title deed.
function BuyPrompt({ tile, me, onBuy, onPass }) {
  const color = tile.group ? GROUP_COLORS[tile.group] : tile.type === "utility" ? HOUSE_COLORS[tile.name] : null;
  const rentText = tile.type === "utility" ? "4× dice" : tile.rent ? `$${tile.rent[0]}` : "—";
  const sellPrice = Math.floor((tile.price || 0) / 2);

  return (
    <div className="app-mono-deed-backdrop" role="presentation">
      <div className="app-mono-buy-card">
        <h4 className="app-mono-buy-title" style={{ color: color || "var(--app-accent)" }}>{tile.name}</h4>

        <div className="app-mono-buy-grid">
          <div><span>Price</span><strong>${tile.price}</strong></div>
          <div><span>Rent</span><strong>{rentText}</strong></div>
          <div><span>Sell Price</span><strong>${sellPrice}</strong></div>
        </div>

        <div className="app-mono-buy-icon">{buyIcon(tile)}</div>

        <div className="app-mono-buy-btns">
          <button type="button" className="app-mono-buy-pass" onClick={onPass}>PASS</button>
          <button type="button" className="app-mono-buy-buy" disabled={!me || me.cash < tile.price} onClick={onBuy}>BUY</button>
        </div>
      </div>
    </div>
  );
}

function buyIcon(tile) {
  if (tile.type === "utility") {
    if (tile.name === "Gryffindor Tower") return "🦁";
    if (tile.name === "Hufflepuff Basement") return "🦡";
    if (tile.name === "Ravenclaw Tower") return "🦅";
    if (tile.name === "Slytherin Dungeon") return "🐍";
  }
  return "🪄";
}

// The one place that turns "what phase is the game in" into buttons.
function ActionPanel({ game, me, myTurn, buying, debt, act, currentName, currentConnected }) {
  if (game.phase === "over") {
    return <div className="app-mono-actions"><p className="app-mono-prompt">Game over.</p></div>;
  }

  if (!myTurn) {
    return (
      <div className="app-mono-actions">
        <p className="app-mono-prompt">Waiting for {currentName}...</p>
        {!currentConnected && (
          <button type="button" className="app-arcade-btn" onClick={() => act("mono:force_skip")}>
            Skip disconnected player
          </button>
        )}
      </div>
    );
  }

  if (debt) {
    return (
      <div className="app-mono-actions is-urgent">
        <p className="app-mono-prompt">
          You owe ${debt.amount}. Downgrade properties or mortgage to cover it.
        </p>
        <button
          type="button"
          className="app-arcade-btn app-mono-primary"
          disabled={me.cash < debt.amount}
          onClick={() => act("mono:settle")}
        >
          Pay ${debt.amount}
        </button>
        <button type="button" className="app-arcade-btn app-mono-danger" onClick={() => act("mono:bankrupt")}>
          Declare bankruptcy
        </button>
      </div>
    );
  }

  if (buying) {
    return (
      <div className="app-mono-actions">
        <p className="app-mono-prompt">Deciding on {buying.name}...</p>
      </div>
    );
  }

  if (game.phase === "roll") {
    const inJail = me.jailTurns >= 0;
    return (
      <div className="app-mono-actions">
        <p className="app-mono-prompt">
          {inJail ? `You're in Azkaban (turn ${me.jailTurns + 1} of 3).` : "Your turn — roll the dice!"}
        </p>
        <button type="button" className="app-arcade-btn app-mono-primary" onClick={() => act("mono:roll")}>
          🎲 Roll
        </button>
        {inJail && (
          <>
            <button
              type="button"
              className="app-arcade-btn"
              disabled={me.cash < JAIL_FINE}
              onClick={() => act("mono:jail_pay")}
            >
              Pay ${JAIL_FINE} fine
            </button>
            {me.getOut > 0 && (
              <button type="button" className="app-arcade-btn" onClick={() => act("mono:jail_card")}>
                Use jail-free card
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="app-mono-actions">
      <p className="app-mono-prompt">
        {game.doubles > 0 ? "Doubles — you get another roll." : "Upgrade, mortgage, or end your turn."}
      </p>
      <button type="button" className="app-arcade-btn app-mono-primary" onClick={() => act("mono:end_turn")}>
        {game.doubles > 0 ? "Roll again" : "End turn"}
      </button>
    </div>
  );
}

// Your properties, with the upgrade/mortgage buttons that are legal
// right now. Upgrading a property doesn't draw a house on the board —
// it raises the tile's own displayed rent instead.
function ManagePanel({ properties, game, board, mySeat, act, canManage, onSelect }) {
  return (
    <div className="app-mono-manage">
      <h4 className="app-mono-manage-title">Your properties ({properties.length})</h4>
      <div className="app-mono-manage-list">
        {properties.map(({ index, tile, st }) => {
          const isStreet = tile.type === "street";
          const group = tile.group ? GROUP_COLORS[tile.group] : "#c8bda8";
          const fullGroup = isStreet && groupComplete(game, board, tile.group, mySeat);
          const rentNow = isStreet ? tile.rent[st.houses] : null;
          return (
            <div key={index} className={"app-mono-manage-row" + (st.mortgaged ? " is-mortgaged" : "")}>
              <span className="app-mono-manage-band" style={{ background: group }} />
              <button type="button" className="app-mono-manage-name" onClick={() => onSelect(index)}>
                {tile.name}
                {isStreet && st.houses > 0 && (
                  <span className="app-mono-manage-level">
                    Lv {st.houses} · ${rentNow} rent
                  </span>
                )}
                {st.mortgaged && <span className="app-mono-manage-flag">mortgaged</span>}
              </button>
              {canManage && (
                <span className="app-mono-manage-btns">
                  {isStreet && fullGroup && !st.mortgaged && st.houses < 5 && (
                    <button type="button" title={`Upgrade ($${tile.build})`} onClick={() => act("mono:build", { index })}>⬆</button>
                  )}
                  {isStreet && st.houses > 0 && (
                    <button type="button" title="Downgrade" onClick={() => act("mono:sell_house", { index })}>⬇</button>
                  )}
                  {!st.mortgaged && st.houses === 0 && (
                    <button type="button" title={`Mortgage (+$${Math.floor(tile.price / 2)})`} onClick={() => act("mono:mortgage", { index })}>💰</button>
                  )}
                  {st.mortgaged && (
                    <button type="button" title={`Unmortgage (−$${Math.ceil((tile.price / 2) * 1.1)})`} onClick={() => act("mono:unmortgage", { index })}>↩</button>
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Does this player hold every street in the colour group? Only used to
// show or hide the upgrade button — the server re-checks the real rule
// (including even-building and mortgages) before it lets anything happen.
function groupComplete(game, board, group, seat) {
  if (!board || !group) return false;
  return board
    .filter((t) => t.group === group)
    .every((t) => game.tiles[t.i]?.owner === seat);
}

// Tap any tile to see its full title deed.
function TitleDeed({ tile, st, players, game, onClose }) {
  const owner = st?.owner ?? null;
  const ownerName = owner !== null ? players[owner]?.name || players[owner]?.username || `Seat ${owner + 1}` : null;
  const color = tile.group ? GROUP_COLORS[tile.group] : tile.type === "utility" ? HOUSE_COLORS[tile.name] : null;

  return (
    <div className="app-mono-deed-backdrop" onClick={onClose} role="presentation">
      <div className="app-mono-deed" onClick={(e) => e.stopPropagation()}>
        <div className="app-mono-deed-head" style={{ background: color || "var(--app-bg-deep)" }}>
          <h4>{tile.name}</h4>
        </div>
        <div className="app-mono-deed-body">
          {tile.price ? <p className="app-mono-deed-price">Price ${tile.price}</p> : null}

          {tile.type === "street" && (
            <table className="app-mono-deed-rents">
              <tbody>
                <tr><td>Rent</td><td>${tile.rent[0]}</td></tr>
                <tr><td>With colour set</td><td>${tile.rent[0] * 2}</td></tr>
                <tr><td>Level 1</td><td>${tile.rent[1]}</td></tr>
                <tr><td>Level 2</td><td>${tile.rent[2]}</td></tr>
                <tr><td>Level 3</td><td>${tile.rent[3]}</td></tr>
                <tr><td>Level 4</td><td>${tile.rent[4]}</td></tr>
                <tr><td>Level 5 (max)</td><td>${tile.rent[5]}</td></tr>
                <tr className="app-mono-deed-sep"><td>Upgrade cost</td><td>${tile.build} each</td></tr>
                <tr><td>Mortgage value</td><td>${Math.floor(tile.price / 2)}</td></tr>
              </tbody>
            </table>
          )}

          {tile.type === "utility" && (
            <p className="app-mono-deed-note">
              A Hogwarts House. Rent is 4× the dice roll with one House owned, 10× if you own all 4.
            </p>
          )}

          {tile.type === "chance" && <p className="app-mono-deed-note">Draw a Chance card.</p>}
          {tile.type === "chest" && <p className="app-mono-deed-note">Draw a Community Chest card.</p>}
          {tile.type === "go" && <p className="app-mono-deed-note">Collect $200 as you pass.</p>}
          {tile.type === "jail" && <p className="app-mono-deed-note">Just visiting Azkaban — unless you were sent here.</p>}
          {tile.type === "platform" && <p className="app-mono-deed-note">Platform 9¾ — a safe rest stop. Nothing happens.</p>}
          {tile.type === "auction" && <p className="app-mono-deed-note">The Diagon Alley Auction House. Nothing happens.</p>}

          <p className="app-mono-deed-owner">
            {owner !== null ? (
              <>Owned by <strong style={{ color: game.players[owner]?.color }}>{ownerName}</strong>
                {tile.type === "street" && st.houses > 0 && ` · Level ${st.houses}${st.houses === 5 ? " (max)" : ""}`}
                {st.mortgaged && " · mortgaged"}
              </>
            ) : tile.price ? "Unowned" : ""}
          </p>
        </div>
        <button type="button" className="app-arcade-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MonopolyBoard from "../../components/monopoly/MonopolyBoard.jsx";
import MultiplayerHeader from "../../components/MultiplayerHeader.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { getGameMeta } from "../../lib/arcadeGames.js";
import { GROUP_COLORS } from "../../lib/monopolyLayout.js";
import { useMonopolyRoom } from "../../lib/useMonopolyRoom.js";

const GAME = getGameMeta("monopoly");
const JAIL_FINE = 50;

export default function MonopolyPage() {
  const { user, loading } = useAuth();
  const room = useMonopolyRoom();
  const { phase } = room;

  if (loading) return <div className="app-page"><p className="app-empty">Loading...</p></div>;

  if (!user) {
    return (
      <div className="app-page">
        <MultiplayerHeader title={GAME.label} emoji={GAME.emoji} subtitle="Up to 8 players" />
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
      <MultiplayerHeader title={GAME.label} emoji={GAME.emoji} subtitle="2-8 players · online" />
      <div className="app-mono-menu">
        <p className="app-mono-menu-blurb">
          Buy up the board, charge rent, and bankrupt everyone else. Start a
          game and share the code, or join a friend's room.
        </p>

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

  return (
    <div className="app-page">
      <MultiplayerHeader title={GAME.label} emoji={GAME.emoji} subtitle="Waiting room" />
      <div className="app-mono-lobby">
        <p className="app-mono-lobby-label">Room code</p>
        <button type="button" className="app-mono-code-display" onClick={copyCode}>
          {code}
          <span className="app-mono-code-copy">{copied ? "Copied!" : "Tap to copy"}</span>
        </button>
        <p className="app-mono-lobby-hint">Share this code — friends join from the Monopoly page.</p>

        <div className="app-mono-seat-list">
          {lobby?.players.map((p, seat) => (
            <div key={p.userId} className="app-mono-seat">
              <span className="app-mono-seat-dot" style={{ background: TOKEN_COLORS[seat] }}>{seat + 1}</span>
              <span className="app-mono-seat-name">{p.name || p.username}</span>
              {p.userId === lobby.hostUserId && <span className="app-mono-seat-host">Host</span>}
            </div>
          ))}
          {Array.from({ length: Math.max(0, (lobby?.max || 8) - count) }, (_, k) => (
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
              disabled={count < 2}
            >
              {count < 2 ? "Need 2+ players" : `Start game (${count})`}
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

const TOKEN_COLORS = [
  "#e5484d", "#3e9dd8", "#f5c945", "#4caf82",
  "#c46be0", "#f08a3c", "#2fbfa8", "#e06b9c",
];

// ---------------------------------------------------------------
// The game
// ---------------------------------------------------------------
function GameView({ room }) {
  const { game, players, board, mySeat, act } = room;
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("players"); // players | log
  const logRef = useRef(null);

  const me = mySeat >= 0 ? game.players[mySeat] : null;
  const myTurn = me && game.turn === mySeat && game.phase !== "over";
  const current = game.players[game.turn];
  const currentName = players[game.turn]?.name || players[game.turn]?.username || `Seat ${game.turn + 1}`;

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [game.log]);

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

      <div className="app-mono-layout">
        <div className="app-mono-board-wrap">
          <MonopolyBoard
            board={board}
            game={game}
            mySeat={mySeat}
            selected={selected}
            onTileClick={setSelected}
          />
        </div>

        <div className="app-mono-side">
          {/* Your money + status */}
          {me && (
            <div className="app-mono-you" style={{ borderColor: me.color }}>
              <span className="app-mono-you-dot" style={{ background: me.color }}>{mySeat + 1}</span>
              <span className="app-mono-you-cash">${me.cash}</span>
              {me.jailTurns >= 0 && <span className="app-mono-tag">In jail</span>}
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

          <div className="app-mono-tabs">
            <button
              type="button"
              className={"app-mono-tab" + (tab === "players" ? " is-active" : "")}
              onClick={() => setTab("players")}
            >
              Players
            </button>
            <button
              type="button"
              className={"app-mono-tab" + (tab === "log" ? " is-active" : "")}
              onClick={() => setTab("log")}
            >
              History
            </button>
          </div>

          {tab === "players" ? (
            <div className="app-mono-players">
              {game.players.map((p, seat) => {
                const info = players[seat] || {};
                const owned = Object.values(game.tiles).filter((st) => st.owner === seat).length;
                return (
                  <div
                    key={seat}
                    className={
                      "app-mono-player" +
                      (game.turn === seat && game.phase !== "over" ? " is-turn" : "") +
                      (p.bankrupt ? " is-out" : "")
                    }
                  >
                    <span className="app-mono-player-dot" style={{ background: p.color }}>{seat + 1}</span>
                    <span className="app-mono-player-name">
                      {info.name || info.username || `Seat ${seat + 1}`}
                      {seat === mySeat && " (you)"}
                    </span>
                    <span className="app-mono-player-meta">
                      {p.bankrupt ? "out" : `$${p.cash} · ${owned}`}
                    </span>
                    {!p.connected && !p.bankrupt && <span className="app-mono-tag">away</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="app-mono-log" ref={logRef}>
              {game.log.map((entry, k) => (
                <p key={k} className="app-mono-log-line">{entry.text}</p>
              ))}
            </div>
          )}

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

          <button type="button" className="app-arcade-btn app-mp-leave" onClick={room.leaveRoom}>
            Leave game
          </button>
        </div>
      </div>

      {/* A drawn card, shown until the player does something else */}
      {game.card && myTurn && (
        <div className="app-mono-card-pop">
          <span className="app-mono-card-kind">
            {game.card.deck === "chance" ? "❓ Chance" : "🎁 Community Chest"}
          </span>
          <p>{game.card.text}</p>
        </div>
      )}

      {selected !== null && board[selected] && (
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
          You owe ${debt.amount}. Sell buildings or mortgage property to cover it.
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
        <p className="app-mono-prompt">
          {buying.name} is unowned — buy it for ${buying.price}?
        </p>
        <button
          type="button"
          className="app-arcade-btn app-mono-primary"
          disabled={me.cash < buying.price}
          onClick={() => act("mono:buy")}
        >
          Buy ${buying.price}
        </button>
        <button type="button" className="app-arcade-btn" onClick={() => act("mono:decline_buy")}>
          Pass
        </button>
      </div>
    );
  }

  if (game.phase === "roll") {
    const inJail = me.jailTurns >= 0;
    return (
      <div className="app-mono-actions">
        <p className="app-mono-prompt">
          {inJail ? `You're in jail (turn ${me.jailTurns + 1} of 3).` : "Your turn — roll the dice!"}
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
        {game.doubles > 0 ? "Doubles — you get another roll." : "Build, mortgage, or end your turn."}
      </p>
      <button type="button" className="app-arcade-btn app-mono-primary" onClick={() => act("mono:end_turn")}>
        {game.doubles > 0 ? "Roll again" : "End turn"}
      </button>
    </div>
  );
}

// Your properties, with the build/mortgage buttons that are legal right now.
function ManagePanel({ properties, game, board, mySeat, act, canManage, onSelect }) {
  return (
    <div className="app-mono-manage">
      <h4 className="app-mono-manage-title">Your properties ({properties.length})</h4>
      <div className="app-mono-manage-list">
        {properties.map(({ index, tile, st }) => {
          const isStreet = tile.type === "street";
          const group = tile.group ? GROUP_COLORS[tile.group] : "#c8bda8";
          const fullGroup = isStreet && groupComplete(game, board, tile.group, mySeat);
          return (
            <div key={index} className={"app-mono-manage-row" + (st.mortgaged ? " is-mortgaged" : "")}>
              <span className="app-mono-manage-band" style={{ background: group }} />
              <button type="button" className="app-mono-manage-name" onClick={() => onSelect(index)}>
                {tile.name}
                {st.houses > 0 && (
                  <span className="app-mono-manage-houses">
                    {st.houses === 5 ? "🏨" : "🏠".repeat(st.houses)}
                  </span>
                )}
                {st.mortgaged && <span className="app-mono-manage-flag">mortgaged</span>}
              </button>
              {canManage && (
                <span className="app-mono-manage-btns">
                  {isStreet && fullGroup && !st.mortgaged && st.houses < 5 && (
                    <button type="button" title={`Build ($${tile.build})`} onClick={() => act("mono:build", { index })}>+🏠</button>
                  )}
                  {isStreet && st.houses > 0 && (
                    <button type="button" title="Sell building" onClick={() => act("mono:sell_house", { index })}>−🏠</button>
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
// show or hide the build button — the server re-checks the real rule
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
  const color = tile.group ? GROUP_COLORS[tile.group] : null;

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
                <tr><td>1 house</td><td>${tile.rent[1]}</td></tr>
                <tr><td>2 houses</td><td>${tile.rent[2]}</td></tr>
                <tr><td>3 houses</td><td>${tile.rent[3]}</td></tr>
                <tr><td>4 houses</td><td>${tile.rent[4]}</td></tr>
                <tr><td>Hotel</td><td>${tile.rent[5]}</td></tr>
                <tr className="app-mono-deed-sep"><td>House cost</td><td>${tile.build} each</td></tr>
                <tr><td>Mortgage value</td><td>${Math.floor(tile.price / 2)}</td></tr>
              </tbody>
            </table>
          )}

          {tile.type === "rail" && (
            <table className="app-mono-deed-rents">
              <tbody>
                <tr><td>1 railroad</td><td>$25</td></tr>
                <tr><td>2 railroads</td><td>$50</td></tr>
                <tr><td>3 railroads</td><td>$100</td></tr>
                <tr><td>4 railroads</td><td>$200</td></tr>
                <tr><td>Mortgage value</td><td>${Math.floor(tile.price / 2)}</td></tr>
              </tbody>
            </table>
          )}

          {tile.type === "utility" && (
            <p className="app-mono-deed-note">
              Rent is 4× the dice roll with one utility, 10× with both.
            </p>
          )}

          {tile.type === "tax" && <p className="app-mono-deed-note">Pay ${tile.amount}.</p>}
          {tile.type === "chance" && <p className="app-mono-deed-note">Draw a Chance card.</p>}
          {tile.type === "chest" && <p className="app-mono-deed-note">Draw a Community Chest card.</p>}
          {tile.type === "go" && <p className="app-mono-deed-note">Collect $200 as you pass.</p>}
          {tile.type === "jail" && <p className="app-mono-deed-note">Just visiting — unless you were sent here.</p>}
          {tile.type === "parking" && <p className="app-mono-deed-note">Free parking. Nothing happens.</p>}
          {tile.type === "gotojail" && <p className="app-mono-deed-note">Go straight to jail.</p>}

          <p className="app-mono-deed-owner">
            {owner !== null ? (
              <>Owned by <strong style={{ color: game.players[owner]?.color }}>{ownerName}</strong>
                {st.houses > 0 && ` · ${st.houses === 5 ? "hotel" : `${st.houses} house${st.houses > 1 ? "s" : ""}`}`}
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

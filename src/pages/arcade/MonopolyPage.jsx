import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import MonopolyBoard from "../../components/monopoly/MonopolyBoard.jsx";
import MultiplayerHeader from "../../components/MultiplayerHeader.jsx";
import NavIcon from "../../components/NavIcons.jsx";
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
const TOKEN_COLORS = ["#2f6fed", "#e5484d", "#43a047", "#f5c945"]; // blue, red, green, yellow
const CORNER_CLASS = ["is-tl", "is-tr", "is-bl", "is-br"];
const MAX_LEVEL = 3;

// Full names don't fit anywhere in this UI — corners, turn banners, the
// title deed — so every player-facing label uses first name only.
function firstName(full) {
  const s = String(full || "").trim();
  return s.split(/\s+/)[0] || s;
}

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
              <span className="app-mono-seat-name">{firstName(p.name || p.username)}</span>
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

  const me = mySeat >= 0 ? game.players[mySeat] : null;
  const myTurn = me && game.turn === mySeat && game.phase !== "over";
  const current = game.players[game.turn];
  const currentName = firstName(players[game.turn]?.name || players[game.turn]?.username || `Seat ${game.turn + 1}`);

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

  const debt = game.phase === "debt" && myTurn ? game.pending : null;
  const buying = game.phase === "buy" && myTurn ? board[game.pending?.index] : null;

  return (
    <div className="app-page app-mono-page">
      <MultiplayerHeader
        title={GAME.label}
        emoji={GAME.emoji}
        subtitle={game.phase === "over" ? "Game over" : `${currentName}'s turn`}
        action={
          <button type="button" className="app-mono-leave-btn" onClick={room.leaveRoom} aria-label="Leave game">
            <NavIcon name="logout" />
          </button>
        }
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

          {/* Every buy decision, property card, drawn card, and event
              message renders right here in the middle of the board —
              nothing floats over the rest of the screen any more. */}
          <div className="app-mono-center-panel">
            <CenterPanel
              game={game}
              me={me}
              myTurn={myTurn}
              players={players}
              board={board}
              mySeat={mySeat}
              act={act}
              selected={selected}
              onCloseSelected={() => setSelected(null)}
              buying={buying}
              debt={debt}
              currentName={currentName}
              currentConnected={current?.connected !== false}
            />
          </div>
        </div>
      </div>

      {game.phase === "over" &&
        createPortal(
          <div className="app-mono-over">
            <h3>
              {game.winner === mySeat
                ? "You win! 🎉"
                : `${firstName(players[game.winner]?.name || players[game.winner]?.username || `Seat ${game.winner + 1}`)} wins!`}
            </h3>
            <button type="button" className="app-arcade-btn" onClick={room.leaveRoom}>Back to arcade</button>
          </div>,
          document.body
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
          {firstName(info.name || info.username || `Seat ${seat + 1}`)}
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

// ---------------------------------------------------------------
// Centre panel — everything that used to be a floating popup now lives
// in this one box in the middle of the board. Only one thing shows at a
// time, picked in this order: a buy decision (yours), a tile you tapped,
// a card you drew, a debt you owe, a quick flash of the latest thing
// that happened (for everyone), and otherwise the roll / end-turn / wait
// state for the current turn.
// ---------------------------------------------------------------
function CenterPanel({
  game, me, myTurn, players, board, mySeat, act,
  selected, onCloseSelected,
  buying, debt,
  currentName, currentConnected,
}) {
  const [flash, setFlash] = useState(null);
  const lastLogText = game.log[game.log.length - 1]?.text;

  useEffect(() => {
    if (!lastLogText) return;
    setFlash(lastLogText);
    const t = setTimeout(() => setFlash(null), 3200);
    return () => clearTimeout(t);
  }, [lastLogText]);

  if (buying) {
    return <BuyCard tile={buying} me={me} onBuy={() => act("mono:buy")} onPass={() => act("mono:decline_buy")} />;
  }

  if (selected !== null && board[selected]) {
    return (
      <TileCard
        tile={board[selected]}
        st={game.tiles[selected]}
        players={players}
        game={game}
        board={board}
        mySeat={mySeat}
        act={act}
        canManage={myTurn && ["action", "debt"].includes(game.phase)}
        onClose={onCloseSelected}
      />
    );
  }

  // The server keeps `game.card` set until whoever drew it dismisses it —
  // it never times out on its own. Only they get the OK button; everyone
  // else just watches, with the card clearly labelled as that player's,
  // and it stays up for them too until that player taps OK. If that
  // player has disconnected, skip straight past this (see currentConnected
  // below) so the table isn't stuck staring at a card nobody can dismiss —
  // "Skip disconnected player" further down stays reachable instead.
  if (game.card && currentConnected) {
    const drawerSeat = game.card.seat;
    const isDrawer = mySeat === drawerSeat;
    const drawerName = firstName(players[drawerSeat]?.name || players[drawerSeat]?.username || `Seat ${drawerSeat + 1}`);
    return (
      <div className="app-mono-panel-msg">
        <span className="app-mono-panel-msg-kind">
          {game.card.deck === "chance" ? "❓ Chance" : "🎁 Community Chest"}
        </span>
        {game.dice && (
          <>
            <DiceRow dice={game.dice} />
            <p className="app-mono-panel-note">Rolled {game.dice[0]} + {game.dice[1]} = {game.dice[0] + game.dice[1]}</p>
          </>
        )}
        <p className="app-mono-panel-note">{isDrawer ? "You drew:" : `${drawerName} drew:`}</p>
        <p>{game.card.text}</p>
        {isDrawer ? (
          <button type="button" className="app-arcade-btn app-mono-primary" onClick={() => act("mono:card_ack")}>
            OK
          </button>
        ) : (
          <p className="app-mono-panel-note">Waiting for {drawerName} to continue…</p>
        )}
      </div>
    );
  }

  if (debt) {
    return (
      <div className="app-mono-panel-msg is-urgent">
        <p className="app-mono-panel-prompt">You owe ${debt.amount}. Downgrade or mortgage to cover it.</p>
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

  if (flash) {
    const icon = /rolled|doubles/i.test(flash) ? "🎲" : /wins|won|House Cup/i.test(flash) ? "🏆" : "🏦";
    return (
      <div className="app-mono-panel-msg is-flash">
        <span className="app-mono-panel-msg-kind">{icon}</span>
        <p>{flash}</p>
      </div>
    );
  }

  return (
    <DefaultCard
      game={game}
      me={me}
      myTurn={myTurn}
      mySeat={mySeat}
      players={players}
      act={act}
      currentName={currentName}
      currentConnected={currentConnected}
    />
  );
}

// The idle state of the centre panel — roll the dice, or watch someone
// else's turn. The roll button turns into the end-turn button once
// you've rolled, in the same spot.
function DefaultCard({ game, me, myTurn, mySeat, players, act, currentName, currentConnected }) {
  const dice = game.dice;

  if (game.phase === "over") {
    return (
      <div className="app-mono-panel-idle">
        <p className="app-mono-panel-prompt">Game over.</p>
      </div>
    );
  }

  // Anyone not currently rolling/acting spends that dead time on a
  // pending Jail vote, if there is one — it replaces the plain "waiting"
  // message since they have nothing else to do anyway. The current actor
  // never sees this in place of their own roll/end-turn buttons, so a
  // slow or absent voter can never block the game (see nextTurn's
  // resolveJailVote safety net on the server, too).
  if (!myTurn) {
    const jv = game.jailVote;
    if (jv) {
      return <JailVoteCard jv={jv} players={players} mySeat={mySeat} act={act} dice={dice} />;
    }
    return (
      <div className="app-mono-panel-idle">
        {dice && <DiceRow dice={dice} />}
        <p className="app-mono-panel-prompt">Waiting for {currentName}…</p>
        {!currentConnected && (
          <button type="button" className="app-arcade-btn" onClick={() => act("mono:force_skip")}>
            Skip disconnected player
          </button>
        )}
      </div>
    );
  }

  const inJail = me.jailTurns >= 0;

  if (game.phase === "roll") {
    return (
      <div className="app-mono-panel-idle">
        {dice && <DiceRow dice={dice} />}
        <p className="app-mono-panel-prompt">
          {inJail ? `In Azkaban — turn ${me.jailTurns + 1} of 3.` : "Your turn!"}
        </p>
        <button type="button" className="app-arcade-btn app-mono-primary app-mono-roll-btn" onClick={() => act("mono:roll")}>
          🎲 Roll
        </button>
        {inJail && (
          <div className="app-mono-panel-subrow">
            <button
              type="button"
              className="app-arcade-btn"
              disabled={me.cash < JAIL_FINE}
              onClick={() => act("mono:jail_pay")}
            >
              Pay ${JAIL_FINE}
            </button>
            {me.getOut > 0 && (
              <button type="button" className="app-arcade-btn" onClick={() => act("mono:jail_card")}>
                Use card
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // phase === "action" — debt is handled by CenterPanel before this ever
  // renders. Doubles means you got the same number on both dice, so you
  // roll again; the button rolls right away in one tap instead of just
  // handing back the plain roll button.
  return (
    <div className="app-mono-panel-idle">
      {dice && <DiceRow dice={dice} />}
      <p className="app-mono-panel-prompt">
        {game.doubles > 0 ? "You rolled the same number on both dice — one more turn!" : "Tap a property to manage it."}
      </p>
      {game.doubles > 0 ? (
        <button type="button" className="app-arcade-btn app-mono-primary app-mono-roll-btn" onClick={() => act("mono:roll")}>
          🎲 Roll again
        </button>
      ) : (
        <button type="button" className="app-arcade-btn app-mono-primary app-mono-roll-btn" onClick={() => act("mono:end_turn")}>
          End turn
        </button>
      )}
    </div>
  );
}

// Whoever isn't rolling votes on a table-mate stuck in Azkaban — free them
// early, or leave them to serve their time as normal. The jailed player
// sees their own status instead of a ballot; a voter who's already voted
// sees a "waiting on the table" note instead of the buttons again.
function JailVoteCard({ jv, players, mySeat, act, dice }) {
  const jailedName = firstName(players[jv.seat]?.name || players[jv.seat]?.username || `Seat ${jv.seat + 1}`);
  const freeCount = Object.values(jv.votes).filter((v) => v === "free").length;
  const keepCount = Object.values(jv.votes).filter((v) => v === "keep").length;
  const isJailed = mySeat === jv.seat;
  const hasVoted = jv.votes[mySeat] !== undefined;
  const canVote = !isJailed && jv.eligible.includes(mySeat) && !hasVoted;

  return (
    <div className="app-mono-panel-idle">
      {dice && <DiceRow dice={dice} />}
      <p className="app-mono-panel-prompt">
        {isJailed ? "The table is voting on whether to free you from Azkaban." : `Free ${jailedName} from Azkaban?`}
      </p>
      <p className="app-mono-jail-tally">🔓 {freeCount} to free · 🔒 {keepCount} to keep</p>
      {canVote && (
        <div className="app-mono-panel-subrow">
          <button type="button" className="app-arcade-btn app-mono-primary" onClick={() => act("mono:jail_vote", { choice: "free" })}>
            Free them
          </button>
          <button type="button" className="app-arcade-btn" onClick={() => act("mono:jail_vote", { choice: "keep" })}>
            Keep in Jail
          </button>
        </div>
      )}
      {!isJailed && hasVoted && <p className="app-mono-panel-note">You voted — waiting on the table.</p>}
    </div>
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

// A small plain-HTML pair of dice — sits inside the centre panel now,
// instead of drawn in the board's SVG.
function DiceRow({ dice }) {
  return (
    <div className="app-mono-dice-row">
      {dice.map((v, k) => (
        <div key={k} className="app-mono-die-html">
          {(PIPS[v] || []).map(([px, py], i) => (
            <span key={i} className="app-mono-pip-html" style={{ left: `${50 + px * 26}%`, top: `${50 + py * 26}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// The unowned-property decision — buy it, or pass and leave it on the
// market.
function BuyCard({ tile, me, onBuy, onPass }) {
  const color = tile.group ? GROUP_COLORS[tile.group] : tile.type === "utility" ? HOUSE_COLORS[tile.name] : null;
  const rentText = tile.type === "utility" ? "4× dice" : tile.rent ? `$${tile.rent[0]}` : "—";
  const sellPrice = Math.floor((tile.price || 0) / 2);

  return (
    <div className="app-mono-panel-buy">
      <h4 className="app-mono-buy-title" style={{ color: color || "var(--app-accent)" }}>{tile.name}</h4>
      <div className="app-mono-buy-icon">{buyIcon(tile)}</div>
      <div className="app-mono-buy-grid">
        <div><span>Price</span><strong>${tile.price}</strong></div>
        <div><span>Rent</span><strong>{rentText}</strong></div>
        <div><span>Sell</span><strong>${sellPrice}</strong></div>
      </div>
      <div className="app-mono-buy-btns">
        <button type="button" className="app-mono-buy-pass" onClick={onPass}>PASS</button>
        <button type="button" className="app-mono-buy-buy" disabled={!me || me.cash < tile.price} onClick={onBuy}>BUY</button>
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

// Does this player hold every street in the colour group? Only used to
// show or hide the upgrade button — the server re-checks the real rule
// (including even-building and mortgages) before it lets anything happen.
function groupComplete(game, board, group, seat) {
  if (!board || !group) return false;
  return board
    .filter((t) => t.group === group)
    .every((t) => game.tiles[t.i]?.owner === seat);
}

// Tap any tile to see its full title deed, right here in the centre
// panel. When it's one of your own properties and it's your turn, the
// upgrade/mortgage actions live right here too.
function TileCard({ tile, st, players, game, board, mySeat, act, canManage, onClose }) {
  const owner = st?.owner ?? null;
  const ownerName = owner !== null ? firstName(players[owner]?.name || players[owner]?.username || `Seat ${owner + 1}`) : null;
  const color = tile.group ? GROUP_COLORS[tile.group] : tile.type === "utility" ? HOUSE_COLORS[tile.name] : null;

  const isStreet = tile.type === "street";
  const mine = canManage && owner === mySeat;
  const fullGroup = mine && isStreet && groupComplete(game, board, tile.group, mySeat);
  const canUpgrade = mine && isStreet && fullGroup && !st.mortgaged && st.houses < MAX_LEVEL;
  const canDowngrade = mine && isStreet && st.houses > 0;
  const canMortgage = mine && !st.mortgaged && (!isStreet || st.houses === 0);
  const canUnmortgage = mine && st.mortgaged;

  return (
    <div className="app-mono-panel-tile">
      <button type="button" className="app-mono-panel-close" onClick={onClose} aria-label="Close">✕</button>
      <div className="app-mono-panel-tile-head" style={{ background: color || "var(--app-bg-deep)" }}>
        <h4>{tile.name}</h4>
      </div>
      <div className="app-mono-panel-tile-body">
        {tile.price ? <p className="app-mono-deed-price">Price ${tile.price}</p> : null}

        {isStreet && (
          <table className="app-mono-deed-rents">
            <tbody>
              <tr><td>Rent</td><td>${tile.rent[0]}</td></tr>
              <tr><td>With colour set</td><td>${tile.rent[0] * 2}</td></tr>
              <tr><td>Level 1 (${tile.build[0]} to build)</td><td>${tile.rent[1]}</td></tr>
              <tr><td>Level 2 (${tile.build[1]} to build)</td><td>${tile.rent[2]}</td></tr>
              <tr><td>Level 3 (${tile.build[2]} to build, max)</td><td>${tile.rent[3]}</td></tr>
              <tr className="app-mono-deed-sep"><td>Mortgage value</td><td>${Math.floor(tile.price / 2)}</td></tr>
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
        {tile.type === "auction" && <p className="app-mono-deed-note">The Diagon Alley Auction House. Nothing happens.</p>}

        <p className="app-mono-deed-owner">
          {owner !== null ? (
            <>Owned by <strong style={{ color: game.players[owner]?.color }}>{ownerName}</strong>
              {isStreet && st.houses > 0 && ` · Level ${st.houses}${st.houses === MAX_LEVEL ? " (max)" : ""}`}
              {st.mortgaged && " · mortgaged"}
            </>
          ) : tile.price ? "Unowned" : ""}
        </p>

        {(canUpgrade || canDowngrade || canMortgage || canUnmortgage) && (
          <div className="app-mono-deed-actions">
            {canUpgrade && (
              <button type="button" className="app-arcade-btn app-mono-primary" onClick={() => act("mono:build", { index: tile.i })}>
                Upgrade (${tile.build[st.houses]})
              </button>
            )}
            {canDowngrade && (
              <button type="button" className="app-arcade-btn" onClick={() => act("mono:sell_house", { index: tile.i })}>
                Downgrade
              </button>
            )}
            {canMortgage && (
              <button type="button" className="app-arcade-btn" onClick={() => act("mono:mortgage", { index: tile.i })}>
                Mortgage (+${Math.floor(tile.price / 2)})
              </button>
            )}
            {canUnmortgage && (
              <button type="button" className="app-arcade-btn" onClick={() => act("mono:unmortgage", { index: tile.i })}>
                Unmortgage (−${Math.ceil((tile.price / 2) * 1.1)})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

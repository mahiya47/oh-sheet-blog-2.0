import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGameSocket } from "../context/GameSocketContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Shared "get two people into a match" flow for every multiplayer arcade
// game. A game page just calls this and gets back which of four phases
// it's in — picker (pick a friend to challenge), waiting (sent, waiting on
// them), playing (both in, here's your seat/opponent), or the room having
// ended (opponent left / disconnected) — plus the actual game-move socket
// wiring is left to each page, since RPS/Tic-Tac-Toe/Snake & Ladder/Ludo
// all have completely different boards.
export function useChallengeFlow(gameSlug) {
  const { user } = useAuth();
  const { socket, sendChallenge, consumeAcceptedRoom } = useGameSocket();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomIdParam = searchParams.get("room");

  const [phase, setPhase] = useState(roomIdParam ? "loading" : "picker");
  const [roomId, setRoomId] = useState(roomIdParam || null);
  const [seat, setSeat] = useState(null);
  const [players, setPlayers] = useState(null);
  const [initialGame, setInitialGame] = useState(null);
  const [error, setError] = useState("");
  const consumedRef = useRef(false);

  // Arriving via /arcade/<slug>?room=<id> — either just accepted a
  // challenge, or just sent one and got redirected here once it was
  // accepted. Either way the accepted payload was already stashed by
  // GameSocketContext; pick it up. A hard refresh has nothing to recover
  // (rooms are in-memory only), so that just bounces back to the picker.
  useEffect(() => {
    if (!roomIdParam || consumedRef.current) return;
    consumedRef.current = true;
    const stashed = consumeAcceptedRoom(roomIdParam);
    if (stashed) {
      setSeat(stashed.seat);
      setPlayers(stashed.players);
      setInitialGame(stashed.game);
      setRoomId(roomIdParam);
      setPhase("playing");
    } else {
      setPhase("picker");
      setRoomId(null);
      navigate(`/arcade/${gameSlug}`, { replace: true });
    }
  }, [roomIdParam, consumeAcceptedRoom, navigate, gameSlug]);

  const challenge = useCallback(
    async (toUser) => {
      setError("");
      try {
        const res = await sendChallenge(toUser.id, gameSlug);
        setRoomId(res.roomId);
        setPlayers([res.you, toUser]);
        setPhase("waiting");
      } catch (err) {
        setError(err.message || "Couldn't send that challenge.");
      }
    },
    [sendChallenge, gameSlug],
  );

  // While waiting for the invite to be answered.
  useEffect(() => {
    if (phase !== "waiting" || !roomId) return;

    function onAccepted(payload) {
      if (payload.roomId !== roomId) return;
      setSeat(payload.seat);
      setPlayers(payload.players);
      setInitialGame(payload.game);
      setPhase("playing");
      navigate(`/arcade/${gameSlug}?room=${roomId}`, { replace: true });
    }
    function onDeclined(payload) {
      if (payload.roomId !== roomId) return;
      setError("They declined the challenge.");
      setPhase("picker");
      setRoomId(null);
    }
    function onExpired(payload) {
      if (payload.roomId !== roomId) return;
      setError("They didn't respond in time.");
      setPhase("picker");
      setRoomId(null);
    }

    socket.on("challenge:accepted", onAccepted);
    socket.on("challenge:declined", onDeclined);
    socket.on("challenge:expired", onExpired);
    return () => {
      socket.off("challenge:accepted", onAccepted);
      socket.off("challenge:declined", onDeclined);
      socket.off("challenge:expired", onExpired);
    };
  }, [phase, roomId, socket, navigate, gameSlug]);

  // While actually playing — the one event common to every game: the
  // other side leaving (on purpose or by disconnecting).
  useEffect(() => {
    if (phase !== "playing" || !roomId) return;
    function onOpponentLeft() {
      setPhase("ended");
    }
    socket.on("game:opponent_left", onOpponentLeft);
    return () => socket.off("game:opponent_left", onOpponentLeft);
  }, [phase, roomId, socket]);

  const cancelWaiting = useCallback(() => {
    if (roomId) socket.emit("challenge:cancel", { roomId });
    setPhase("picker");
    setRoomId(null);
    setPlayers(null);
  }, [roomId, socket]);

  const leaveGame = useCallback(() => {
    if (roomId) socket.emit("game:leave", { roomId });
    setPhase("picker");
    setRoomId(null);
    setSeat(null);
    setPlayers(null);
    setInitialGame(null);
    navigate(`/arcade/${gameSlug}`, { replace: true });
  }, [roomId, socket, navigate, gameSlug]);

  const opponent =
    players && (phase === "playing" || phase === "ended")
      ? players[seat === 0 ? 1 : 0]
      : players?.[1] || null;

  return {
    phase,
    roomId,
    seat,
    players,
    opponent,
    initialGame,
    error,
    user,
    socket,
    challenge,
    cancelWaiting,
    leaveGame,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getSocket } from "./socket.js";
import { useAuth } from "../context/AuthContext.jsx";

// ==========================================================
// Room/lobby plumbing for Monopoly.
//
// The other multiplayer games use useChallengeFlow, which is hard-wired
// to exactly two players (challenge one friend, they accept, play). Up to
// 8 players needs a real lobby instead: create a room, share the code,
// everyone joins, host starts. This hook owns that flow plus the live
// game state pushed from the server.
// ==========================================================

export function useMonopolyRoom() {
  const { user } = useAuth();
  const socket = useMemo(() => getSocket(), []);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlRoom = searchParams.get("room");

  const [phase, setPhase] = useState(urlRoom ? "resuming" : "menu"); // menu | resuming | lobby | playing
  const [roomId, setRoomId] = useState(urlRoom || null);
  const [code, setCode] = useState(null);
  const [lobby, setLobby] = useState(null); // { players, hostUserId, max }
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [board, setBoard] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // The board only arrives on the first push; hold onto it across updates.
  const boardRef = useRef(null);

  useEffect(() => {
    if (!socket.connected) socket.connect();
  }, [socket]);

  useEffect(() => {
    function onLobby(data) {
      setLobby({ players: data.players, hostUserId: data.hostUserId, max: data.max });
      setCode(data.code);
      setRoomId(data.roomId);
      setPhase("lobby");
    }
    function onState(data) {
      if (data.board) {
        boardRef.current = data.board;
        setBoard(data.board);
      }
      setGame(data.game);
      setPlayers(data.players);
      setRoomId(data.roomId);
      setPhase("playing");
    }
    socket.on("mono:lobby", onLobby);
    socket.on("mono:state", onState);
    return () => {
      socket.off("mono:lobby", onLobby);
      socket.off("mono:state", onState);
    };
  }, [socket]);

  // Reconnect into a room we're already seated in (after a refresh, or
  // when the connection dropped mid-game).
  const resume = useCallback(
    (id) => {
      socket.emit("mono:resume", { roomId: id }, (res) => {
        if (!res?.ok) {
          setError(res?.error === "not_in_room" ? "That game has already started without you." : "That game is no longer running.");
          setPhase("menu");
          setSearchParams({}, { replace: true });
          return;
        }
        setCode(res.code);
        setRoomId(res.roomId);
      });
    },
    [socket, setSearchParams]
  );

  useEffect(() => {
    if (!urlRoom || !user) return;
    if (socket.connected) {
      resume(urlRoom);
      return;
    }
    const onConnect = () => resume(urlRoom);
    socket.once("connect", onConnect);
    return () => socket.off("connect", onConnect);
  }, [urlRoom, user, socket, resume]);

  const createRoom = useCallback(() => {
    setError("");
    setBusy(true);
    socket.emit("mono:create", {}, (res) => {
      setBusy(false);
      if (!res?.ok) return setError("Couldn't create the room. Try again.");
      setRoomId(res.roomId);
      setCode(res.code);
      setSearchParams({ room: res.roomId }, { replace: true });
    });
  }, [socket, setSearchParams]);

  const joinRoom = useCallback(
    (joinCode) => {
      setError("");
      const clean = String(joinCode || "").trim().toUpperCase();
      if (clean.length < 4) return setError("Enter the 5-letter room code.");
      setBusy(true);
      socket.emit("mono:join", { code: clean }, (res) => {
        setBusy(false);
        if (!res?.ok) {
          const messages = {
            not_found: "No game found with that code.",
            already_started: "That game has already started.",
            full: "That game is full (8 players max).",
          };
          return setError(messages[res?.error] || "Couldn't join that game.");
        }
        setRoomId(res.roomId);
        setCode(res.code);
        setSearchParams({ room: res.roomId }, { replace: true });
      });
    },
    [socket, setSearchParams]
  );

  const startGame = useCallback(() => {
    if (roomId) socket.emit("mono:start", { roomId });
  }, [socket, roomId]);

  const leaveRoom = useCallback(() => {
    if (roomId) socket.emit("mono:leave", { roomId });
    setPhase("menu");
    setRoomId(null);
    setCode(null);
    setLobby(null);
    setGame(null);
    setBoard(null);
    boardRef.current = null;
    setSearchParams({}, { replace: true });
  }, [socket, roomId, setSearchParams]);

  // Every in-game action is the same shape: tell the server what you'd
  // like to do and wait for the authoritative state to come back.
  const act = useCallback(
    (event, payload = {}) => {
      if (roomId) socket.emit(event, { roomId, ...payload });
    },
    [socket, roomId]
  );

  const mySeat = useMemo(() => {
    if (!user || !players.length) return -1;
    return players.findIndex((p) => p.userId === user.id);
  }, [user, players]);

  const isHost = lobby ? lobby.hostUserId === user?.id : false;

  return {
    phase,
    roomId,
    code,
    lobby,
    game,
    players,
    board: board || boardRef.current,
    mySeat,
    isHost,
    error,
    busy,
    setError,
    createRoom,
    joinRoom,
    startGame,
    leaveRoom,
    act,
  };
}

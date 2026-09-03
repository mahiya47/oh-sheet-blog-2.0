import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { getSocket } from "../lib/socket.js";

const GameSocketContext = createContext(null);

// Wires up the one real-time connection the app needs: the multiplayer
// arcade's "challenge a friend" flow. Connects while logged in, disconnects
// on logout, and holds the one thing that has to live above any single
// game page — an incoming challenge can arrive while the person is
// anywhere in the app, not just sitting on a game screen.
export function GameSocketProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socketRef = useRef(getSocket());
  const [connected, setConnected] = useState(false);
  const [incomingChallenge, setIncomingChallenge] = useState(null);
  // Stashes each accepted room's payload by roomId so the page that
  // navigates to /arcade/<slug>?room=<id> a moment later can pick it up
  // instead of racing the socket event.
  const acceptedStash = useRef(new Map());

  useEffect(() => {
    const socket = socketRef.current;
    if (!user) {
      socket.disconnect();
      setConnected(false);
      return;
    }

    socket.connect();

    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onIncoming(payload) {
      setIncomingChallenge(payload);
    }
    function onAcceptedGlobal(payload) {
      acceptedStash.current.set(payload.roomId, payload);
    }
    function onCanceled(payload) {
      setIncomingChallenge((cur) => (cur?.roomId === payload.roomId ? null : cur));
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("challenge:incoming", onIncoming);
    socket.on("challenge:accepted", onAcceptedGlobal);
    socket.on("challenge:canceled", onCanceled);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("challenge:incoming", onIncoming);
      socket.off("challenge:accepted", onAcceptedGlobal);
      socket.off("challenge:canceled", onCanceled);
    };
  }, [user]);

  const sendChallenge = useCallback((toUserId, gameSlug) => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      if (!socket.connected) {
        reject(new Error("Not connected — try again in a moment."));
        return;
      }
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error("The server didn't respond in time."));
      }, 6000);
      socket.emit("challenge:send", { toUserId, gameSlug }, (res) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (!res?.ok) {
          reject(new Error(res?.error === "offline" ? "They're not online right now." : "Couldn't send the challenge."));
          return;
        }
        resolve(res);
      });
    });
  }, []);

  const consumeAcceptedRoom = useCallback((roomId) => {
    const val = acceptedStash.current.get(roomId);
    if (val) acceptedStash.current.delete(roomId);
    return val || null;
  }, []);

  const respondToIncoming = useCallback(
    (accept) => {
      if (!incomingChallenge) return;
      const { roomId, gameSlug } = incomingChallenge;
      const socket = socketRef.current;
      if (accept) {
        function onAccepted(payload) {
          if (payload.roomId !== roomId) return;
          socket.off("challenge:accepted", onAccepted);
          acceptedStash.current.set(roomId, payload);
          navigate(`/arcade/${gameSlug}?room=${roomId}`);
        }
        socket.on("challenge:accepted", onAccepted);
        socket.emit("challenge:accept", { roomId });
      } else {
        socket.emit("challenge:decline", { roomId });
      }
      setIncomingChallenge(null);
    },
    [incomingChallenge, navigate],
  );

  return (
    <GameSocketContext.Provider
      value={{
        socket: socketRef.current,
        connected,
        sendChallenge,
        incomingChallenge,
        respondToIncoming,
        consumeAcceptedRoom,
      }}
    >
      {children}
    </GameSocketContext.Provider>
  );
}

export function useGameSocket() {
  const ctx = useContext(GameSocketContext);
  if (!ctx) throw new Error("useGameSocket must be used inside <GameSocketProvider>");
  return ctx;
}

import { io } from "socket.io-client";
import { getToken } from "./api.js";

// Same backend, different protocol — VITE_API_URL points at ".../api",
// the socket server listens on the bare origin.
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = API_BASE.replace(/\/api\/?$/, "");

let socket = null;

// One socket per tab, created lazily and reused everywhere (GameSocketContext,
// the multiplayer game pages). `auth` is a function so it re-reads the token
// on every (re)connect attempt rather than freezing it at creation time.
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: (cb) => cb({ token: getToken() }),
    });
  }
  return socket;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type {
  ClientMessage,
  Room,
  GameState,
  ErrorCode,
} from "@bull-and-cow/shared";
import { createWebSocket } from "../lib/websocket";
import { getPlayerName, savePlayerName } from "../lib/player-name";

type GameContextValue = {
  game: GameState | null;
  ownSecret: string | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  rooms: Room[];
  roomId: string | null;
  playerId: string | null;
  status: "connecting" | "online" | "offline";
  loaded: boolean;
  pending: boolean;
  error:
    | ErrorCode
    | "SERVER_UNAVAILABLE"
    | "RECONNECTING"
    | "OFFLINE"
    | "TIMEOUT"
    | "";
  clockOffset: number;
  send: (message: ClientMessage) => void;
};
const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const previousPath = useRef(pathname);
  const [playerName, updatePlayerName] = useState("");
  const [game, setGame] = useState<GameState | null>(null);
  const [ownSecret, setOwnSecret] = useState<string | null>(null);
  const identity = useRef<{ roomId: string; playerId: string } | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [status, setStatus] =
    useState<GameContextValue["status"]>("connecting");
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<GameContextValue["error"]>("");
  const [clockOffset, setClockOffset] = useState(0);
  const connection = useRef<ReturnType<typeof createWebSocket> | null>(null);
  const requestPending = useRef(false);
  const requestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    updatePlayerName(getPlayerName());
    const finish = () => {
      requestPending.current = false;
      setPending(false);
      if (requestTimer.current) clearTimeout(requestTimer.current);
    };
    let ws: ReturnType<typeof createWebSocket>;
    try {
      ws = createWebSocket();
      connection.current = ws;
    } catch {
      setStatus("offline");
      setError("SERVER_UNAVAILABLE");
      return;
    }
    const offOpen = ws.onOpen(() => {
      setStatus("online");
      setError("");
      ws.send({ type: "rooms.list" });
    });
    const offClose = ws.onClose(() => {
      setStatus("connecting");
      setLoaded(false);
      setRooms([]);
      setGame(null);
      setOwnSecret(null);
      identity.current = null;
      setRoomId(null);
      setPlayerId(null);
      finish();
      setError("RECONNECTING");
    });
    const offMessage = ws.onMessage((message) => {
      if (message.type === "rooms.list") {
        setRooms(message.payload.rooms);
        const current = identity.current;
        if (
          current &&
          !message.payload.rooms
            .find((room) => room.id === current.roomId)
            ?.players.find((player) => player.id === current.playerId)?.ready
        )
          setOwnSecret(null);
        setClockOffset(message.payload.serverTime - Date.now());
        setLoaded(true);
      }
      if (message.type === "room.joined") {
        identity.current = {
          roomId: message.payload.roomId,
          playerId: message.payload.playerId,
        };
        setRoomId(message.payload.roomId);
        setPlayerId(message.payload.playerId);
        finish();
        const destination = `/room/${message.payload.roomId}`;
        if (window.location.pathname !== destination) router.push(destination);
      }
      if (message.type === "room.left") {
        setGame(null);
        setOwnSecret(null);
        identity.current = null;
        setRoomId(null);
        setPlayerId(null);
        finish();
        router.replace("/");
      }
      if (
        message.type === "secret.accepted" &&
        message.payload.roomId === identity.current?.roomId
      ) {
        setOwnSecret(message.payload.code);
        finish();
      }
      if (
        message.type === "game.state" &&
        message.payload.roomId === identity.current?.roomId
      ) {
        setGame(message.payload);
        if (message.payload.winnerId) setOwnSecret(null);
        finish();
      }
      if (message.type === "error") {
        setError(message.payload.code);
        finish();
      }
    });
    return () => {
      offOpen();
      offClose();
      offMessage();
      if (requestTimer.current) clearTimeout(requestTimer.current);
      requestPending.current = false;
      ws.close();
      connection.current = null;
    };
  }, [router]);

  const send = useCallback((message: ClientMessage) => {
    if (requestPending.current) return;
    setError("");
    if (!connection.current?.send(message)) {
      setError("OFFLINE");
      return;
    }
    requestPending.current = true;
    setPending(true);
    requestTimer.current = setTimeout(() => {
      requestPending.current = false;
      setPending(false);
      setError("TIMEOUT");
    }, 10_000);
  }, []);

  const activeRoom = rooms.find((room) => room.id === roomId);
  useEffect(() => {
    if (roomId && activeRoom?.phase === "playing") {
      if (pathname !== `/room/${roomId}`) router.replace(`/room/${roomId}`);
    } else if (
      previousPath.current.startsWith("/room/") &&
      pathname === "/" &&
      roomId
    ) {
      send({ type: "room.leave" });
    }
    previousPath.current = pathname;
  }, [pathname, roomId, activeRoom?.phase, router, send]);

  useEffect(() => {
    if (activeRoom?.phase !== "playing") return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [activeRoom?.phase]);

  return (
    <GameContext.Provider
      value={{
        game,
        ownSecret,
        playerName,
        rooms,
        roomId,
        playerId,
        status,
        loaded,
        pending,
        error,
        clockOffset,
        send,
        setPlayerName: (name) => {
          updatePlayerName(name);
          savePlayerName(name);
        },
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const game = useContext(GameContext);
  if (!game) throw new Error("GameProvider is required");
  return game;
}

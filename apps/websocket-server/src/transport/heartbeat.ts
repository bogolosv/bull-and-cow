import type { WebSocket } from "ws";

export function attachHeartbeat(socket: WebSocket) {
  let alive = true;
  socket.on("pong", () => {
    alive = true;
  });
  const timer = setInterval(() => {
    if (!alive) return socket.terminate();
    alive = false;
    socket.ping();
  }, 5_000);
  socket.once("close", () => clearInterval(timer));
}

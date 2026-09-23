export { GameLobby } from "./lobby";
import type { GameLobby } from "./lobby";
export interface Env {
  GAME_LOBBY: DurableObjectNamespace<GameLobby>;
  ALLOWED_ORIGINS: string;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") return Response.json({ status: "ok" });
    if (
      url.pathname !== "/" ||
      request.headers.get("Upgrade")?.toLowerCase() !== "websocket"
    )
      return new Response("WebSocket endpoint", { status: 426 });
    const origin = request.headers.get("Origin");
    const allowed = env.ALLOWED_ORIGINS.split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!origin || !allowed.includes(origin))
      return new Response("Origin not allowed", { status: 403 });
    // A single bounded lobby preserves the existing client protocol. Shard only
    // after adding explicit routing and room-directory coordination.
    return env.GAME_LOBBY.get(env.GAME_LOBBY.idFromName("public-v1")).fetch(
      request,
    );
  },
} satisfies ExportedHandler<Env>;

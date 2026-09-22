import { createGameServer } from "./server";

const port = Number(process.env.PORT || 3001);
const server = createGameServer(port);

server.on("listening", () => {
  const address = server.address();
  console.log(
    `WebSocket server running on ws://localhost:${typeof address === "object" && address ? address.port : port}`,
  );
});

import {
  clientMessageSchema,
  type ClientMessage,
  type ServerMessage,
} from "@bull-and-cow/shared";

export function parseMessage(
  data: string,
  reply: (message: ServerMessage) => void,
): ClientMessage | undefined {
  let parsedData: unknown;
  try {
    parsedData = JSON.parse(data);
  } catch {
    reply({
      type: "error",
      payload: { code: "INVALID_JSON" },
    });
    return;
  }
  const result = clientMessageSchema.safeParse(parsedData);
  if (!result.success) {
    reply({
      type: "error",
      payload: {
        code:
          typeof parsedData === "object" &&
          parsedData !== null &&
          "type" in parsedData &&
          (parsedData.type === "secret.submit" ||
            parsedData.type === "game.guess")
            ? "INVALID_CODE"
            : "INVALID_MESSAGE",
      },
    });
    return;
  }
  return result.data;
}

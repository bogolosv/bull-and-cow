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
    const type =
      typeof parsedData === "object" &&
      parsedData !== null &&
      "type" in parsedData
        ? parsedData.type
        : undefined;
    const invalidField = (field: string) =>
      result.error.issues.some(
        (issue) => issue.path[0] === "payload" && issue.path[1] === field,
      );
    const code =
      (type === "room.create" || type === "room.join") &&
      invalidField("playerName")
        ? "INVALID_NAME"
        : (type === "secret.submit" || type === "game.guess") &&
            invalidField("code")
          ? "INVALID_CODE"
          : type === "session.resume"
            ? "SESSION_REQUIRED"
            : "INVALID_MESSAGE";
    reply({ type: "error", payload: { code } });
    return;
  }
  return result.data;
}

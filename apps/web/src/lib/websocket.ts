import {
  serverMessageSchema,
  type ClientMessage,
  type ServerMessage,
} from "@bull-and-cow/shared";

const INITIAL_RECONNECT_DELAY = 1_000;
const MAX_RECONNECT_DELAY = 10_000;

export const createWebSocket = () => {
  const url = process.env.NEXT_PUBLIC_WS_URL;

  if (!url) {
    throw new Error("NEXT_PUBLIC_WS_URL is not defined");
  }

  let socket: WebSocket | null = null;
  let reconnectDelay = INITIAL_RECONNECT_DELAY;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let manuallyClosed = false;

  const messageListeners = new Set<(message: ServerMessage) => void>();
  const openListeners = new Set<() => void>();
  const closeListeners = new Set<(code: number) => void>();

  const connect = () => {
    socket = new WebSocket(url);

    socket.onopen = () => {
      reconnectDelay = INITIAL_RECONNECT_DELAY;

      openListeners.forEach((listener) => listener());
    };

    socket.onmessage = (event) => {
      let parsedData: unknown;

      try {
        parsedData = JSON.parse(event.data);
      } catch {
        console.error("Invalid JSON received from WebSocket server");
        return;
      }

      const result = serverMessageSchema.safeParse(parsedData);

      if (!result.success) {
        console.error("Invalid WebSocket message:", result.error.issues);

        return;
      }

      messageListeners.forEach((listener) => {
        listener(result.data);
      });
    };

    socket.onclose = (event) => {
      if (event.code === 4000) manuallyClosed = true;
      closeListeners.forEach((listener) => listener(event.code));

      if (manuallyClosed) {
        return;
      }

      reconnectTimer = setTimeout(() => {
        connect();

        reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
      }, reconnectDelay);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  };

  const send = (message: ClientMessage) => {
    if (socket?.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not connected");
      return false;
    }

    socket.send(JSON.stringify(message));
    return true;
  };

  const onMessage = (listener: (message: ServerMessage) => void) => {
    messageListeners.add(listener);

    return () => {
      messageListeners.delete(listener);
    };
  };

  const onOpen = (listener: () => void) => {
    openListeners.add(listener);

    return () => {
      openListeners.delete(listener);
    };
  };

  const onClose = (listener: (code: number) => void) => {
    closeListeners.add(listener);
    return () => {
      closeListeners.delete(listener);
    };
  };

  const close = () => {
    manuallyClosed = true;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    socket?.close();
  };

  connect();

  return {
    send,
    onMessage,
    onOpen,
    onClose,
    close,
  };
};

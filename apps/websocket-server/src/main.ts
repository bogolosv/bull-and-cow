import { WebSocketServer } from 'ws';

import {
  clientMessageSchema,
  type ServerMessage,
} from '@bull-and-cow/shared';

const PORT = 3001;

const wss = new WebSocketServer({
  port: PORT,
});

wss.on('connection', (socket) => {
  console.log('Client connected');

  const connectedMessage: ServerMessage = {
    type: 'connected',
    payload: {
      message: 'Connected to WebSocket server',
    },
  };

  socket.send(JSON.stringify(connectedMessage));

  socket.on('message', (data) => {
    let parsedData: unknown;

    try {
      parsedData = JSON.parse(data.toString());
    } catch {
      console.error('Invalid JSON received');
      return;
    }

    const result = clientMessageSchema.safeParse(parsedData);

    if (!result.success) {
      console.error('Invalid WebSocket message:', result.error.issues);
      return;
    }

    const message = result.data;

    console.log('Received:', message);

    if (message.type === 'ping') {
      const response: ServerMessage = {
        type: 'pong',
      };

      socket.send(JSON.stringify(response));
      return;
    }

    if (message.type === 'message') {
      const response: ServerMessage = {
        type: 'message',
        payload: {
          text: message.payload.text,
        },
      };

      socket.send(JSON.stringify(response));
    }
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
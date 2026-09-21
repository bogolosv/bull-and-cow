'use client';

import { useEffect, useState } from 'react';
import { createWebSocket } from '../lib/websocket';

export default function Home() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    const ws = createWebSocket();

    const unsubscribeOpen = ws.onOpen(() => {
      ws.send({
        type: 'message',
        payload: {
          text: 'Hello from Next.js',
        },
      });
    });

    const unsubscribeMessage = ws.onMessage((message) => {
      console.log('Received:', message);

      if (message.type === 'connected') {
        setMessage(message.payload.message);
      }

      if (message.type === 'message') {
        setMessage(message.payload.text);
      }

      if (message.type === 'pong') {
        setMessage('Pong received');
      }
    });

    return () => {
      unsubscribeOpen();
      unsubscribeMessage();
      ws.close();
    };
  }, []);

  return (
    <main>
      <h1>Bull & Cow</h1>

      <p>Server response:</p>
      <pre>{message}</pre>
    </main>
  );
}
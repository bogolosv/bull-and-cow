import { z } from 'zod';

export const clientMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ping'),
  }),

  z.object({
    type: z.literal('message'),
    payload: z.object({
      text: z.string(),
    }),
  }),
]);

export const serverMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('connected'),
    payload: z.object({
      message: z.string(),
    }),
  }),

  z.object({
    type: z.literal('pong'),
  }),

  z.object({
    type: z.literal('message'),
    payload: z.object({
      text: z.string(),
    }),
  }),
]);

export type ClientMessage = z.infer<typeof clientMessageSchema>;

export type ServerMessage = z.infer<typeof serverMessageSchema>;
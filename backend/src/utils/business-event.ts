import crypto from 'node:crypto';
import { eventBus } from '../events/event-bus.js';

export function emitBusinessEvent(event: string, userId: string, payload: Record<string, unknown>) {
  eventBus.emitEvent(event, {
    userId,
    payload: { ...payload, eventId: crypto.randomUUID(), timestamp: new Date().toISOString() },
  });
}

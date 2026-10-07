'use client';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS, type FileEventPayload } from '@novintix/shared';
import { useAuth } from '@/features/auth/auth-provider';
import { getSocket } from '@/lib/socket/socket';
import { useFileTransferStore } from '@/stores/file-transfer.store';

export function SocketBridge() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const handled = new Set<string>();
    const update = (payload: FileEventPayload) => {
      if (handled.has(payload.eventId)) return;
      handled.add(payload.eventId);
      useFileTransferStore.getState().patch(payload.operationId, {
        fileId: payload.fileId,
        progress: payload.progress,
        status:
          payload.status === 'READY'
            ? 'COMPLETED'
            : payload.status === 'FAILED'
              ? 'FAILED'
              : 'PROCESSING',
        error: payload.message,
      });
      if (['READY', 'FAILED', 'DELETED'].includes(payload.status))
        void queryClient.invalidateQueries({ queryKey: ['files'] });
    };
    const events = [
      SOCKET_EVENTS.FILE_UPLOAD_PROCESSING,
      SOCKET_EVENTS.FILE_PROCESSING_PROGRESS,
      SOCKET_EVENTS.FILE_UPLOAD_COMPLETED,
      SOCKET_EVENTS.FILE_UPLOAD_FAILED,
      SOCKET_EVENTS.FILE_DELETED,
    ] as const;
    events.forEach((event) => socket.on(event, update));
    const reconnect = () => void queryClient.invalidateQueries({ queryKey: ['files'] });
    socket.on('connect', reconnect);
    return () => {
      events.forEach((event) => socket.off(event, update));
      socket.off('connect', reconnect);
    };
  }, [queryClient, user]);
  return null;
}

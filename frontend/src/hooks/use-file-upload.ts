'use client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { filesApi } from '@/lib/api/files.api';
import { enqueueTransfer, removeQueuedTransfer } from '@/lib/files/transfer-queue';
import { useFileTransferStore } from '@/stores/file-transfer.store';

type UploadInput = { entityType?: string; entityId?: string; category?: string };
export function useFileUpload() {
  const queryClient = useQueryClient();
  return (file: File, input: UploadInput = {}) => {
    const operationId = crypto.randomUUID();
    const controller = new AbortController();
    const execute = async () => {
      const store = useFileTransferStore.getState();
      store.patch(operationId, { status: 'TRANSFERRING', progress: 0 });
      try {
        const uploaded = await filesApi.upload(
          file,
          { operationId, ...input },
          (progress, loaded, total) => store.patch(operationId, { progress, loaded, total }),
          controller.signal,
        );
        store.patch(operationId, { fileId: uploaded.id, status: 'COMPLETED', progress: 100 });
        await queryClient.invalidateQueries({ queryKey: ['files'] });
        toast.success(`${file.name} uploaded`);
      } catch (error) {
        if (controller.signal.aborted) store.patch(operationId, { status: 'CANCELLED' });
        else
          store.patch(operationId, {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Upload failed',
          });
      }
    };
    useFileTransferStore.getState().upsert({
      operationId,
      fileName: file.name,
      type: 'UPLOAD',
      progress: 0,
      status: 'QUEUED',
      total: file.size,
      cancel: () => {
        removeQueuedTransfer(operationId);
        controller.abort();
        useFileTransferStore.getState().patch(operationId, { status: 'CANCELLED' });
      },
      retry: () => {
        useFileTransferStore.getState().patch(operationId, { status: 'QUEUED', error: undefined });
        enqueueTransfer(operationId, execute);
      },
    });
    enqueueTransfer(operationId, execute);
    return operationId;
  };
}

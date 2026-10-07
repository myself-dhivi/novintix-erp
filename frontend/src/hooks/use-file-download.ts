'use client';
import type { AppFile } from '@/lib/api/files.api';
import { filesApi } from '@/lib/api/files.api';
import { useFileTransferStore } from '@/stores/file-transfer.store';

export function useFileDownload() {
  return async (file: AppFile) => {
    const operationId = crypto.randomUUID();
    const controller = new AbortController();
    const store = useFileTransferStore.getState();
    store.upsert({
      operationId,
      fileId: file.id,
      fileName: file.originalName,
      type: 'DOWNLOAD',
      progress: 0,
      status: 'TRANSFERRING',
      cancel: () => controller.abort(),
    });
    try {
      await filesApi.download(
        file,
        (progress, loaded, total) => store.patch(operationId, { progress, loaded, total }),
        controller.signal,
      );
      store.patch(operationId, { status: 'COMPLETED', progress: 100 });
    } catch (error) {
      store.patch(operationId, {
        status: controller.signal.aborted ? 'CANCELLED' : 'FAILED',
        error: error instanceof Error ? error.message : 'Download failed',
      });
    }
  };
}

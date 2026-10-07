import { apiClient } from './axios';

export type AppFile = {
  id: string;
  originalName: string;
  mimeType: string;
  extension: string;
  size: number;
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'DELETED' | 'QUARANTINED';
  entityType?: string;
  entityId?: string;
  category?: string;
  createdAt: string;
};
export const filesApi = {
  async list(signal?: AbortSignal) {
    return (await apiClient.get<{ data: AppFile[] }>('/files', { signal })).data.data;
  },
  async upload(
    file: File,
    input: { operationId: string; entityType?: string; entityId?: string; category?: string },
    onProgress: (value: number, loaded: number, total: number) => void,
    signal: AbortSignal,
  ) {
    const body = new FormData();
    body.append('file', file);
    Object.entries(input).forEach(([key, value]) => {
      if (value) body.append(key, value);
    });
    return (
      await apiClient.post<{ data: AppFile }>('/files/upload', body, {
        signal,
        onUploadProgress: ({ loaded, total }) =>
          onProgress(total ? Math.round((loaded / total) * 100) : 0, loaded, total ?? file.size),
      })
    ).data.data;
  },
  async download(
    file: AppFile,
    onProgress: (value: number, loaded: number, total?: number) => void,
    signal: AbortSignal,
  ) {
    const response = await apiClient.get<Blob>(`/files/${file.id}/download`, {
      responseType: 'blob',
      signal,
      onDownloadProgress: ({ loaded, total }) =>
        onProgress(total ? Math.round((loaded / total) * 100) : 0, loaded, total),
    });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.originalName;
    anchor.click();
    URL.revokeObjectURL(url);
  },
  async delete(id: string) {
    await apiClient.delete(`/files/${id}`);
  },
};

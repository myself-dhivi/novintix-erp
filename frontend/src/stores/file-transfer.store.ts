import { create } from 'zustand';

export type TransferStatus =
  'QUEUED' | 'TRANSFERRING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type FileTransfer = {
  operationId: string;
  fileId?: string;
  fileName: string;
  type: 'UPLOAD' | 'DOWNLOAD';
  progress: number;
  status: TransferStatus;
  loaded?: number;
  total?: number;
  error?: string;
  cancel?: () => void;
  retry?: () => void;
};
type TransferState = {
  transfers: Record<string, FileTransfer>;
  minimized: boolean;
  upsert: (value: FileTransfer) => void;
  patch: (id: string, value: Partial<FileTransfer>) => void;
  remove: (id: string) => void;
  clearCompleted: () => void;
  setMinimized: (value: boolean) => void;
};
export const useFileTransferStore = create<TransferState>((set) => ({
  transfers: {},
  minimized: false,
  upsert: (value) =>
    set((state) => ({ transfers: { ...state.transfers, [value.operationId]: value } })),
  patch: (id, value) =>
    set((state) =>
      state.transfers[id]
        ? { transfers: { ...state.transfers, [id]: { ...state.transfers[id], ...value } } }
        : state,
    ),
  remove: (id) =>
    set((state) => {
      const transfers = { ...state.transfers };
      delete transfers[id];
      return { transfers };
    }),
  clearCompleted: () =>
    set((state) => ({
      transfers: Object.fromEntries(
        Object.entries(state.transfers).filter(
          ([, item]) => !['COMPLETED', 'CANCELLED'].includes(item.status),
        ),
      ),
    })),
  setMinimized: (minimized) => set({ minimized }),
}));

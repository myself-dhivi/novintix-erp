'use client';
import { ChevronDown, ChevronUp, RotateCcw, X, XCircle } from 'lucide-react';
import { useFileTransferStore } from '@/stores/file-transfer.store';
import { FileProgress } from './file-progress';

export function TransferManager() {
  const { transfers, minimized, setMinimized, clearCompleted, remove } = useFileTransferStore();
  const items = Object.values(transfers);
  if (!items.length) return null;
  const active = items.filter((item) => !['COMPLETED', 'CANCELLED'].includes(item.status)).length;
  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">File transfers</p>
          <p className="text-xs text-slate-400">{active ? `${active} active` : 'All caught up'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearCompleted}
            className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
          >
            Clear
          </button>
          <button
            aria-label={minimized ? 'Expand' : 'Minimize'}
            onClick={() => setMinimized(!minimized)}
            className="rounded-lg p-1.5 hover:bg-slate-100"
          >
            {minimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </header>
      {!minimized && (
        <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
          {items.map((item) => (
            <div key={item.operationId} className="p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.fileName}</p>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">{item.type}</p>
                </div>
                <div className="flex gap-1">
                  {item.status === 'FAILED' && item.retry && (
                    <button aria-label="Retry" onClick={item.retry}>
                      <RotateCcw size={15} />
                    </button>
                  )}
                  {['QUEUED', 'TRANSFERRING', 'PROCESSING'].includes(item.status) &&
                    item.cancel && (
                      <button aria-label="Cancel" onClick={item.cancel}>
                        <XCircle size={15} />
                      </button>
                    )}
                  {['COMPLETED', 'FAILED', 'CANCELLED'].includes(item.status) && (
                    <button aria-label="Remove" onClick={() => remove(item.operationId)}>
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>
              <FileProgress transfer={item} />
              {item.error && <p className="mt-2 text-xs text-rose-600">{item.error}</p>}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

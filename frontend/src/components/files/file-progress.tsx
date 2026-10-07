import type { FileTransfer } from '@/stores/file-transfer.store';

const size = (bytes?: number) =>
  bytes === undefined
    ? ''
    : bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
export function FileProgress({ transfer }: { transfer: FileTransfer }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{transfer.status.toLowerCase()}</span>
        <span className="tabular-nums text-slate-400">{transfer.progress}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${transfer.status === 'FAILED' ? 'bg-rose-500' : transfer.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
          style={{ width: `${transfer.progress}%` }}
        />
      </div>
      {transfer.loaded !== undefined && (
        <p className="text-[11px] text-slate-400">
          {size(transfer.loaded)}
          {transfer.total ? ` / ${size(transfer.total)}` : ''}
        </p>
      )}
    </div>
  );
}

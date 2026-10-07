'use client';
import { FileText, Image as ImageIcon, Search } from 'lucide-react';
import { useState } from 'react';
import type { AppFile } from '@/lib/api/files.api';
import { FileDeleteButton } from './file-delete-button';
import { FileDownloadButton } from './file-download-button';
import { FilePreview } from './file-preview';

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
export function FileList({
  files,
  loading,
  canDelete,
}: {
  files: AppFile[];
  loading: boolean;
  canDelete: boolean;
}) {
  const [search, setSearch] = useState('');
  const visible = files.filter((file) =>
    file.originalName.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-semibold">Workspace files</h2>
          <p className="mt-1 text-xs text-slate-400">{files.length} total documents</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search files"
            className="h-9 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
          />
        </div>
      </div>
      {loading ? (
        <div className="space-y-3 p-5">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : !visible.length ? (
        <div className="py-16 text-center">
          <FileText className="mx-auto text-slate-300" size={32} />
          <p className="mt-3 text-sm font-medium">No files found</p>
          <p className="mt-1 text-xs text-slate-400">Upload a document to see it here.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {visible.map((file) => (
            <div key={file.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/70">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
                {file.mimeType.startsWith('image/') ? (
                  <ImageIcon size={18} />
                ) : (
                  <FileText size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.originalName}</p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`hidden rounded-full px-2.5 py-1 text-[11px] font-medium sm:block ${file.status === 'READY' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
              >
                {file.status}
              </span>
              <div className="flex">
                <FilePreview file={file} />
                <FileDownloadButton file={file} />
                {canDelete && <FileDeleteButton fileId={file.id} fileName={file.originalName} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

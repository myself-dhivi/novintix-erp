'use client';
import { Download } from 'lucide-react';
import type { AppFile } from '@/lib/api/files.api';
import { useFileDownload } from '@/hooks/use-file-download';
export function FileDownloadButton({ file }: { file: AppFile }) {
  const download = useFileDownload();
  return (
    <button
      onClick={() => void download(file)}
      className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      aria-label={`Download ${file.originalName}`}
    >
      <Download size={16} />
    </button>
  );
}

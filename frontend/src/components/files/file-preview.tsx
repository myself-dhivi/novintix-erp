'use client';
import { Eye } from 'lucide-react';
import type { AppFile } from '@/lib/api/files.api';
export function FilePreview({ file }: { file: AppFile }) {
  return (
    <button
      onClick={() =>
        alert(`${file.originalName}\n${file.mimeType}\n${(file.size / 1024).toFixed(1)} KB`)
      }
      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
      aria-label={`Preview ${file.originalName}`}
    >
      <Eye size={16} />
    </button>
  );
}

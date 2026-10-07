'use client';
import { Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { filesApi } from '@/lib/api/files.api';
export function FileDeleteButton({ fileId, fileName }: { fileId: string; fileName: string }) {
  const queryClient = useQueryClient();
  return (
    <button
      aria-label={`Delete ${fileName}`}
      onClick={async () => {
        if (!window.confirm(`Move ${fileName} to retention?`)) return;
        try {
          await filesApi.delete(fileId);
          await queryClient.invalidateQueries({ queryKey: ['files'] });
          toast.success('File moved to retention');
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Delete failed');
        }
      }}
      className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
    >
      <Trash2 size={16} />
    </button>
  );
}

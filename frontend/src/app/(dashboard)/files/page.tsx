'use client';
import { useQuery } from '@tanstack/react-query';
import { HardDrive } from 'lucide-react';
import { Can } from '@/components/shared/can';
import { FileList } from '@/components/files/file-list';
import { FileUploader } from '@/components/files/file-uploader';
import { usePermission } from '@/features/auth/auth-provider';
import { filesApi } from '@/lib/api/files.api';
export default function FilesPage() {
  const canDelete = usePermission('file.delete');
  const { data = [], isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: ({ signal }) => filesApi.list(signal),
  });
  const bytes = data.reduce((sum, file) => sum + file.size, 0);
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600">File management</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-.035em]">Documents</h1>
          <p className="mt-2 text-sm text-slate-500">
            One secure home for files across every module.
          </p>
        </div>
        <div className="hidden items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex">
          <HardDrive size={18} className="text-indigo-500" />
          <div>
            <p className="text-xs text-slate-400">Storage used</p>
            <p className="text-sm font-semibold">{(bytes / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        </div>
      </div>
      <Can permission="file.upload">
        <div className="mb-6">
          <FileUploader />
        </div>
      </Can>
      <FileList files={data} loading={isLoading} canDelete={canDelete} />
    </div>
  );
}

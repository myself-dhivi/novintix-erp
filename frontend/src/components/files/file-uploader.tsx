'use client';
import { useRef, useState } from 'react';
import { FileUp } from 'lucide-react';
import { toast } from 'sonner';
import { useFileUpload } from '@/hooks/use-file-upload';

type Props = {
  entityType?: string;
  entityId?: string;
  category?: string;
  allowedTypes?: string[];
  maxSizeMB?: number;
  multiple?: boolean;
};
export function FileUploader({
  entityType,
  entityId,
  category,
  allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'text/csv'],
  maxSizeMB = 10,
  multiple = true,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useFileUpload();
  const [dragging, setDragging] = useState(false);
  const select = (list: FileList | null) => {
    [...(list ?? [])].forEach((file) => {
      if (!allowedTypes.includes(file.type))
        return toast.error(`${file.name}: unsupported file type`);
      if (file.size > maxSizeMB * 1024 * 1024)
        return toast.error(`${file.name}: exceeds ${maxSizeMB} MB`);
      upload(file, { entityType, entityId, category });
    });
  };
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        select(event.dataTransfer.files);
      }}
      className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'}`}
    >
      <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm">
        <FileUp size={21} />
      </div>
      <p className="mt-4 text-sm font-semibold">
        Drop files here, or{' '}
        <button className="text-indigo-600 hover:underline" onClick={() => input.current?.click()}>
          browse
        </button>
      </p>
      <p className="mt-1 text-xs text-slate-400">
        PDF, PNG, JPG or CSV · up to {maxSizeMB} MB · 3 uploads at a time
      </p>
      <input
        ref={input}
        hidden
        type="file"
        accept={allowedTypes.join(',')}
        multiple={multiple}
        onChange={(event) => {
          select(event.target.files);
          event.target.value = '';
        }}
      />
    </div>
  );
}

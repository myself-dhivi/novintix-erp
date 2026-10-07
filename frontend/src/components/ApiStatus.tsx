'use client';

import { useEffect, useState } from 'react';

type Status = 'checking' | 'online' | 'offline';

export default function ApiStatus() {
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const controller = new AbortController();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

    fetch(`${apiUrl}/health`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('API unavailable');
        setStatus('online');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setStatus('offline');
      });

    return () => controller.abort();
  }, []);

  const labels: Record<Status, string> = {
    checking: 'Checking API',
    online: 'API online',
    offline: 'API offline',
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
      <span
        className={`h-2 w-2 rounded-full ${
          status === 'online'
            ? 'bg-emerald-500'
            : status === 'offline'
              ? 'bg-rose-500'
              : 'animate-pulse bg-amber-400'
        }`}
      />
      {labels[status]}
    </div>
  );
}

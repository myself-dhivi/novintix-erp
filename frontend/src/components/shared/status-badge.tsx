const tones: Record<string, string> = {
  WON: 'bg-emerald-50 text-emerald-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  HIRED: 'bg-emerald-50 text-emerald-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  NEW: 'bg-indigo-50 text-indigo-700',
  APPLIED: 'bg-indigo-50 text-indigo-700',
  PENDING: 'bg-amber-50 text-amber-700',
  OVERDUE: 'bg-rose-50 text-rose-700',
  LOST: 'bg-rose-50 text-rose-700',
  REJECTED: 'bg-rose-50 text-rose-700',
};
export function StatusBadge({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[value] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {value.replaceAll('_', ' ')}
    </span>
  );
}

'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, Clock3, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Can } from '@/components/shared/can';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { followupsApi, leadsApi } from '@/lib/api/business.api';

export default function FollowUpsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    leadId: '',
    type: 'CALL',
    subject: '',
    description: '',
    scheduledAt: '',
  });
  const { data = [], isLoading } = useQuery({
    queryKey: ['followups'],
    queryFn: followupsApi.list,
  });
  const { data: leads = [] } = useQuery({
    queryKey: ['leads', 'lookup'],
    queryFn: () => leadsApi.list(),
  });
  const create = useMutation({
    mutationFn: () =>
      followupsApi.create({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['followups'] });
      setOpen(false);
      toast.success('Follow-up scheduled');
    },
    onError: (error) => toast.error(error.message),
  });
  const complete = async (id: string) => {
    await followupsApi.update(id, { status: 'COMPLETED' });
    await queryClient.invalidateQueries({ queryKey: ['followups'] });
    toast.success('Follow-up completed');
  };
  const pending = data.filter((item) => item.status === 'PENDING').length;
  const overdue = data.filter(
    (item) => item.status === 'PENDING' && new Date(item.scheduledAt) < new Date(),
  ).length;
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="CRM"
        title="Follow-ups"
        description="Keep every customer conversation on schedule."
        action={
          <Can permission="followup.create">
            <button onClick={() => setOpen(true)} className="btn-primary">
              <Plus size={17} /> Schedule
            </button>
          </Can>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Pending', pending, Clock3, 'text-amber-600 bg-amber-50'],
          ['Overdue', overdue, CalendarClock, 'text-rose-600 bg-rose-50'],
          [
            'Completed',
            data.filter((x) => x.status === 'COMPLETED').length,
            CheckCircle2,
            'text-emerald-600 bg-emerald-50',
          ],
        ].map(([label, value, Icon, tone]) => {
          const C = Icon as typeof Clock3;
          return (
            <div key={String(label)} className="card flex items-center gap-4 p-5">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
                <C size={19} />
              </div>
              <div>
                <p className="text-2xl font-semibold">{String(value)}</p>
                <p className="text-xs text-slate-400">{String(label)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="space-y-3">
        {isLoading ? (
          <div className="card p-12 text-center text-slate-400">Loading…</div>
        ) : (
          data.map((item) => (
            <article
              key={item.id}
              className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <CalendarClock size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{item.subject}</h3>
                  <StatusBadge value={item.status} />
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold">
                    {item.type}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {item.lead.firstName} {item.lead.lastName}{' '}
                  {item.lead.companyName ? `· ${item.lead.companyName}` : ''}
                </p>
              </div>
              <div className="text-sm">
                <p className="font-medium">{new Date(item.scheduledAt).toLocaleDateString()}</p>
                <p className="text-xs text-slate-400">
                  {new Date(item.scheduledAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {item.status === 'PENDING' && (
                <Can permission="followup.update">
                  <button onClick={() => void complete(item.id)} className="btn-secondary">
                    <CheckCircle2 size={16} /> Complete
                  </button>
                </Can>
              )}
            </article>
          ))
        )}
      </div>
      <Modal open={open} title="Schedule follow-up" onClose={() => setOpen(false)}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
          className="space-y-4"
        >
          <label className="block text-xs font-medium">
            Lead
            <select
              required
              className="input mt-1.5"
              value={form.leadId}
              onChange={(e) => setForm({ ...form, leadId: e.target.value })}
            >
              <option value="">Select a lead</option>
              {leads.map((lead) => (
                <option value={lead.id} key={lead.id}>
                  {lead.firstName} {lead.lastName} — {lead.companyName || lead.leadCode}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-medium">
              Type
              <select
                className="input mt-1.5"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {['CALL', 'EMAIL', 'MEETING', 'WHATSAPP', 'DEMO', 'VISIT', 'TASK', 'OTHER'].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </label>
            <label className="text-xs font-medium">
              Date & time
              <input
                required
                type="datetime-local"
                className="input mt-1.5"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </label>
          </div>
          <label className="block text-xs font-medium">
            Subject
            <input
              required
              className="input mt-1.5"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </label>
          <label className="block text-xs font-medium">
            Notes
            <textarea
              className="input mt-1.5 h-24 py-3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary">Schedule</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

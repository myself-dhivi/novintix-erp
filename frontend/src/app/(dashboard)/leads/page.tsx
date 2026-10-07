'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Mail, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Can } from '@/components/shared/can';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { usePermission } from '@/features/auth/auth-provider';
import { leadsApi } from '@/lib/api/business.api';

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email().or(z.literal('')),
  phone: z.string().min(5),
  source: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  estimatedValue: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
const statuses = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
  'ON_HOLD',
];
export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const deferred = useDeferredValue(search);
  const canUpdate = usePermission('lead.update');
  const canDelete = usePermission('lead.delete');
  const { data = [], isLoading } = useQuery({
    queryKey: ['leads', deferred, status],
    queryFn: () => leadsApi.list({ search: deferred || undefined, status: status || undefined }),
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM', email: '' },
  });
  const create = useMutation({
    mutationFn: (values: FormValues) => leadsApi.create(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created');
      form.reset({ priority: 'MEDIUM', email: '' });
      setOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });
  const updateStatus = async (id: string, next: string) => {
    try {
      await leadsApi.update(id, { status: next });
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Status updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    }
  };
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="CRM"
        title="Leads"
        description="Capture, qualify, and progress every sales opportunity."
        action={
          <Can permission="lead.create">
            <button onClick={() => setOpen(true)} className="btn-primary">
              <Plus size={17} /> New lead
            </button>
          </Can>
        }
      />
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="filter-input pl-9"
              placeholder="Search name, company, email or phone"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="filter-input sm:w-48"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    Loading leads…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    No leads found. Create your first opportunity.
                  </td>
                </tr>
              ) : (
                data.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Building2 size={17} />
                        </div>
                        <div>
                          <p className="font-medium">
                            {lead.firstName} {lead.lastName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {lead.companyName || lead.leadCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p>{lead.phone}</p>
                      {lead.email && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Mail size={12} />
                          {lead.email}
                        </p>
                      )}
                    </td>
                    <td>
                      {canUpdate ? (
                        <select
                          value={lead.status}
                          onChange={(event) => void updateStatus(lead.id, event.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                        >
                          {statuses.map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      ) : (
                        <StatusBadge value={lead.status} />
                      )}
                    </td>
                    <td>
                      <StatusBadge value={lead.priority} />
                    </td>
                    <td className="font-medium">
                      {lead.estimatedValue
                        ? `₹${Number(lead.estimatedValue).toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        {canDelete ? (
                          <button
                            onClick={async () => {
                              if (confirm('Archive this lead?')) {
                                await leadsApi.delete(lead.id);
                                await queryClient.invalidateQueries({ queryKey: ['leads'] });
                              }
                            }}
                            className="icon-button hover:text-rose-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button className="icon-button">
                            <MoreHorizontal size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={open} title="Create lead" onClose={() => setOpen(false)}>
        <form
          onSubmit={form.handleSubmit((value) => create.mutate(value))}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="First name" error={form.formState.errors.firstName?.message}>
            <input className="input" {...form.register('firstName')} />
          </Field>
          <Field label="Last name">
            <input className="input" {...form.register('lastName')} />
          </Field>
          <Field label="Company">
            <input className="input" {...form.register('companyName')} />
          </Field>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <input className="input" {...form.register('email')} />
          </Field>
          <Field label="Phone" error={form.formState.errors.phone?.message}>
            <input className="input" {...form.register('phone')} />
          </Field>
          <Field label="Source">
            <input
              className="input"
              placeholder="Website, referral…"
              {...form.register('source')}
            />
          </Field>
          <Field label="Priority">
            <select className="input" {...form.register('priority')}>
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </Field>
          <Field label="Estimated value">
            <input type="number" className="input" {...form.register('estimatedValue')} />
          </Field>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button disabled={create.isPending} className="btn-primary">
              {create.isPending ? 'Creating…' : 'Create lead'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {error && <span className="mt-1 text-xs text-rose-600">{error}</span>}
    </label>
  );
}

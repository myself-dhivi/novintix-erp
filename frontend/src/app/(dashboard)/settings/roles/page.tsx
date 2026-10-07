'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus, Shield } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Can } from '@/components/shared/can';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { usePermission } from '@/features/auth/auth-provider';
import { adminApi, type Role } from '@/lib/api/business.api';

export default function RolesPage() {
  const client = useQueryClient();
  const canManage = usePermission('role.manage');
  const [selected, setSelected] = useState<Role | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: adminApi.roles });
  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: adminApi.permissions,
  });
  useEffect(() => {
    if (selected) {
      // Role selection intentionally synchronizes the editable permission buffer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChosen(permissions.filter((p) => selected.permissions.includes(p.name)).map((p) => p.id));
    }
  }, [selected, permissions]);
  const save = useMutation({
    mutationFn: () => adminApi.updateRolePermissions(selected!.id, chosen),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Permissions updated');
    },
    onError: (e) => toast.error(e.message),
  });
  const create = useMutation({
    mutationFn: () => adminApi.createRole({ ...roleForm, permissionIds: [] }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['roles'] });
      setOpen(false);
      toast.success('Role created');
    },
    onError: (e) => toast.error(e.message),
  });
  const groups = Object.groupBy(permissions, (p) => p.name.split('.')[0]);
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Administration"
        title="Roles & permissions"
        description="Define exactly what each team can see and change."
        action={
          <Can permission="role.manage">
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus size={16} /> New role
            </button>
          </Can>
        }
      />
      <div className="mb-5 flex gap-2 border-b border-slate-200">
        <Link href="/settings/users" className="px-3 py-2 text-sm text-slate-500">
          Users
        </Link>
        <Link
          href="/settings/roles"
          className="border-b-2 border-indigo-600 px-3 py-2 text-sm font-semibold text-indigo-600"
        >
          Roles & permissions
        </Link>
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="card divide-y divide-slate-100 overflow-hidden">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelected(role)}
              className={`flex w-full items-center gap-3 p-4 text-left ${selected?.id === role.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm">
                <Shield size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{role.name.replaceAll('_', ' ')}</p>
                <p className="text-xs text-slate-400">
                  {role._count.users} users · {role.permissions.length} permissions
                </p>
              </div>
            </button>
          ))}
        </aside>
        <section className="card min-h-[480px] p-6">
          {!selected ? (
            <div className="grid h-full place-items-center py-24 text-center text-slate-400">
              <div>
                <Shield className="mx-auto" size={32} />
                <p className="mt-3 text-sm">Select a role to inspect its permissions</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between border-b border-slate-100 pb-5">
                <div>
                  <h2 className="text-lg font-semibold">{selected.name.replaceAll('_', ' ')}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {selected.description || 'Custom workspace role'}
                  </p>
                </div>
                {canManage && selected.name !== 'SUPER_ADMIN' && (
                  <button
                    disabled={save.isPending}
                    onClick={() => save.mutate()}
                    className="btn-primary"
                  >
                    <Check size={16} /> Save changes
                  </button>
                )}
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                {Object.entries(groups).map(([group, items]) => (
                  <div key={group} className="rounded-xl border border-slate-200 p-4">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {group}
                    </h3>
                    <div className="space-y-2">
                      {items?.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            disabled={!canManage || selected.name === 'SUPER_ADMIN'}
                            checked={chosen.includes(permission.id)}
                            onChange={(e) =>
                              setChosen(
                                e.target.checked
                                  ? [...chosen, permission.id]
                                  : chosen.filter((x) => x !== permission.id),
                              )
                            }
                            className="h-4 w-4 accent-indigo-600"
                          />
                          <span className="text-sm">
                            {permission.name.split('.')[1].replaceAll('_', ' ')}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
      <Modal open={open} title="Create custom role" onClose={() => setOpen(false)}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <label className="block text-xs font-medium">
            Role name
            <input
              required
              pattern="[A-Z][A-Z0-9_]+"
              className="input mt-1.5 uppercase"
              placeholder="OPERATIONS_MANAGER"
              value={roleForm.name}
              onChange={(e) =>
                setRoleForm({
                  ...roleForm,
                  name: e.target.value.toUpperCase().replaceAll(' ', '_'),
                })
              }
            />
          </label>
          <label className="block text-xs font-medium">
            Description
            <textarea
              className="input mt-1.5 h-24 py-3"
              value={roleForm.description}
              onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary">Create role</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

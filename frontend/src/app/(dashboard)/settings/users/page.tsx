'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Can } from '@/components/shared/can';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminApi } from '@/lib/api/business.api';

export default function UsersPage() {
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: '',
  });
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: adminApi.users,
  });
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: adminApi.roles });
  const create = useMutation({
    mutationFn: () => adminApi.createUser(form),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['users'] });
      setOpen(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', roleId: '' });
      toast.success('User created');
    },
    onError: (error) => toast.error(error.message),
  });
  const toggle = async (id: string, isActive: boolean) => {
    await adminApi.updateUser(id, { isActive });
    await client.invalidateQueries({ queryKey: ['users'] });
    toast.success(isActive ? 'User activated' : 'User deactivated');
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Control workspace access and role assignments."
        action={
          <Can permission="user.create">
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} /> Add user
            </Button>
          </Can>
        }
      />
      <div className="mb-5 flex gap-2 border-b border-slate-200">
        <Link
          href="/settings/users"
          className="border-b-2 border-indigo-600 px-3 py-2 text-sm font-semibold text-indigo-600"
        >
          Users
        </Link>
        <Link
          href="/settings/roles"
          className="px-3 py-2 text-sm text-slate-500 transition hover:text-slate-900"
        >
          Roles & permissions
        </Link>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-14">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-slate-400">
                  Loading users…
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      <ShieldCheck size={13} />
                      {user.role.name.replaceAll('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Can permission="user.update">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void toggle(user.id, !user.isActive)}
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.isActive ? (
                          <UserX size={16} className="text-rose-500" />
                        ) : (
                          <UserCheck size={16} className="text-emerald-600" />
                        )}
                        <span className="sr-only">{user.isActive ? 'Deactivate' : 'Activate'}</span>
                      </Button>
                    </Can>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Modal open={open} title="Create user" onClose={() => setOpen(false)}>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <FormField label="First name">
            <Input
              required
              value={form.firstName}
              onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            />
          </FormField>
          <FormField label="Last name">
            <Input
              required
              value={form.lastName}
              onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            />
          </FormField>
          <FormField label="Email">
            <Input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </FormField>
          <FormField label="Temporary password">
            <PasswordInput
              required
              minLength={10}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </FormField>
          <FormField label="Role" className="sm:col-span-2">
            <select
              required
              className="input"
              value={form.roleId}
              onChange={(event) => setForm({ ...form, roleId: event.target.value })}
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option value={role.id} key={role.id}>
                  {role.name.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </FormField>
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={create.isPending}>
              {create.isPending ? 'Creating…' : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </Modal>
    </div>
  );
}

function FormField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-1.5 text-sm font-medium text-slate-700 ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

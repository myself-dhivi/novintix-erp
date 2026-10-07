import { apiClient } from './axios';

export type Lead = {
  id: string;
  leadCode: string;
  firstName: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone: string;
  source?: string;
  status: string;
  priority: string;
  estimatedValue?: string;
  createdAt: string;
};
export type FollowUp = {
  id: string;
  type: string;
  status: string;
  subject: string;
  description?: string;
  scheduledAt: string;
  lead: Pick<Lead, 'id' | 'leadCode' | 'firstName' | 'lastName' | 'companyName'>;
};
export type Job = {
  id: string;
  code: string;
  title: string;
  department: string;
  location?: string;
  openings: number;
  status: string;
  _count: { candidates: number };
};
export type Candidate = {
  id: string;
  candidateCode: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  currentCompany?: string;
  currentTitle?: string;
  experienceYears?: string;
  skills: string[];
  stage: string;
  job?: { id: string; title: string; code: string };
};
export type Party = { id: string; name: string; email?: string; phone?: string };
export type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  total: string;
  amountPaid: string;
  currency: string;
  customer: Party;
  items: Array<{ description: string; quantity: string; unitPrice: string; lineTotal: string }>;
};
export type Expense = {
  id: string;
  expenseNumber: string;
  category: string;
  description: string;
  amount: string;
  taxAmount: string;
  status: string;
  expenseDate: string;
  currency: string;
  vendor?: Party;
};
export type AppUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleId: string;
  role: { id: string; name: string };
  createdAt: string;
};
export type Role = {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  _count: { users: number };
};
export type PermissionRecord = { id: string; name: string; description?: string };

const unwrap = async <T>(request: Promise<{ data: { data: T } }>) => (await request).data.data;
export const leadsApi = {
  list: (params?: { search?: string; status?: string }) =>
    unwrap<Lead[]>(apiClient.get('/leads', { params })),
  create: (input: Record<string, unknown>) => unwrap<Lead>(apiClient.post('/leads', input)),
  update: (id: string, input: Record<string, unknown>) =>
    unwrap<Lead>(apiClient.patch(`/leads/${id}`, input)),
  delete: (id: string) => apiClient.delete(`/leads/${id}`),
};
export const followupsApi = {
  list: () => unwrap<FollowUp[]>(apiClient.get('/followups')),
  create: (input: Record<string, unknown>) => unwrap<FollowUp>(apiClient.post('/followups', input)),
  update: (id: string, input: Record<string, unknown>) =>
    unwrap<FollowUp>(apiClient.patch(`/followups/${id}`, input)),
  delete: (id: string) => apiClient.delete(`/followups/${id}`),
};
export const recruitmentApi = {
  jobs: () => unwrap<Job[]>(apiClient.get('/recruitment/jobs')),
  createJob: (input: Record<string, unknown>) =>
    unwrap<Job>(apiClient.post('/recruitment/jobs', input)),
  candidates: () => unwrap<Candidate[]>(apiClient.get('/recruitment/candidates')),
  createCandidate: (input: Record<string, unknown>) =>
    unwrap<Candidate>(apiClient.post('/recruitment/candidates', input)),
  moveCandidate: (id: string, stage: string) =>
    unwrap<Candidate>(apiClient.patch(`/recruitment/candidates/${id}/stage`, { stage })),
};
export const financeApi = {
  summary: () =>
    unwrap<{
      revenue: string;
      billed: string;
      expenses: string;
      outstandingAmount: string;
      outstandingInvoices: number;
    }>(apiClient.get('/finance/summary')),
  customers: () => unwrap<Party[]>(apiClient.get('/finance/customers')),
  createCustomer: (input: Record<string, unknown>) =>
    unwrap<Party>(apiClient.post('/finance/customers', input)),
  vendors: () => unwrap<Party[]>(apiClient.get('/finance/vendors')),
  createVendor: (input: Record<string, unknown>) =>
    unwrap<Party>(apiClient.post('/finance/vendors', input)),
  invoices: () => unwrap<Invoice[]>(apiClient.get('/finance/invoices')),
  createInvoice: (input: Record<string, unknown>) =>
    unwrap<Invoice>(apiClient.post('/finance/invoices', input)),
  expenses: () => unwrap<Expense[]>(apiClient.get('/finance/expenses')),
  createExpense: (input: Record<string, unknown>) =>
    unwrap<Expense>(apiClient.post('/finance/expenses', input)),
  approveExpense: (id: string, status: string) =>
    unwrap<Expense>(apiClient.patch(`/finance/expenses/${id}/status`, { status })),
};
export const adminApi = {
  users: () => unwrap<AppUser[]>(apiClient.get('/admin/users')),
  createUser: (input: Record<string, unknown>) =>
    unwrap<AppUser>(apiClient.post('/admin/users', input)),
  updateUser: (id: string, input: Record<string, unknown>) =>
    unwrap<AppUser>(apiClient.patch(`/admin/users/${id}`, input)),
  roles: () => unwrap<Role[]>(apiClient.get('/admin/roles')),
  permissions: () => unwrap<PermissionRecord[]>(apiClient.get('/admin/permissions')),
  createRole: (input: Record<string, unknown>) =>
    unwrap<Role>(apiClient.post('/admin/roles', input)),
  updateRolePermissions: (id: string, permissionIds: string[]) =>
    apiClient.put(`/admin/roles/${id}/permissions`, { permissionIds }),
};

'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CircleDollarSign, FileText, Plus, Receipt, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Can } from '@/components/shared/can';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { usePermission } from '@/features/auth/auth-provider';
import { financeApi } from '@/lib/api/business.api';

const money = (value: string | number) =>
  `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export default function FinancePage() {
  const client = useQueryClient();
  const [tab, setTab] = useState<'invoices' | 'expenses'>('invoices');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [invoice, setInvoice] = useState({
    customerId: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    taxRate: 18,
    dueDate: '',
  });
  const [expense, setExpense] = useState({
    category: '',
    description: '',
    amount: 0,
    taxAmount: 0,
    expenseDate: new Date().toISOString().slice(0, 10),
  });
  const canApprove = usePermission('finance.approve');
  const { data: summary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: financeApi.summary,
  });
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: financeApi.invoices,
  });
  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: financeApi.expenses,
  });
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: financeApi.customers,
  });
  const createInvoice = useMutation({
    mutationFn: () =>
      financeApi.createInvoice({
        customerId: invoice.customerId,
        issueDate: new Date().toISOString(),
        dueDate: new Date(invoice.dueDate).toISOString(),
        items: [
          {
            description: invoice.description,
            quantity: invoice.quantity,
            unitPrice: invoice.unitPrice,
            taxRate: invoice.taxRate,
          },
        ],
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['invoices'] }),
        client.invalidateQueries({ queryKey: ['finance-summary'] }),
      ]);
      setInvoiceOpen(false);
      toast.success('Invoice created');
    },
    onError: (e) => toast.error(e.message),
  });
  const createExpense = useMutation({
    mutationFn: () =>
      financeApi.createExpense({
        ...expense,
        expenseDate: new Date(expense.expenseDate).toISOString(),
      }),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['expenses'] }),
        client.invalidateQueries({ queryKey: ['finance-summary'] }),
      ]);
      setExpenseOpen(false);
      toast.success('Expense submitted');
    },
    onError: (e) => toast.error(e.message),
  });
  const approve = async (id: string, status: string) => {
    await financeApi.approveExpense(id, status);
    await Promise.all([
      client.invalidateQueries({ queryKey: ['expenses'] }),
      client.invalidateQueries({ queryKey: ['finance-summary'] }),
    ]);
    toast.success(`Expense ${status.toLowerCase()}`);
  };
  const cards = [
    ['Revenue', summary?.revenue || '0', TrendingUp, 'bg-emerald-50 text-emerald-600'],
    ['Total billed', summary?.billed || '0', FileText, 'bg-indigo-50 text-indigo-600'],
    ['Expenses', summary?.expenses || '0', Receipt, 'bg-rose-50 text-rose-600'],
    [
      'Outstanding',
      summary?.outstandingAmount || '0',
      CircleDollarSign,
      'bg-amber-50 text-amber-600',
    ],
  ] as const;
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow="Finance"
        title="Financial control"
        description="Track billing, collections, and company spend."
        action={
          <Can permission="finance.create">
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => setExpenseOpen(true)}>
                <Receipt size={16} /> Add expense
              </button>
              <button className="btn-primary" onClick={() => setInvoiceOpen(true)}>
                <Plus size={16} /> New invoice
              </button>
            </div>
          </Can>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, tone]) => (
          <article key={label} className="card p-5">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
              <Icon size={18} />
            </div>
            <p className="mt-4 text-2xl font-semibold">{money(value)}</p>
            <p className="mt-1 text-xs text-slate-400">{label}</p>
          </article>
        ))}
      </div>
      <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setTab('invoices')}
          className={`tab-button ${tab === 'invoices' ? 'active' : ''}`}
        >
          Invoices
        </button>
        <button
          onClick={() => setTab('expenses')}
          className={`tab-button ${tab === 'expenses' ? 'active' : ''}`}
        >
          Expenses
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="data-table">
          {tab === 'invoices' ? (
            <>
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Issued</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length ? (
                  invoices.map((x) => (
                    <tr key={x.id}>
                      <td className="font-medium">{x.invoiceNumber}</td>
                      <td>{x.customer.name}</td>
                      <td>{new Date(x.issueDate).toLocaleDateString()}</td>
                      <td className="font-medium">{money(x.total)}</td>
                      <td>{money(x.amountPaid)}</td>
                      <td>
                        <StatusBadge value={x.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-slate-400">
                      No invoices yet
                    </td>
                  </tr>
                )}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th>Expense</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.length ? (
                  expenses.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <p className="font-medium">{x.expenseNumber}</p>
                        <p className="text-xs text-slate-400">{x.category}</p>
                      </td>
                      <td>{x.description}</td>
                      <td>{new Date(x.expenseDate).toLocaleDateString()}</td>
                      <td className="font-medium">
                        {money(Number(x.amount) + Number(x.taxAmount))}
                      </td>
                      <td>
                        <StatusBadge value={x.status} />
                      </td>
                      <td>
                        {canApprove && x.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => void approve(x.id, 'APPROVED')}
                              className="text-xs font-semibold text-emerald-600"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => void approve(x.id, 'REJECTED')}
                              className="text-xs font-semibold text-rose-600"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-slate-400">
                      No expenses yet
                    </td>
                  </tr>
                )}
              </tbody>
            </>
          )}
        </table>
      </div>
      <Modal open={invoiceOpen} title="Create invoice" onClose={() => setInvoiceOpen(false)}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createInvoice.mutate();
          }}
        >
          <label className="block text-xs font-medium">
            Customer
            <select
              required
              className="input mt-1.5"
              value={invoice.customerId}
              onChange={(e) => setInvoice({ ...invoice, customerId: e.target.value })}
            >
              <option value="">Select customer</option>
              {customers.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            {customers.length === 0 && (
              <span className="mt-1 block text-xs text-amber-600">
                Create a customer through the API before issuing an invoice.
              </span>
            )}
          </label>
          <label className="block text-xs font-medium">
            Description
            <input
              required
              className="input mt-1.5"
              value={invoice.description}
              onChange={(e) => setInvoice({ ...invoice, description: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="text-xs font-medium">
              Qty
              <input
                type="number"
                min={0.01}
                step=".01"
                className="input mt-1.5"
                value={invoice.quantity}
                onChange={(e) => setInvoice({ ...invoice, quantity: Number(e.target.value) })}
              />
            </label>
            <label className="text-xs font-medium">
              Unit price
              <input
                type="number"
                min={0}
                className="input mt-1.5"
                value={invoice.unitPrice}
                onChange={(e) => setInvoice({ ...invoice, unitPrice: Number(e.target.value) })}
              />
            </label>
            <label className="text-xs font-medium">
              Tax %
              <input
                type="number"
                min={0}
                className="input mt-1.5"
                value={invoice.taxRate}
                onChange={(e) => setInvoice({ ...invoice, taxRate: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="block text-xs font-medium">
            Due date
            <input
              required
              type="date"
              className="input mt-1.5"
              value={invoice.dueDate}
              onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setInvoiceOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary">Create invoice</button>
          </div>
        </form>
      </Modal>
      <Modal open={expenseOpen} title="Record expense" onClose={() => setExpenseOpen(false)}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createExpense.mutate();
          }}
        >
          {[
            ['Category', 'category'],
            ['Description', 'description'],
          ].map(([label, key]) => (
            <label key={key} className="block text-xs font-medium">
              {label}
              <input
                required
                className="input mt-1.5"
                value={String(expense[key as keyof typeof expense])}
                onChange={(e) => setExpense({ ...expense, [key]: e.target.value })}
              />
            </label>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium">
              Amount
              <input
                type="number"
                min={0.01}
                className="input mt-1.5"
                value={expense.amount}
                onChange={(e) => setExpense({ ...expense, amount: Number(e.target.value) })}
              />
            </label>
            <label className="text-xs font-medium">
              Tax
              <input
                type="number"
                min={0}
                className="input mt-1.5"
                value={expense.taxAmount}
                onChange={(e) => setExpense({ ...expense, taxAmount: Number(e.target.value) })}
              />
            </label>
          </div>
          <label className="block text-xs font-medium">
            Date
            <input
              type="date"
              className="input mt-1.5"
              value={expense.expenseDate}
              onChange={(e) => setExpense({ ...expense, expenseDate: e.target.value })}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setExpenseOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary">Submit expense</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

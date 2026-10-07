import { Router } from 'express';
import { Decimal } from '@prisma/client/runtime/library';
import { z } from 'zod';
import { SOCKET_EVENTS } from '@novintix/shared';
import { prisma } from '../../config/prisma.js';
import { authenticateUser } from '../../middleware/authenticate.js';
import { requirePermission } from '../../middleware/require-permission.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { ApiError } from '../../utils/api-error.js';
import { createAudit } from '../../utils/audit.js';
import { emitBusinessEvent } from '../../utils/business-event.js';

const router = Router();
router.use(authenticateUser);
const partySchema = z.object({
  name: z.string().min(2).max(150),
  email: z.email().optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  taxId: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
});
const itemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().nonnegative(),
  taxRate: z.coerce.number().min(0).max(100).default(0),
});
const invoiceSchema = z.object({
  customerId: z.uuid(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: z.string().length(3).default('INR'),
  notes: z.string().max(2000).optional(),
  status: z
    .enum(['DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'])
    .default('DRAFT'),
  items: z.array(itemSchema).min(1),
});
const expenseSchema = z.object({
  vendorId: z.uuid().optional().nullable(),
  category: z.string().min(2).max(100),
  description: z.string().min(2).max(1000),
  amount: z.coerce.number().positive(),
  taxAmount: z.coerce.number().nonnegative().default(0),
  currency: z.string().length(3).default('INR'),
  expenseDate: z.coerce.date(),
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAID']).default('PENDING'),
  receiptFileId: z.uuid().optional().nullable(),
});
router.get(
  '/summary',
  requirePermission('finance.view'),
  asyncHandler(async (_request, response) => {
    const [invoiceTotals, expenseTotals, outstanding] = await Promise.all([
      prisma.invoice.aggregate({
        where: { deletedAt: null, status: { not: 'CANCELLED' } },
        _sum: { total: true, amountPaid: true },
      }),
      prisma.expense.aggregate({
        where: { deletedAt: null, status: { in: ['APPROVED', 'PAID'] } },
        _sum: { amount: true, taxAmount: true },
      }),
      prisma.invoice.count({
        where: { deletedAt: null, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
      }),
    ]);
    const revenue = invoiceTotals._sum.amountPaid ?? new Decimal(0);
    const billed = invoiceTotals._sum.total ?? new Decimal(0);
    const expenses = (expenseTotals._sum.amount ?? new Decimal(0)).add(
      expenseTotals._sum.taxAmount ?? new Decimal(0),
    );
    response.json({
      success: true,
      data: {
        revenue,
        billed,
        expenses,
        outstandingAmount: billed.sub(revenue),
        outstandingInvoices: outstanding,
      },
    });
  }),
);
router.get(
  '/customers',
  requirePermission('finance.view'),
  asyncHandler(async (_request, response) => {
    response.json({
      success: true,
      data: await prisma.customer.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      }),
    });
  }),
);
router.post(
  '/customers',
  requirePermission('finance.create'),
  asyncHandler(async (request, response) => {
    const input = partySchema.parse(request.body);
    const item = await prisma.customer.create({ data: { ...input, email: input.email || null } });
    response.status(201).json({ success: true, message: 'Customer created', data: item });
  }),
);
router.get(
  '/vendors',
  requirePermission('finance.view'),
  asyncHandler(async (_request, response) => {
    response.json({
      success: true,
      data: await prisma.vendor.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
    });
  }),
);
router.post(
  '/vendors',
  requirePermission('finance.create'),
  asyncHandler(async (request, response) => {
    const input = partySchema.parse(request.body);
    const item = await prisma.vendor.create({ data: { ...input, email: input.email || null } });
    response.status(201).json({ success: true, message: 'Vendor created', data: item });
  }),
);
router.get(
  '/invoices',
  requirePermission('finance.view'),
  asyncHandler(async (_request, response) => {
    const data = await prisma.invoice.findMany({
      where: { deletedAt: null },
      include: { customer: { select: { id: true, name: true } }, items: true },
      orderBy: { issueDate: 'desc' },
      take: 200,
    });
    response.json({ success: true, data });
  }),
);
router.post(
  '/invoices',
  requirePermission('finance.create'),
  asyncHandler(async (request, response) => {
    const input = invoiceSchema.parse(request.body);
    const calculated = input.items.map((item) => {
      const base = new Decimal(item.quantity).mul(item.unitPrice);
      const tax = base.mul(item.taxRate).div(100);
      return { ...item, lineTotal: base.add(tax), base, tax };
    });
    const subtotal = calculated.reduce((sum, item) => sum.add(item.base), new Decimal(0));
    const taxAmount = calculated.reduce((sum, item) => sum.add(item.tax), new Decimal(0));
    const count = await prisma.invoice.count();
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`,
        customerId: input.customerId,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        currency: input.currency.toUpperCase(),
        notes: input.notes,
        status: input.status,
        subtotal,
        taxAmount,
        total: subtotal.add(taxAmount),
        createdById: request.user!.id,
        items: { create: calculated.map(({ base: _base, tax: _tax, ...item }) => item) },
      },
      include: { customer: true, items: true },
    });
    await createAudit(request, {
      action: 'CREATE',
      module: 'FINANCE',
      entityType: 'INVOICE',
      entityId: invoice.id,
    });
    emitBusinessEvent(SOCKET_EVENTS.INVOICE_CREATED, request.user!.id, { invoiceId: invoice.id });
    response.status(201).json({ success: true, message: 'Invoice created', data: invoice });
  }),
);
router.post(
  '/invoices/:id/payments',
  requirePermission('finance.update'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    const input = z
      .object({
        amount: z.coerce.number().positive(),
        paidAt: z.coerce.date().default(() => new Date()),
        method: z.string().min(2).max(50),
        reference: z.string().max(100).optional(),
      })
      .parse(request.body);
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new ApiError(404, 'Invoice not found');
    const nextPaid = invoice.amountPaid.add(input.amount);
    if (nextPaid.gt(invoice.total)) throw new ApiError(422, 'Payment exceeds outstanding amount');
    const status = nextPaid.eq(invoice.total) ? 'PAID' : 'PARTIALLY_PAID';
    const [, updated] = await prisma.$transaction([
      prisma.payment.create({ data: { invoiceId: id, ...input } }),
      prisma.invoice.update({ where: { id }, data: { amountPaid: nextPaid, status } }),
    ]);
    if (status === 'PAID')
      emitBusinessEvent(SOCKET_EVENTS.INVOICE_PAID, request.user!.id, { invoiceId: id });
    response.status(201).json({ success: true, message: 'Payment recorded', data: updated });
  }),
);
router.get(
  '/expenses',
  requirePermission('finance.view'),
  asyncHandler(async (_request, response) => {
    response.json({
      success: true,
      data: await prisma.expense.findMany({
        where: { deletedAt: null },
        include: { vendor: { select: { id: true, name: true } } },
        orderBy: { expenseDate: 'desc' },
        take: 200,
      }),
    });
  }),
);
router.post(
  '/expenses',
  requirePermission('finance.create'),
  asyncHandler(async (request, response) => {
    const input = expenseSchema.parse(request.body);
    const count = await prisma.expense.count();
    const expense = await prisma.expense.create({
      data: {
        ...input,
        expenseNumber: `EXP-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`,
        createdById: request.user!.id,
      },
    });
    await createAudit(request, {
      action: 'CREATE',
      module: 'FINANCE',
      entityType: 'EXPENSE',
      entityId: expense.id,
    });
    response.status(201).json({ success: true, message: 'Expense created', data: expense });
  }),
);
router.patch(
  '/expenses/:id/status',
  requirePermission('finance.approve'),
  asyncHandler(async (request, response) => {
    const id = z.uuid().parse(request.params.id);
    const { status } = z
      .object({ status: z.enum(['APPROVED', 'REJECTED', 'PAID']) })
      .parse(request.body);
    const expense = await prisma.expense.update({
      where: { id },
      data: { status, approvedById: request.user!.id },
    });
    await createAudit(request, {
      action: status === 'REJECTED' ? 'REJECT' : 'APPROVE',
      module: 'FINANCE',
      entityType: 'EXPENSE',
      entityId: id,
      newValues: { status },
    });
    response.json({ success: true, message: 'Expense status updated', data: expense });
  }),
);
export default router;

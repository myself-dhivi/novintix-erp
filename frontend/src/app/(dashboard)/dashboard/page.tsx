'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Plus,
  ReceiptText,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundSearch,
  WalletCards,
} from 'lucide-react';
import Link from 'next/link';
import type { ElementType } from 'react';
import { StatusBadge } from '@/components/shared/status-badge';
import { useAuth } from '@/features/auth/auth-provider';
import { financeApi, followupsApi, leadsApi, recruitmentApi } from '@/lib/api/business.api';
import { filesApi } from '@/lib/api/files.api';

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  maximumFractionDigits: 1,
});
const fullDate = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const shortDate = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

type MetricCardProps = {
  label: string;
  value: string | number;
  note: string;
  href: string;
  icon: ElementType;
  tone: string;
  loading?: boolean;
};

function MetricCard({ label, value, note, href, icon: Icon, tone, loading }: MetricCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100/50"
    >
      <div className="flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
          <Icon size={19} />
        </div>
        <ArrowUpRight size={16} className="text-slate-300 transition group-hover:text-indigo-500" />
      </div>
      {loading ? (
        <div className="mt-5 h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      )}
      <p className="mt-1 text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
    </Link>
  );
}

function SectionHeading({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
      {href && (
        <Link
          href={href}
          aria-label={`Open ${title}`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
        >
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const permissions = user?.permissions ?? [];
  const can = (permission: string) => permissions.includes(permission);
  const canViewLeads = can('lead.view');
  const canViewFollowups = can('followup.view');
  const canViewRecruitment = can('recruitment.view');
  const canViewFinance = can('finance.view');
  const canViewFiles = can('file.view');

  const leadsQuery = useQuery({
    queryKey: ['leads', 'dashboard'],
    queryFn: () => leadsApi.list(),
    enabled: canViewLeads,
  });
  const followupsQuery = useQuery({
    queryKey: ['followups'],
    queryFn: followupsApi.list,
    enabled: canViewFollowups,
  });
  const jobsQuery = useQuery({
    queryKey: ['jobs'],
    queryFn: recruitmentApi.jobs,
    enabled: canViewRecruitment,
  });
  const candidatesQuery = useQuery({
    queryKey: ['candidates'],
    queryFn: recruitmentApi.candidates,
    enabled: canViewRecruitment,
  });
  const financeQuery = useQuery({
    queryKey: ['finance-summary'],
    queryFn: financeApi.summary,
    enabled: canViewFinance,
  });
  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: financeApi.invoices,
    enabled: canViewFinance,
  });
  const filesQuery = useQuery({
    queryKey: ['files'],
    queryFn: ({ signal }) => filesApi.list(signal),
    enabled: canViewFiles,
  });

  const leads = leadsQuery.data ?? [];
  const followups = followupsQuery.data ?? [];
  const jobs = jobsQuery.data ?? [];
  const candidates = candidatesQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];
  const files = filesQuery.data ?? [];
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const pendingFollowups = followups
    .filter((item) => item.status === 'PENDING')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const dueToday = pendingFollowups.filter(
    (item) => new Date(item.scheduledAt) >= now && new Date(item.scheduledAt) <= endOfToday,
  ).length;
  const overdue = pendingFollowups.filter((item) => new Date(item.scheduledAt) < now).length;
  const wonLeads = leads.filter((lead) => lead.status === 'WON').length;
  const openJobs = jobs.filter((job) => job.status === 'OPEN');
  const pendingInvoices = invoices.filter((invoice) =>
    ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status),
  ).length;
  const finance = financeQuery.data;
  const billed = Number(finance?.billed ?? 0);
  const revenue = Number(finance?.revenue ?? 0);
  const collectionRate = billed > 0 ? Math.min(100, Math.round((revenue / billed) * 100)) : 0;
  const visibleMetrics: MetricCardProps[] = [
    ...(canViewLeads
      ? [
          {
            label: 'Total leads',
            value: leads.length,
            note: `${wonLeads} converted to won`,
            href: '/leads',
            icon: Target,
            tone: 'bg-indigo-50 text-indigo-600',
            loading: leadsQuery.isLoading,
          },
        ]
      : []),
    ...(canViewFollowups
      ? [
          {
            label: "Today's follow-ups",
            value: dueToday,
            note: overdue ? `${overdue} overdue and needs attention` : 'Nothing overdue',
            href: '/followups',
            icon: CalendarCheck2,
            tone: overdue ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600',
            loading: followupsQuery.isLoading,
          },
        ]
      : []),
    ...(canViewRecruitment
      ? [
          {
            label: 'Active openings',
            value: openJobs.reduce((total, job) => total + job.openings, 0),
            note: `${candidates.length} candidates in pipeline`,
            href: '/recruitment',
            icon: BriefcaseBusiness,
            tone: 'bg-cyan-50 text-cyan-600',
            loading: jobsQuery.isLoading || candidatesQuery.isLoading,
          },
        ]
      : []),
    ...(canViewFinance
      ? [
          {
            label: 'Outstanding',
            value: money.format(Number(finance?.outstandingAmount ?? 0)),
            note: `${finance?.outstandingInvoices ?? 0} invoices awaiting payment`,
            href: '/finance',
            icon: CircleDollarSign,
            tone: 'bg-emerald-50 text-emerald-600',
            loading: financeQuery.isLoading,
          },
        ]
      : []),
    ...(canViewFiles && !canViewFinance
      ? [
          {
            label: 'Workspace files',
            value: files.length,
            note: 'Securely stored documents',
            href: '/files',
            icon: FileCheck2,
            tone: 'bg-violet-50 text-violet-600',
            loading: filesQuery.isLoading,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-[1500px]">
      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white px-6 py-7 shadow-sm shadow-indigo-100/50 sm:px-8">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute right-40 top-12 h-28 w-28 rounded-full bg-cyan-100/50 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">
              <Sparkles size={14} /> Workspace overview
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}
              , {user?.firstName}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Here is what needs your attention across the business today.
            </p>
          </div>
          <div
            suppressHydrationWarning
            className="inline-flex self-start rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur sm:self-auto"
          >
            {fullDate.format(now)}
          </div>
        </div>
      </section>

      {visibleMetrics.length > 0 && (
        <section
          className={`mt-6 grid gap-4 sm:grid-cols-2 ${visibleMetrics.length >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}
        >
          {visibleMetrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </section>
      )}

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          {canViewFollowups && (
            <article className="card p-5 sm:p-6">
              <SectionHeading
                title="Upcoming follow-ups"
                description="Your next customer conversations"
                href="/followups"
              />
              <div className="mt-5 divide-y divide-slate-100">
                {followupsQuery.isLoading ? (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-50" />
                    ))}
                  </div>
                ) : pendingFollowups.length ? (
                  pendingFollowups.slice(0, 5).map((followup) => {
                    const scheduled = new Date(followup.scheduledAt);
                    const isOverdue = scheduled < now;
                    return (
                      <div key={followup.id} className="flex items-center gap-3 py-3.5">
                        <div
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}
                        >
                          {isOverdue ? <Clock3 size={18} /> : <CalendarCheck2 size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {followup.subject}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-400">
                            {followup.lead.firstName} {followup.lead.lastName} · {followup.type}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            suppressHydrationWarning
                            className={`text-xs font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}
                          >
                            {shortDate.format(scheduled)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {isOverdue ? 'Overdue' : 'Scheduled'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center">
                    <CheckCircle2 className="mx-auto text-emerald-500" size={26} />
                    <p className="mt-3 text-sm font-medium text-slate-700">You are all caught up</p>
                    <p className="mt-1 text-xs text-slate-400">No pending follow-ups right now.</p>
                  </div>
                )}
              </div>
            </article>
          )}

          {canViewLeads && (
            <article className="card p-5 sm:p-6">
              <SectionHeading
                title="Lead pipeline"
                description="Current distribution across sales stages"
                href="/leads"
              />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {['NEW', 'QUALIFIED', 'PROPOSAL', 'WON'].map((status) => {
                  const count = leads.filter((lead) => lead.status === status).length;
                  const percentage = leads.length ? Math.round((count / leads.length) * 100) : 0;
                  return (
                    <div
                      key={status}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <StatusBadge value={status} />
                        <span className="text-sm font-semibold text-slate-800">{count}</span>
                      </div>
                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200/70">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-slate-400">
                        {percentage}% of total leads
                      </p>
                    </div>
                  );
                })}
              </div>
            </article>
          )}
        </div>

        <div className="space-y-6">
          <article className="card p-5 sm:p-6">
            <SectionHeading
              title="Quick actions"
              description="Jump straight into your daily work"
            />
            <div className="mt-5 grid gap-2">
              {can('lead.create') && (
                <Link
                  href="/leads"
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm font-medium text-slate-700 transition hover:border-indigo-100 hover:bg-indigo-50/60 hover:text-indigo-700"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Plus size={16} />
                  </span>
                  Add a new lead <ArrowRight className="ml-auto text-slate-300" size={15} />
                </Link>
              )}
              {can('followup.create') && (
                <Link
                  href="/followups"
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm font-medium text-slate-700 transition hover:border-amber-100 hover:bg-amber-50/60 hover:text-amber-700"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
                    <CalendarCheck2 size={16} />
                  </span>
                  Schedule follow-up <ArrowRight className="ml-auto text-slate-300" size={15} />
                </Link>
              )}
              {can('candidate.create') && (
                <Link
                  href="/recruitment"
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm font-medium text-slate-700 transition hover:border-cyan-100 hover:bg-cyan-50/60 hover:text-cyan-700"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-600">
                    <UserRoundSearch size={16} />
                  </span>
                  Add a candidate <ArrowRight className="ml-auto text-slate-300" size={15} />
                </Link>
              )}
              {can('finance.create') && (
                <Link
                  href="/finance"
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm font-medium text-slate-700 transition hover:border-emerald-100 hover:bg-emerald-50/60 hover:text-emerald-700"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                    <ReceiptText size={16} />
                  </span>
                  Create an invoice <ArrowRight className="ml-auto text-slate-300" size={15} />
                </Link>
              )}
              {canViewFiles && (
                <Link
                  href="/files"
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm font-medium text-slate-700 transition hover:border-violet-100 hover:bg-violet-50/60 hover:text-violet-700"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600">
                    <FileCheck2 size={16} />
                  </span>
                  Browse {files.length} workspace {files.length === 1 ? 'file' : 'files'}
                  <ArrowRight className="ml-auto text-slate-300" size={15} />
                </Link>
              )}
            </div>
          </article>

          {canViewFinance && (
            <article className="card p-5 sm:p-6">
              <SectionHeading
                title="Financial snapshot"
                description="Billing and collection performance"
                href="/finance"
              />
              <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Revenue collected</p>
                    <p className="mt-1 text-2xl font-semibold">{money.format(revenue)}</p>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-emerald-300">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-400">
                  <span>{collectionRate}% collected</span>
                  <span>{money.format(billed)} billed</span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <WalletCards size={16} className="text-indigo-500" />
                  <p className="mt-3 text-lg font-semibold text-slate-900">
                    {money.format(Number(finance?.expenses ?? 0))}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Total expenses</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <ReceiptText size={16} className="text-amber-500" />
                  <p className="mt-3 text-lg font-semibold text-slate-900">{pendingInvoices}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Open invoices</p>
                </div>
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  );
}

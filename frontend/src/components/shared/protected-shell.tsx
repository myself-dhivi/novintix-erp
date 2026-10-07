'use client';
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  ContactRound,
  Files,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  UserCog,
  UsersRound,
  WalletCards,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { getSocket } from '@/lib/socket/socket';

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard, permission: 'dashboard.view' },
  { href: '/leads', label: 'Leads', icon: ContactRound, permission: 'lead.view' },
  { href: '/followups', label: 'Follow-ups', icon: CalendarClock, permission: 'followup.view' },
  {
    href: '/recruitment',
    label: 'Recruitment',
    icon: BriefcaseBusiness,
    permission: 'recruitment.view',
  },
  { href: '/finance', label: 'Finance', icon: WalletCards, permission: 'finance.view' },
  { href: '/files', label: 'Files', icon: Files, permission: 'file.view' },
  { href: '/settings/users', label: 'Users', icon: UsersRound, permission: 'user.view' },
  { href: '/settings/roles', label: 'Access control', icon: UserCog, permission: 'role.view' },
];
export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [online, setOnline] = useState(() => getSocket().connected);
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);
  useEffect(() => {
    const socket = getSocket();
    const yes = () => setOnline(true);
    const no = () => setOnline(false);
    socket.on('connect', yes);
    socket.on('disconnect', no);
    return () => {
      socket.off('connect', yes);
      socket.off('disconnect', no);
    };
  }, []);
  if (loading || !user)
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  const sidebar = (
    <>
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/20">
          N
        </div>
        <span className="font-semibold tracking-tight text-slate-950">Novintix</span>
        <button className="ml-auto text-slate-600 lg:hidden" onClick={() => setMenu(false)}>
          <X size={19} />
        </button>
      </div>
      <nav className="space-y-1 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">
          Workspace
        </p>
        {nav
          .filter((item) => user.permissions.includes(item.permission))
          .map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenu(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${pathname === href ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
      </nav>
      <div className="mt-auto border-t border-slate-100 p-3">
        <Link
          href="/settings/users"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
        >
          <Settings size={18} /> Settings
        </Link>
        <button
          onClick={() => void logout().then(() => router.replace('/login'))}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={18} /> Sign out
        </button>
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-[11px] text-slate-400">{user.role.replaceAll('_', ' ')}</p>
          </div>
        </div>
      </div>
    </>
  );
  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        {sidebar}
      </aside>
      {menu && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMenu(false)}
        >
          <aside
            onClick={(event) => event.stopPropagation()}
            className="flex h-full w-72 flex-col bg-white"
          >
            {sidebar}
          </aside>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-5 text-slate-950 backdrop-blur-xl lg:px-8">
          <button className="text-slate-600 lg:hidden" onClick={() => setMenu(true)}>
            <Menu size={20} />
          </button>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-400"
              placeholder="Search anything…"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span
              title={online ? 'Realtime connected' : 'Realtime disconnected'}
              className={`rounded-lg p-2 ${online ? 'text-emerald-500' : 'text-amber-500'}`}
            >
              {online ? <Wifi size={17} /> : <WifiOff size={17} />}
            </span>
            <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <Bell size={18} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
            </button>
          </div>
        </header>
        <main className="p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

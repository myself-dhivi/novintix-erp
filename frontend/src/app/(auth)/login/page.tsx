'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, BarChart3, Check, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { useAuth } from '@/features/auth/auth-provider';

const schema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormValue = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValue>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@novintix.local', password: 'ChangeMe123!' },
  });
  const submit = async (value: FormValue) => {
    try {
      await login(value.email, value.password);
      router.replace('/dashboard');
    } catch (error) {
      setError('root', { message: error instanceof Error ? error.message : 'Sign in failed' });
    }
  };

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[#111827] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 top-20 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-20 left-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 font-bold">
            N
          </div>
          <span className="text-lg font-semibold tracking-tight">Novintix</span>
        </div>
        <div className="relative max-w-xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-indigo-200">
            <ShieldCheck size={14} /> Secure operations workspace
          </div>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-.04em]">
            Run your whole business from one calm place.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-400">
            People, customers, files, and finance—connected by a foundation your team can trust.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {['Role-based access', 'Live collaboration', 'Secure files'].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 bg-white/[.04] p-3 text-xs text-slate-300"
              >
                <Check className="mb-2 text-emerald-400" size={15} />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">© 2026 Novintix Systems</p>
      </section>
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 font-bold text-white">
              N
            </div>
            <span className="font-semibold">Novintix</span>
          </div>
          <div className="mb-8">
            <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3 size={21} />
            </div>
            <h2 className="text-3xl font-semibold tracking-[-.035em]">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-500">Sign in to continue to your workspace.</p>
          </div>
          <form onSubmit={handleSubmit(submit)} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Work email</span>
              <Input {...register('email')} autoComplete="email" />
              {errors.email && (
                <span className="mt-1 block text-xs text-rose-600">{errors.email.message}</span>
              )}
            </label>
            <label className="block">
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium">Password</span>
                <button
                  type="button"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Forgot password?
                </button>
              </div>
              <PasswordInput {...register('password')} autoComplete="current-password" />
              {errors.password && (
                <span className="mt-1 block text-xs text-rose-600">{errors.password.message}</span>
              )}
            </label>
            {errors.root && (
              <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errors.root.message}
              </div>
            )}
            <Button disabled={isSubmitting} className="h-11 w-full">
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" size={18} />
              ) : (
                <>
                  Sign in <ArrowRight size={17} />
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Demo: admin@novintix.local · ChangeMe123!
          </div>
        </div>
      </section>
    </main>
  );
}

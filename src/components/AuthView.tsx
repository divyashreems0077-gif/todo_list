import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiError, authApi } from '../api/client';
import type { User } from '../types/todo';

interface AuthViewProps {
  onAuthenticated: (token: string, user: User) => void;
}

type AuthMode = 'login' | 'register';

export function AuthView({ onAuthenticated }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (mode === 'register' && trimmedName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'register' && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const response =
        mode === 'register'
          ? await authApi.register({ name: trimmedName, email: trimmedEmail, password })
          : await authApi.login({ email: trimmedEmail, password });

      onAuthenticated(response.token, response.user);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to reach the server. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9FC] flex flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl bg-white border border-[#E6E0F4] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 bg-[#F5F2FF] border-b lg:border-b-0 lg:border-r border-[#E6E0F4] p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#623CEA] flex items-center justify-center text-white font-semibold text-sm">
                L
              </div>
              <span className="text-lg font-semibold tracking-tight text-[#1E1B2E] whitespace-nowrap">
                Lila
              </span>
            </div>

            <h1 className="mt-10 text-2xl sm:text-3xl font-semibold tracking-tight text-[#1E1B2E] leading-snug text-balance">
              Focused task management in white and lavender.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[#5B5470]">
              Organize daily priorities, track completion progress, and keep every task scoped privately to your account.
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-[#E6E0F4] space-y-3">
            <div className="flex items-start gap-2.5 text-sm text-[#453E5C]">
              <CheckCircle2 className="h-4 w-4 text-[#623CEA] mt-0.5 shrink-0" />
              <span>Private, account-scoped task workspace</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-[#453E5C]">
              <CheckCircle2 className="h-4 w-4 text-[#623CEA] mt-0.5 shrink-0" />
              <span>Instant filtering across pending and completed work</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-[#453E5C]">
              <CheckCircle2 className="h-4 w-4 text-[#623CEA] mt-0.5 shrink-0" />
              <span>Live completion summary and clean editing tools</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <div className="inline-flex p-1 bg-[#F4F1FA] rounded-lg border border-[#E6E0F4]">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#623CEA] ${
                  mode === 'login'
                    ? 'bg-white text-[#1E1B2E] shadow-xs'
                    : 'text-[#5B5470] hover:text-[#1E1B2E]'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#623CEA] ${
                  mode === 'register'
                    ? 'bg-white text-[#1E1B2E] shadow-xs'
                    : 'text-[#5B5470] hover:text-[#1E1B2E]'
                }`}
              >
                Create account
              </button>
            </div>

            <div className="mt-7">
              <h2 className="text-xl font-semibold text-[#1E1B2E]">
                {mode === 'login' ? 'Welcome back' : 'Create your workspace'}
              </h2>
              <p className="mt-1 text-sm text-[#5B5470]">
                {mode === 'login'
                  ? 'Sign in with your email and password to manage your tasks.'
                  : 'Register with your name and email to start tracking tasks.'}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {mode === 'register' && (
                <div>
                  <label htmlFor="auth-name" className="block text-sm font-medium text-[#1E1B2E]">
                    Full name
                  </label>
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="mt-1.5 block w-full rounded-lg border border-[#DCD5EE] bg-white px-3.5 py-2.5 text-sm text-[#1E1B2E] placeholder:text-[#8F88A6] focus:border-[#623CEA] focus:outline-none focus:ring-2 focus:ring-[#623CEA]/20"
                  />
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-sm font-medium text-[#1E1B2E]">
                  Email address
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-1.5 block w-full rounded-lg border border-[#DCD5EE] bg-white px-3.5 py-2.5 text-sm text-[#1E1B2E] placeholder:text-[#8F88A6] focus:border-[#623CEA] focus:outline-none focus:ring-2 focus:ring-[#623CEA]/20"
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-sm font-medium text-[#1E1B2E]">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Minimum 8 characters' : 'Enter your password'}
                    className="block w-full rounded-lg border border-[#DCD5EE] bg-white pl-3.5 pr-11 py-2.5 text-sm text-[#1E1B2E] placeholder:text-[#8F88A6] focus:border-[#623CEA] focus:outline-none focus:ring-2 focus:ring-[#623CEA]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-[#6E6784] hover:text-[#1E1B2E] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#623CEA]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#623CEA] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#512ED6] disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#623CEA]"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === 'login'
                  ? submitting
                    ? 'Signing in...'
                    : 'Sign in'
                  : submitting
                    ? 'Creating account...'
                    : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

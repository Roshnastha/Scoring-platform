import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { LogIn, Loader2, Layers } from 'lucide-react';
import { getErrorMessage } from '../utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role',  data.role);
      navigate('/candidates');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branded panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 bg-slate-900 flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">TechKraft</span>
        </div>

        <div>
          <h1 className="text-[2.25rem] font-bold text-white leading-tight mb-4">
            Hire the right<br />
            people,{' '}
            <span className="text-accent">faster.</span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Structured scoring, real-time collaboration, and AI-powered insights — all in one place.
          </p>
        </div>

        <p className="text-slate-700 text-xs">© 2024 TechKraft</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-bg-base">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-text-primary">TechKraft</span>
          </div>

          <h2 className="text-2xl font-bold text-text-primary mb-1">Welcome back</h2>
          <p className="text-sm text-text-muted mb-8">Sign in to your account to continue</p>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} id="login-form">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="you@techkraft.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              id="login-btn"
              type="submit"
              className="btn btn-primary w-full py-2.5 mt-1"
              disabled={loading}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                : <><LogIn className="w-4 h-4" /> Sign in</>
              }
            </button>
          </form>

          <div className="mt-8 p-4 bg-bg-subtle border border-border rounded-lg">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-2">
              Demo credentials
            </p>
            <p className="text-sm text-text-secondary">
              <code className="bg-white border border-border px-1.5 py-0.5 rounded text-xs font-mono">
                admin@techkraft.com
              </code>
              <span className="mx-1.5 text-text-muted">/</span>
              <code className="bg-white border border-border px-1.5 py-0.5 rounded text-xs font-mono">
                admin123
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

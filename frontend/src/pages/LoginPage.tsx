import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { LogIn, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../utils';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      navigate('/candidates');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#E8E8E8]">
      <div className="w-full max-w-md bg-white rounded-[2rem] p-10 md:p-12 shadow-float relative overflow-hidden">

        <div className="mb-10 text-center">
          <div className="w-12 h-12 bg-bg-base rounded-full flex items-center justify-center mx-auto mb-6 shadow-inset-soft">
            <div className="w-4 h-4 bg-accent-primary rounded-full" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-1">TechKraft</h1>
          <p className="text-sm font-medium text-text-secondary">Candidate Scoring Platform</p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} id="login-form">
          {error && <div className="bg-status-rej-bg text-status-rej-fg px-4 py-3 rounded-xl text-sm font-medium text-center">{error}</div>}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-text-secondary ml-1" htmlFor="email">Email</label>
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
            <label className="text-xs font-semibold text-text-secondary ml-1" htmlFor="password">Password</label>
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
            className="btn btn-primary w-full mt-4 py-3.5 text-[15px] inline-flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              : <><LogIn className="w-4 h-4" /> Sign In</>
            }
          </button>
        </form>

        <p className="text-center mt-8 text-xs text-text-muted font-medium bg-[#F9F9F9] py-3 rounded-xl shadow-inset-soft">
          Admin: <span className="text-text-secondary font-bold">admin@techkraft.com</span> / <span className="text-text-secondary font-bold">admin123</span>
        </p>
      </div>
    </div>
  );
}

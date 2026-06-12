import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Users, LogOut, Shield, UserRound, Layers } from 'lucide-react';

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const role      = localStorage.getItem('role') || 'reviewer';

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  }

  const active = location.pathname.startsWith('/candidates');

  return (
    <aside className="w-56 shrink-0 bg-slate-900 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm leading-tight">TechKraft</div>
            <div className="text-slate-500 text-[11px] leading-tight">Scoring Platform</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 px-2 mb-2">Menu</p>
        <Link
          to="/candidates"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            active
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          Candidates
        </Link>
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
            {role === 'admin'
              ? <Shield className="w-3.5 h-3.5 text-slate-300" />
              : <UserRound className="w-3.5 h-3.5 text-slate-300" />}
          </div>
          <div className="min-w-0">
            <div className="text-slate-200 text-xs font-medium capitalize truncate">{role}</div>
            <div className="text-slate-500 text-[11px]">{role === 'admin' ? 'Full access' : 'View & score'}</div>
          </div>
        </div>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

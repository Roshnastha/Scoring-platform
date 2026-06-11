import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, UserRound } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || 'reviewer';

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  }

  return (
    <nav className="flex items-center justify-between px-8 md:px-12 h-20 bg-white/80 backdrop-blur-md border-b border-border-light sticky top-0 z-50">
      <div className="font-sans text-xl font-bold tracking-tight flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-accent-primary" />
        TechKraft
      </div>
      <div className="flex items-center gap-6">
        <span className={`text-xs px-3 py-1 rounded-full font-medium inline-flex items-center gap-1.5 ${role === 'admin' ? 'bg-[#EAEFEC] text-[#4F6B55]' : 'bg-gray-100 text-text-secondary'}`}>
          {role === 'admin'
            ? <Shield className="w-3 h-3" />
            : <UserRound className="w-3 h-3" />
          }
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
        <button
          id="logout-btn"
          className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}

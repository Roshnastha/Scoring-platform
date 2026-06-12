import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCandidates, type Candidate, type CandidateFilters } from '../api/candidates';
import { getInitials } from '../utils';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';
import { Plus, Search } from 'lucide-react';

const STATUS_OPTIONS = ['', 'new', 'reviewed', 'hired', 'rejected'];

const STATUS_BADGE: Record<string, string> = {
  new:      'badge-new',
  reviewed: 'badge-reviewed',
  hired:    'badge-hired',
  rejected: 'badge-rejected',
  archived: 'badge-archived',
};

const AVATAR_PALETTES = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
  'bg-cyan-100 text-cyan-700',
];

function avatarPalette(name: string) {
  const sum = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[sum % AVATAR_PALETTES.length];
}

export default function CandidateListPage() {
  const role = localStorage.getItem('role') || 'reviewer';

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const [filters, setFilters] = useState<CandidateFilters>({
    status: '', role_applied: '', skill: '', keyword: '', page: 1, page_size: 12,
  });

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCandidates(filters);
      setCandidates(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      setError('Failed to load candidates. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  function handleFilterChange(updates: Partial<CandidateFilters>) {
    setFilters((prev) => ({ ...prev, ...updates, page: 1 }));
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Candidates</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {loading ? 'Loading…' : `${total} total`}
          </p>
        </div>
        {role === 'admin' && (
          <Link to="/candidates/new" className="btn btn-primary" id="add-candidate-btn">
            <Plus className="w-4 h-4" />
            Add Candidate
          </Link>
        )}
      </div>

      <FilterBar filters={filters} statusOptions={STATUS_OPTIONS} onChange={handleFilterChange} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-5 h-5 border-2 border-border-strong border-t-accent rounded-full animate-spin" />
        </div>
      ) : candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 card">
          <div className="w-10 h-10 rounded-lg bg-bg-subtle flex items-center justify-center mb-3">
            <Search className="w-5 h-5 text-text-muted" />
          </div>
          <p className="text-sm font-semibold text-text-primary">No candidates found</p>
          <p className="text-sm text-text-muted mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {candidates.map((c) => (
              <Link
                key={c.id}
                to={`/candidates/${c.id}`}
                className="card p-5 flex flex-col gap-4 no-underline hover:border-border-strong hover:shadow-sm transition-all group"
                id={`candidate-card-${c.id}`}
              >
                {/* Avatar + name row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarPalette(c.name)}`}>
                      {getInitials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-text-primary text-sm truncate">{c.name}</p>
                      <p className="text-xs text-text-muted truncate">{c.email}</p>
                    </div>
                  </div>
                  <span className={`badge capitalize shrink-0 ${STATUS_BADGE[c.status] ?? 'badge-archived'}`}>
                    {c.status}
                  </span>
                </div>

                {/* Role */}
                <p className="text-sm text-text-secondary -mt-1">{c.role_applied}</p>

                {/* Skills */}
                {c.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.skills.slice(0, 4).map((s) => (
                      <span key={s} className="text-[11px] font-medium bg-bg-subtle text-text-muted px-2 py-0.5 rounded border border-border">
                        {s}
                      </span>
                    ))}
                    {c.skills.length > 4 && (
                      <span className="text-[11px] font-medium bg-bg-subtle text-text-muted px-2 py-0.5 rounded border border-border">
                        +{c.skills.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-text-muted mt-auto">
                  <span>{c.scores.length} score{c.scores.length !== 1 ? 's' : ''}</span>
                  <span className="text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    View →
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <Pagination
            page={filters.page || 1}
            totalPages={totalPages}
            total={total}
            pageSize={filters.page_size || 12}
            onChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </>
      )}
    </div>
  );
}

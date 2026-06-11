import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getCandidates, type Candidate, type CandidateFilters } from '../api/candidates';
import { getInitials, STATUS_DOT_COLORS } from '../utils';
import FilterBar from '../components/FilterBar';
import Pagination from '../components/Pagination';

const STATUS_OPTIONS = ['', 'new', 'reviewed', 'hired', 'rejected'];

export default function CandidateListPage() {
  const role = localStorage.getItem('role') || 'reviewer';

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const [filters, setFilters] = useState<CandidateFilters>({
    status: '',
    role_applied: '',
    skill: '',
    keyword: '',
    page: 1,
    page_size: 12,
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

  function handlePageChange(page: number) {
    setFilters((prev) => ({ ...prev, page }));
  }


  return (
    <div className="max-w-[1400px] mx-auto p-6 md:p-12 animate-[fade-up_0.6s_cubic-bezier(0.16,1,0.3,1)_forwards]">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Candidates</h1>
          <p className="text-sm text-text-secondary mt-1">
            {loading ? 'Loading database…' : `${total} candidate${total !== 1 ? 's' : ''} found`}
          </p>
        </div>
        {role === 'admin' && (
          <Link to="/candidates/new" className="btn btn-primary" id="add-candidate-btn">
            + Add Candidate
          </Link>
        )}
      </div>

      <FilterBar
        filters={filters}
        statusOptions={STATUS_OPTIONS}
        onChange={handleFilterChange}
      />

      {error && <div className="bg-status-rej-bg text-status-rej-fg px-6 py-4 rounded-2xl text-sm font-medium mb-6">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-border-light border-t-text-muted rounded-full animate-spin"></div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-24 px-6 bg-white rounded-3xl shadow-soft">
          <div className="w-16 h-16 bg-bg-base rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🔍</div>
          <div className="text-lg font-bold mb-2">No candidates found</div>
          <div className="text-sm text-text-secondary">Try adjusting your filters</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((c) => (
              <Link
                key={c.id}
                to={`/candidates/${c.id}`}
                className="bg-white rounded-3xl p-6 flex flex-col gap-5 no-underline transition-all duration-300 shadow-soft hover:shadow-float hover:-translate-y-1 group"
                id={`candidate-card-${c.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-bg-base flex items-center justify-center font-bold text-text-primary shrink-0 transition-colors group-hover:bg-[#E8E8E8]">
                      {getInitials(c.name)}
                    </div>
                    <div>
                      <div className="font-bold text-lg leading-tight mb-0.5 text-text-primary">{c.name}</div>
                      <div className="text-xs text-text-muted">{c.email}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-text-primary mb-3">
                    {c.role_applied}
                  </div>
                  {c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {c.skills.slice(0, 4).map((s) => (
                        <span key={s} className="text-[11px] font-medium bg-[#F5F5F5] text-text-secondary px-2.5 py-1 rounded-full">{s}</span>
                      ))}
                      {c.skills.length > 4 && (
                        <span className="text-[11px] font-medium bg-[#F5F5F5] text-text-secondary px-2.5 py-1 rounded-full">+{c.skills.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border-light mt-auto text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[c.status] ?? 'bg-gray-400'}`} />
                    <span className="font-medium text-text-secondary capitalize">{c.status}</span>
                  </div>
                  <span className="text-text-muted">
                    {c.scores.length} score{c.scores.length !== 1 ? 's' : ''}
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
            onChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

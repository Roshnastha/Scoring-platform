import { Search } from 'lucide-react';
import type { CandidateFilters } from '../api/candidates';

interface Props {
  filters: CandidateFilters;
  statusOptions: string[];
  onChange: (updates: Partial<CandidateFilters>) => void;
}

export default function FilterBar({ filters, statusOptions, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-white rounded-3xl p-6 shadow-soft mb-8">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary ml-1 inline-flex items-center gap-1" htmlFor="filter-keyword">
          <Search className="w-3 h-3" /> Search
        </label>
        <input
          id="filter-keyword"
          className="form-control"
          placeholder="Name or email…"
          value={filters.keyword || ''}
          onChange={(e) => onChange({ keyword: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary ml-1" htmlFor="filter-status">Status</label>
        <select
          id="filter-status"
          className="form-control cursor-pointer appearance-none"
          value={filters.status || ''}
          onChange={(e) => onChange({ status: e.target.value })}
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary ml-1" htmlFor="filter-role">Role</label>
        <input
          id="filter-role"
          className="form-control"
          placeholder="e.g. Backend"
          value={filters.role_applied || ''}
          onChange={(e) => onChange({ role_applied: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary ml-1" htmlFor="filter-skill">Skill</label>
        <input
          id="filter-skill"
          className="form-control"
          placeholder="e.g. Python"
          value={filters.skill || ''}
          onChange={(e) => onChange({ skill: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary ml-1" htmlFor="filter-page-size">Per page</label>
        <select
          id="filter-page-size"
          className="form-control cursor-pointer appearance-none"
          value={filters.page_size || 12}
          onChange={(e) => onChange({ page_size: Number(e.target.value) })}
        >
          {[12, 20, 50].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

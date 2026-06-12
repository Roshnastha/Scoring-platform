import { Search } from 'lucide-react';
import type { CandidateFilters } from '../api/candidates';

interface Props {
  filters: CandidateFilters;
  statusOptions: string[];
  onChange: (updates: Partial<CandidateFilters>) => void;
}

export default function FilterBar({ filters, statusOptions, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
        <input
          id="filter-keyword"
          className="form-control pl-8 w-full"
          placeholder="Search candidates…"
          value={filters.keyword || ''}
          onChange={(e) => onChange({ keyword: e.target.value })}
        />
      </div>

      <select
        id="filter-status"
        className="form-control cursor-pointer w-38"
        value={filters.status || ''}
        onChange={(e) => onChange({ status: e.target.value })}
      >
        {statusOptions.map((s) => (
          <option key={s} value={s}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}
          </option>
        ))}
      </select>

      <input
        id="filter-role"
        className="form-control w-36"
        placeholder="Role…"
        value={filters.role_applied || ''}
        onChange={(e) => onChange({ role_applied: e.target.value })}
      />

      <input
        id="filter-skill"
        className="form-control w-32"
        placeholder="Skill…"
        value={filters.skill || ''}
        onChange={(e) => onChange({ skill: e.target.value })}
      />

      <select
        id="filter-page-size"
        className="form-control cursor-pointer w-28"
        value={filters.page_size || 12}
        onChange={(e) => onChange({ page_size: Number(e.target.value) })}
      >
        {[12, 20, 50].map((n) => (
          <option key={n} value={n}>{n} / page</option>
        ))}
      </select>
    </div>
  );
}

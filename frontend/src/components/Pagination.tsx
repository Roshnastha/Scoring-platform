import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, pageSize, onChange }: Props) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  const navBtn = 'w-8 h-8 flex items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-bg-subtle hover:border-border-strong disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

  return (
    <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
      <span className="text-sm text-text-muted">
        {start}–{end} of {total}
      </span>

      <div className="flex items-center gap-1">
        <button className={navBtn} onClick={() => onChange(page - 1)} disabled={page === 1} id="pagination-prev" aria-label="Previous">
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-text-muted text-sm">…</span>
          ) : (
            <button
              key={p}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-bg-subtle'
              }`}
              onClick={() => onChange(p as number)}
              id={`pagination-page-${p}`}
            >
              {p}
            </button>
          )
        )}

        <button className={navBtn} onClick={() => onChange(page + 1)} disabled={page === totalPages} id="pagination-next" aria-label="Next">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

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

  const btnBase = 'w-10 h-10 rounded-full bg-[#F9F9F9] border border-border-light text-text-secondary flex items-center justify-center transition-all hover:bg-gray-50 hover:text-text-primary active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-12 bg-white rounded-3xl p-4 px-6 shadow-soft">
      <span className="text-sm font-medium text-text-secondary">
        Showing <strong className="text-text-primary">{start}</strong>–<strong className="text-text-primary">{end}</strong> of <strong className="text-text-primary">{total}</strong>
      </span>

      <div className="flex items-center gap-1.5">
        <button
          className={btnBase}
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
          id="pagination-prev"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="text-text-muted px-1">…</span>
          ) : (
            <button
              key={p}
              className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition-all shadow-sm ${
                p === page
                  ? 'bg-text-primary text-white border border-transparent shadow-md'
                  : 'bg-[#F9F9F9] border border-border-light text-text-secondary hover:bg-gray-50 hover:text-text-primary active:bg-gray-100'
              }`}
              onClick={() => onChange(p as number)}
              id={`pagination-page-${p}`}
            >
              {p}
            </button>
          )
        )}

        <button
          className={btnBase}
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
          id="pagination-next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

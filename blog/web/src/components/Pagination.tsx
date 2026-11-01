import { ChevronLeft, ChevronRight } from 'lucide-react';

function pages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="文章分页">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-soft transition hover:border-forest/40 hover:text-forest disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="上一页"
      >
        <ChevronLeft size={16} />
      </button>
      {pages(page, totalPages).map((item, index) =>
        item === '...' ? (
          <span key={`ellipsis-${index}`} className="px-1 text-xs text-moss">
            ···
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`grid h-9 min-w-9 place-items-center rounded-full px-2 text-xs font-semibold transition ${
              item === page
                ? 'bg-forest text-paper shadow-sm'
                : 'border border-transparent text-ink-soft hover:border-line hover:bg-white/40'
            }`}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-soft transition hover:border-forest/40 hover:text-forest disabled:cursor-not-allowed disabled:opacity-30"
        aria-label="下一页"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

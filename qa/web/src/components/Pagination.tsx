import { ChevronLeft, ChevronRight } from 'lucide-react';

function pageItems(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="分页">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-soft hover:border-teal/40 disabled:opacity-30"
        aria-label="上一页"
      >
        <ChevronLeft size={15} />
      </button>
      {pageItems(page, totalPages).map((item, index) =>
        item === '...' ? (
          <span key={`e${index}`} className="px-1 text-xs text-teal-soft">···</span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-semibold ${
              item === page ? 'bg-teal text-panel' : 'text-ink-soft hover:bg-panel-deep'
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
        className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-soft hover:border-teal/40 disabled:opacity-30"
        aria-label="下一页"
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}

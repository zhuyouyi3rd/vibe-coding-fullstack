import { Link } from 'react-router-dom';
import { PenLine, SearchX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: 'write' | 'clear';
  onClear?: () => void;
}

export function EmptyState({
  title = '这里还没有文章',
  description = '换一个关键词，或者去写点什么。',
  action = 'write',
  onClear,
}: EmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-line bg-paper-light/40 px-6 py-16 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-paper-deep text-moss">
        <SearchX size={20} />
      </span>
      <h3 className="mt-4 font-display text-xl font-semibold text-forest-deep">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-ink-soft/80">{description}</p>
      {action === 'clear' && onClear ? (
        <button type="button" onClick={onClear} className="btn-ghost mt-5">
          清除筛选
        </button>
      ) : (
        <Link to="/write" className="btn-primary mt-5">
          <PenLine size={15} />
          写第一篇文章
        </Link>
      )}
    </div>
  );
}

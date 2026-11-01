import { Link } from 'react-router-dom';
import { MessageCircleQuestion } from 'lucide-react';

export function EmptyState({
  title = '还没有问题',
  description = '成为第一个提问的人吧。',
  showAsk = true,
}: {
  title?: string;
  description?: string;
  showAsk?: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-panel/50 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-mist text-teal">
        <MessageCircleQuestion size={21} />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-deep">{title}</h3>
      <p className="mt-2 max-w-sm text-xs leading-6 text-ink-soft">{description}</p>
      {showAsk && (
        <Link to="/ask" className="btn-amber mt-5">
          提个问题
        </Link>
      )}
    </div>
  );
}

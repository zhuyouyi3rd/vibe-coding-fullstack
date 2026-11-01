import { ArrowBigUp } from 'lucide-react';

export function VoteButton({
  votes,
  active,
  onClick,
  disabled = false,
  size = 'large',
}: {
  votes: number;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  size?: 'large' | 'small';
}) {
  if (size === 'small') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active}
        aria-label={`${votes} 赞同`}
        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition disabled:opacity-50 ${
          active
            ? 'border-amber/40 bg-amber/10 text-amber-deep'
            : 'border-line text-teal-soft hover:border-amber/35 hover:text-amber-deep'
        }`}
      >
        <ArrowBigUp size={13} fill={active ? 'currentColor' : 'none'} />
        {votes}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={`${votes} 赞同`}
      className={`flex w-12 flex-col items-center gap-0.5 rounded-lg border py-2 transition disabled:opacity-50 ${
        active
          ? 'border-amber/45 bg-amber/10 text-amber-deep'
          : 'border-line bg-panel/60 text-teal-soft hover:border-amber/40 hover:text-amber-deep'
      }`}
      title={active ? '取消点赞' : '点赞'}
    >
      <ArrowBigUp size={20} fill={active ? 'currentColor' : 'none'} />
      <span className="text-sm font-bold">{votes}</span>
      <span className="text-[9px]">赞同</span>
    </button>
  );
}

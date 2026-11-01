import { Link } from 'react-router-dom';
import { Check, Eye, MessageSquare } from 'lucide-react';
import type { QuestionSummary } from '../types';
import { formatRelative } from '../lib/format';
import { Avatar } from './Avatar';
import { Tag } from './Tag';

export function QuestionCard({ question, index = 0 }: { question: QuestionSummary; index?: number }) {
  return (
    <article
      className="group relative flex gap-3 rounded-xl border border-line bg-panel/80 p-4 transition hover:border-teal/25 hover:bg-panel hover:shadow-[0_18px_40px_-34px_rgba(18,59,58,0.6)] sm:gap-4 sm:p-5 animate-rise"
      style={{ animationDelay: `${Math.min(index, 6) * 45}ms` }}
    >
      <div className="hidden w-12 shrink-0 flex-col items-center gap-2.5 pt-0.5 sm:flex">
        <div className={`flex w-full flex-col items-center rounded-lg border py-1.5 ${question.votes > 0 ? 'border-amber/25 bg-amber/5' : 'border-line/70 bg-paper/50'}`}>
          <span className={`text-base font-bold ${question.votes > 0 ? 'text-amber-deep' : 'text-ink-soft'}`}>{question.votes}</span>
          <span className="text-[9px] tracking-wide text-teal">赞同</span>
        </div>
        <div className={`flex w-full flex-col items-center rounded-lg border py-1.5 ${question.isSolved ? 'border-teal/30 bg-teal/10' : question.answersCount > 0 ? 'border-line/70 bg-paper/50' : 'border-dashed border-line/70'}`}>
          {question.isSolved ? (
            <Check size={15} className="text-teal" />
          ) : (
            <span className={`text-sm font-bold ${question.answersCount > 0 ? 'text-teal' : 'text-ink-soft/60'}`}>{question.answersCount}</span>
          )}
          <span className="text-[9px] tracking-wide text-teal">
            {question.isSolved ? '已解决' : '回答'}
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {question.isSolved && (
            <span className="inline-flex items-center gap-1 rounded bg-teal/10 px-1.5 py-0.5 text-[9px] font-bold text-teal">
              <Check size={10} /> 已解决
            </span>
          )}
          {question.tags.slice(0, 3).map((tag) => (
            <Tag key={tag} name={tag} />
          ))}
        </div>

        <h2 className="mt-2 font-display text-[1.12rem] font-semibold leading-[1.55] tracking-[-0.01em] text-deep">
          <Link to={`/question/${question.id}`} className="transition hover:text-amber-deep">
            {question.title}
          </Link>
        </h2>

        <p className="mt-1.5 line-clamp-2 text-xs leading-6 text-ink-soft">{question.excerpt}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] text-teal-soft">
          <Link to={`/profile/${question.author.id}`} className="flex items-center gap-1.5 font-medium text-ink-soft hover:text-amber-deep">
            <Avatar src={question.author.avatar} name={question.author.username} size={22} />
            {question.author.username}
            <span className="rounded bg-mist px-1 py-0.5 text-[9px] text-teal">{question.author.points} 分</span>
          </Link>
          <span>{formatRelative(question.createdAt)}</span>
          <span className="inline-flex items-center gap-1"><Eye size={11} /> {question.views}</span>
          <span className="inline-flex items-center gap-1 sm:hidden"><MessageSquare size={11} /> {question.answersCount} 回答</span>
          <span className="ml-auto hidden text-[10px] font-semibold text-amber-deep opacity-0 transition group-hover:opacity-100 sm:inline">
            查看讨论 →
          </span>
        </div>
      </div>
    </article>
  );
}

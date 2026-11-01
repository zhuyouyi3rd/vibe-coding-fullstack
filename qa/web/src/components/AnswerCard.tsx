import { Link } from 'react-router-dom';
import { BadgeCheck, Check, Clock3 } from 'lucide-react';
import type { Answer } from '../types';
import { formatRelative } from '../lib/format';
import { Avatar } from './Avatar';
import { Markdown } from './Markdown';
import { VoteButton } from './VoteButton';

export function AnswerCard({
  answer,
  canAccept,
  currentUserId,
  onVote,
  onAccept,
  voting,
  accepting,
}: {
  answer: Answer;
  canAccept: boolean;
  currentUserId?: number;
  onVote: () => void;
  onAccept: () => void;
  voting: boolean;
  accepting: boolean;
}) {
  return (
    <article
      id={`answer-${answer.id}`}
      className={`relative rounded-xl border p-4 sm:p-5 ${
        answer.isAccepted ? 'border-teal/35 bg-teal/[0.035]' : 'border-line bg-panel/75'
      }`}
    >
      {answer.isAccepted && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-md bg-teal px-2 py-1 text-[10px] font-bold text-panel">
          <BadgeCheck size={12} />
          提问者已采纳
        </div>
      )}

      <div className="flex gap-3">
        <div className="hidden shrink-0 sm:block">
          <VoteButton
            votes={answer.votes}
            active={answer.likedByMe}
            onClick={onVote}
            disabled={voting || currentUserId === answer.author.id}
          />
        </div>

        <div className="min-w-0 flex-1">
          <Markdown content={answer.content} className="text-[0.93rem]" />

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-line/60 pt-3 text-[10px] text-teal-soft">
            <Link to={`/profile/${answer.author.id}`} className="flex items-center gap-1.5 text-ink-soft hover:text-amber-deep">
              <Avatar src={answer.author.avatar} name={answer.author.username} size={22} />
              <span className="font-medium">{answer.author.username}</span>
              <span className="rounded bg-mist px-1 py-0.5 text-[9px] text-teal">{answer.author.points} 分</span>
            </Link>
            <span className="inline-flex items-center gap-1"><Clock3 size={10} /> {formatRelative(answer.createdAt)}</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="sm:hidden">
                <VoteButton
                  votes={answer.votes}
                  active={answer.likedByMe}
                  onClick={onVote}
                  disabled={voting || currentUserId === answer.author.id}
                  size="small"
                />
              </span>
              {canAccept && !answer.isAccepted && (
                <button
                  type="button"
                  onClick={onAccept}
                  disabled={accepting}
                  className="inline-flex items-center gap-1 rounded-md border border-teal/30 bg-teal/5 px-2.5 py-1 text-[10px] font-semibold text-teal transition hover:bg-teal/10 disabled:opacity-50"
                >
                  <Check size={12} /> {accepting ? '采纳中…' : '采纳此回答'}
                </button>
              )}
              {currentUserId === answer.author.id && (
                <span className="text-[9px] text-teal-soft">你的回答</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

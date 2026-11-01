import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  CalendarDays,
  Coins,
  MessageCircle,
  MessagesSquare,
  PenLine,
  ThumbsUp,
} from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { Profile } from '../types';
import { formatDate, formatRelative } from '../lib/format';
import { usePageTitle } from '../lib/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Avatar';
import { LoadingScreen } from '../components/LoadingScreen';

type Tab = 'questions' | 'answers';

export function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const targetId = id ? Number(id) : user?.id;
  const isOwn = Boolean(user && targetId === user.id);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('questions');

  usePageTitle(profile ? `${profile.user.username}的主页` : '个人主页');

  useEffect(() => {
    if (!targetId) return;
    let active = true;
    setLoading(true);
    setError('');
    api
      .get<{ data: Profile }>(`/users/${targetId}`)
      .then(({ data }) => {
        if (active) setProfile(data.data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [targetId]);

  if (loading) return <LoadingScreen label="正在整理这个人的主页" />;

  if (error || !profile) {
    return (
      <section className="shell grid min-h-[55vh] place-items-center text-center">
        <div>
          <p className="font-display text-5xl text-amber/40">404</p>
          <h1 className="mt-3 font-display text-2xl font-semibold text-deep">没有找到这位用户</h1>
          <p className="mt-2 text-sm text-ink-soft">{error || '链接可能已经失效。'}</p>
          <Link to="/" className="btn-teal mt-6">回到首页</Link>
        </div>
      </section>
    );
  }

  const stats = profile.stats;

  return (
    <div className="shell py-8">
      <section className="relative overflow-hidden rounded-2xl bg-deep px-5 py-8 text-panel sm:px-8">
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar src={profile.user.avatar} name={profile.user.username} size={80} className="border-4! border-deep! shadow-xl -mt-2" />
            <div className="pb-1">
              <p className="text-[10px] font-bold tracking-[0.18em] text-panel/60">{isOwn ? 'MY YARD' : 'COMMUNITY MEMBER'}</p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-[-0.02em]">{profile.user.username}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-panel/60">
                <CalendarDays size={11} /> {formatDate(profile.user.createdAt)} 加入
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-xl border border-amber/25 bg-amber/10 px-4 py-2.5">
              <p className="text-[9px] tracking-[0.1em] text-amber/90">积分</p>
              <p className="font-display text-2xl font-semibold text-amber">{profile.user.points}</p>
            </div>
            {isOwn && (
              <Link to="/ask" className="btn-amber self-center">
                <PenLine size={14} /> 提个问题
              </Link>
            )}
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 border-t border-panel/10 pt-4 sm:grid-cols-4">
          {[
            { icon: MessagesSquare, label: '提问', value: stats.questionCount },
            { icon: MessageCircle, label: '回答', value: stats.answerCount },
            { icon: BadgeCheck, label: '被采纳', value: stats.acceptedCount },
            { icon: ThumbsUp, label: '获赞', value: stats.receivedVotes },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-2.5">
                <Icon size={15} className="text-amber/90" />
                <div>
                  <p className="font-display text-lg font-semibold">{item.value}</p>
                  <p className="text-[9px] text-panel/60">{item.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <div className="flex items-center gap-1 border-b border-line pb-2">
            <button
              type="button"
              onClick={() => setTab('questions')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${tab === 'questions' ? 'bg-deep text-panel' : 'text-ink-soft hover:bg-panel-deep'}`}
            >
              提问 <span className={`text-[9px] ${tab === 'questions' ? 'text-panel/60' : 'text-teal-soft'}`}>{stats.questionCount}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('answers')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${tab === 'answers' ? 'bg-deep text-panel' : 'text-ink-soft hover:bg-panel-deep'}`}
            >
              回答 <span className={`text-[9px] ${tab === 'answers' ? 'text-panel/60' : 'text-teal-soft'}`}>{stats.answerCount}</span>
            </button>
          </div>

          {tab === 'questions' ? (
            profile.questions.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-line px-6 py-12 text-center">
                <p className="font-display text-base text-deep">还没有提过问题</p>
                {isOwn && <Link to="/ask" className="btn-amber mt-4">提第一个问题</Link>}
              </div>
            ) : (
              <div className="mt-4 grid gap-2.5">
                {profile.questions.map((question) => (
                  <Link key={question.id} to={`/question/${question.id}`} className="group rounded-xl border border-line bg-panel/75 p-4 transition hover:border-teal/30 hover:bg-panel">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-display text-base font-semibold leading-6 text-deep group-hover:text-amber-deep">{question.title}</h2>
                      {question.isSolved && <span className="shrink-0 rounded bg-teal/10 px-1.5 py-0.5 text-[9px] font-bold text-teal">已解决</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-teal-soft">
                      {question.tags.slice(0, 3).map((tag) => <span key={tag}>#{tag}</span>)}
                      <span>· {formatRelative(question.createdAt)}</span>
                      <span>· {question.answersCount} 回答</span>
                      <span>· {question.votes} 赞同</span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : profile.answers.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line px-6 py-12 text-center">
              <p className="font-display text-base text-deep">还没有回答过问题</p>
              <p className="mt-1 text-xs text-teal-soft">去看看有没有你能接住的问题。</p>
            </div>
          ) : (
            <div className="mt-4 grid gap-2.5">
              {profile.answers.map((answer) => (
                <Link key={answer.id} to={`/question/${answer.questionId}#answer-${answer.id}`} className="group rounded-xl border border-line bg-panel/75 p-4 transition hover:border-teal/30 hover:bg-panel">
                  <div className="flex items-center gap-2 text-[10px] text-teal-soft">
                    <span>回答于</span>
                    <span>{formatRelative(answer.createdAt)}</span>
                    {answer.isAccepted && <span className="inline-flex items-center gap-1 rounded bg-teal/10 px-1.5 py-0.5 font-bold text-teal"><BadgeCheck size={10} /> 已采纳</span>}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-6 text-ink-soft">{answer.content}</p>
                  <p className="mt-2 truncate text-[11px] font-semibold text-deep group-hover:text-amber-deep">↳ {answer.questionTitle}</p>
                  <p className="mt-1 text-[9px] text-teal-soft">{answer.votes} 赞同</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-line bg-panel/80 p-4">
            <div className="flex items-center gap-1.5">
              <Coins size={14} className="text-amber" />
              <h2 className="text-[10px] font-bold tracking-[0.14em] text-deep">积分账本</h2>
            </div>
            <div className="mt-3 space-y-1.5 text-[10px] text-ink-soft">
              <div className="flex justify-between"><span>提问</span><span className="font-semibold text-coral">-5 / 次</span></div>
              <div className="flex justify-between"><span>回答问题</span><span className="font-semibold text-teal">+10 / 次</span></div>
              <div className="flex justify-between"><span>回答被采纳</span><span className="font-semibold text-teal">+30 / 次</span></div>
              <div className="flex justify-between"><span>内容被点赞</span><span className="font-semibold text-teal">+5 / +10</span></div>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-teal to-deep p-4 text-panel">
            <p className="text-[9px] font-bold tracking-[0.16em] text-panel/60">A SMALL REMINDER</p>
            <p className="mt-2 font-display text-sm leading-6 text-panel/85">
              积分不是目的，
              <br />
              它只是认真参与的痕迹。
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  MessageCircle,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type {
  Leader,
  Pagination as PaginationType,
  QuestionListResponse,
  QuestionSummary,
  SiteStats,
  Tag as TagType,
} from '../types';
import { formatCount } from '../lib/format';
import { usePageTitle } from '../lib/usePageTitle';
import { QuestionCard } from '../components/QuestionCard';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';
import { Avatar } from '../components/Avatar';

const sortTabs = [
  { key: 'latest', label: '最新', icon: Sparkles },
  { key: 'hot', label: '热门', icon: Flame },
  { key: 'unanswered', label: '未解决', icon: MessageCircle },
];

function FeedSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-xl border border-line bg-panel/60 p-5">
          <div className="h-2.5 w-24 rounded bg-panel-deep" />
          <div className="mt-3 h-4 w-4/5 rounded bg-panel-deep" />
          <div className="mt-2 h-3 w-full rounded bg-panel-deep/70" />
          <div className="mt-4 h-2.5 w-40 rounded bg-panel-deep/70" />
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  usePageTitle();
  const [params, setParams] = useSearchParams();
  const sort = params.get('sort') || 'latest';
  const tag = params.get('tag') || '';
  const keyword = params.get('keyword') || '';
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);

  const [draft, setDraft] = useState(keyword);
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  const [tags, setTags] = useState<TagType[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(keyword), [keyword]);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get<{ data: TagType[] }>('/tags'),
      api.get<{ data: Leader[] }>('/leaderboard'),
      api.get<{ data: SiteStats }>('/stats'),
    ])
      .then(([tagRes, leaderRes, statsRes]) => {
        if (!active) return;
        setTags(tagRes.data.data);
        setLeaders(leaderRes.data.data);
        setStats(statsRes.data.data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get<QuestionListResponse>('/questions', {
        params: {
          page,
          pageSize: 10,
          sort,
          ...(tag ? { tag } : {}),
          ...(keyword ? { keyword } : {}),
        },
      })
      .then(({ data }) => {
        if (!active) return;
        setQuestions(data.data);
        setPagination(data.pagination);
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
  }, [page, sort, tag, keyword]);

  const setFilter = useCallback(
    (next: { sort?: string; tag?: string; keyword?: string; page?: number }) => {
      const search = new URLSearchParams();
      const nextSort = next.sort !== undefined ? next.sort : sort;
      const nextTag = next.tag !== undefined ? next.tag : tag;
      const nextKeyword = next.keyword !== undefined ? next.keyword : keyword;
      const nextPage = next.page ?? 1;
      if (nextSort && nextSort !== 'latest') search.set('sort', nextSort);
      if (nextTag) search.set('tag', nextTag);
      if (nextKeyword) search.set('keyword', nextKeyword);
      if (nextPage > 1) search.set('page', String(nextPage));
      setParams(search);
    },
    [sort, tag, keyword, setParams],
  );

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setFilter({ keyword: draft.trim() });
  };

  const isFiltering = Boolean(tag || keyword);
  const unanswered = stats ? Math.max(0, stats.questions - stats.solved) : 0;
  const latestQuestion = questions[0];

  return (
    <>
      <section className="relative overflow-hidden bg-deep pb-16 pt-10 text-panel sm:pt-14">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)', backgroundSize: '54px 54px' }} />
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border border-panel/10" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-amber/10 blur-3xl" />

        <div className="shell relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber/25 bg-amber/10 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-amber">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              认真提问 · 认真回答
            </span>
            <h1 className="display-title mt-5 max-w-2xl text-[2.55rem] text-panel sm:text-[3.65rem] lg:text-[4rem]">
              把问题问清楚，
              <br />
              答案就会<span className="text-amber">靠近</span>。
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-panel/65">
              问渠是一个技术与产品社区。这里不追求最快的回答，只希望每个问题都被认真读完。
            </p>

            <form onSubmit={submitSearch} className="relative mt-7 w-full max-w-xl">
              <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-panel/60" />
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="搜索问题、技术名词或困惑…"
                aria-label="搜索问题"
                className="w-full rounded-xl border border-white/15 bg-white/[0.07] py-3.5 pl-11 pr-24 text-sm text-panel outline-none backdrop-blur placeholder:text-panel/60 focus:border-amber/50 focus:bg-white/10"
              />
              <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-amber px-4 py-2 text-xs font-bold text-[#0b2422] transition hover:bg-[#e39a5c]">
                搜索
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/ask" className="btn-amber">
                提个问题
                <ArrowRight size={15} />
              </Link>
              <Link to="/?sort=unanswered" className="inline-flex items-center gap-1.5 text-xs font-medium text-panel/65 transition hover:text-panel">
                看看谁还在等待回答
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <p className="text-[10px] tracking-[0.12em] text-panel/60">问题</p>
              <p className="mt-1 font-display text-3xl font-semibold text-panel">{stats ? formatCount(stats.questions) : '—'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <p className="text-[10px] tracking-[0.12em] text-panel/60">回答</p>
              <p className="mt-1 font-display text-3xl font-semibold text-panel">{stats ? formatCount(stats.answers) : '—'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <p className="text-[10px] tracking-[0.12em] text-panel/60">已解决</p>
              <p className="mt-1 font-display text-3xl font-semibold text-amber">{stats ? `${stats.solveRate}%` : '—'}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
              <p className="text-[10px] tracking-[0.12em] text-panel/60">等待回答</p>
              <p className="mt-1 font-display text-3xl font-semibold text-panel">{stats ? unanswered : '—'}</p>
            </div>
            {latestQuestion && (
              <Link
                to={`/question/${latestQuestion.id}`}
                className="col-span-2 hidden rounded-xl border border-amber/20 bg-amber/[0.07] p-4 transition hover:bg-amber/[0.1] lg:block"
              >
                <div className="flex items-center justify-between text-[10px] text-amber/90">
                  <span className="font-bold tracking-[0.12em]">刚刚有人在问</span>
                  <TrendingUp size={13} />
                </div>
                <p className="mt-1.5 line-clamp-1 font-display text-sm text-panel/85">{latestQuestion.title}</p>
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="shell relative z-10 -mt-6 grid gap-6 pb-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div ref={feedRef} className="min-w-0">
          <div className="rounded-xl border border-line bg-panel/90 p-2 shadow-[0_20px_50px_-45px_rgba(18,59,58,0.8)]">
            <div className="flex items-center justify-between gap-2 overflow-x-auto px-1 py-1">
              <div className="flex items-center gap-1">
                {sortTabs.map((tab) => {
                  const active = sort === tab.key;
                  const Icon = tab.icon;
                  const count = tab.key === 'unanswered' ? unanswered : stats?.questions;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setFilter({ sort: tab.key })}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        active ? 'bg-deep text-panel' : 'text-ink-soft hover:bg-panel-deep'
                      }`}
                    >
                      <Icon size={13} />
                      {tab.label}
                      {count !== undefined && (
                        <span className={`text-[9px] ${active ? 'text-panel/60' : 'text-teal-soft'}`}>{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <Link to="/ask" className="hidden shrink-0 items-center gap-1 rounded-lg border border-amber/30 bg-amber/5 px-3 py-2 text-[11px] font-semibold text-amber-deep hover:bg-amber/10 sm:inline-flex">
                我要提问
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-teal-soft">
              {loading ? '正在整理问题…' : `共 ${pagination.total} 个问题`}
              {tag && <span className="ml-1 text-ink-soft">· 标签 #{tag}</span>}
              {keyword && <span className="ml-1 text-ink-soft">· 搜索「{keyword}」</span>}
            </p>
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setDraft('');
                  setFilter({ tag: '', keyword: '', sort: 'latest' });
                }}
                className="text-[10px] font-semibold text-amber-deep underline underline-offset-4"
              >
                清除筛选
              </button>
            )}
          </div>

          <div className="mt-3">
            {error ? (
              <div className="rounded-xl border border-coral/25 bg-coral/5 p-8 text-center">
                <p className="text-sm text-coral">{error}</p>
              </div>
            ) : loading ? (
              <FeedSkeleton />
            ) : questions.length === 0 ? (
              <EmptyState
                title={isFiltering ? '没有找到相关问题' : '问题列表还是空的'}
                description={isFiltering ? '换一个关键词，或者把标签去掉看看。' : '第一个问题，往往是最难问出口的那个。'}
              />
            ) : (
              <div className="grid gap-3">
                {questions.map((question, index) => (
                  <QuestionCard key={question.id} question={question} index={index} />
                ))}
              </div>
            )}
          </div>

          {!loading && pagination.totalPages > 1 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onChange={(nextPage) => {
                setFilter({ page: nextPage });
                feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            />
          )}
        </div>

        <aside className="space-y-4">
          <section id="leaderboard" className="rounded-xl border border-line bg-panel/80 p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] text-deep">
                <Users size={13} className="text-amber" /> 积分榜
              </h2>
              <span className="text-[9px] text-teal-soft">本周</span>
            </div>
            <div className="mt-3 divide-y divide-line/60">
              {leaders.map((leader, index) => (
                <Link key={leader.id} to={`/profile/${leader.id}`} className="flex items-center gap-2.5 py-2.5">
                  <span className={`w-4 text-center font-display text-xs font-bold ${index === 0 ? 'text-amber-deep' : index < 3 ? 'text-teal' : 'text-teal-soft'}`}>
                    {index + 1}
                  </span>
                  <Avatar src={leader.avatar} name={leader.username} size={26} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">{leader.username}</p>
                    <p className="text-[9px] text-teal-soft">{leader.answerCount} 回答 · {leader.questionCount} 提问</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-deep">{leader.points}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-panel/80 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-bold tracking-[0.12em] text-deep">热门标签</h2>
              <Link to="/?sort=hot" className="text-[9px] text-teal-soft hover:text-amber-deep">更多</Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 14).map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setFilter({ tag: item.name })}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition ${
                    tag === item.name
                      ? 'border-teal bg-teal text-panel'
                      : 'border-line bg-paper/50 text-ink-soft hover:border-teal/40 hover:text-teal'
                  }`}
                >
                  #{item.name}
                  <span className={tag === item.name ? 'text-panel/65' : 'text-teal-soft'}>{item.count}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-xl bg-deep p-4 text-panel">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-amber" />
              <h2 className="text-[11px] font-bold tracking-[0.12em]">积分规则</h2>
            </div>
            <div className="mt-3 space-y-1.5 text-[10px] text-panel/60">
              <div className="flex justify-between"><span>发布问题</span><span className="font-bold text-amber">-5</span></div>
              <div className="flex justify-between"><span>回答问题</span><span className="font-bold text-[#8fc4a4]">+10</span></div>
              <div className="flex justify-between"><span>回答被采纳</span><span className="font-bold text-[#8fc4a4]">+30</span></div>
              <div className="flex justify-between"><span>问题被点赞</span><span className="font-bold text-[#8fc4a4]">+5</span></div>
              <div className="flex justify-between"><span>回答被点赞</span><span className="font-bold text-[#8fc4a4]">+10</span></div>
            </div>
            <p className="mt-3 border-t border-white/10 pt-3 font-display text-[11px] leading-5 text-panel/60">
              好问题比好答案更稀缺。
            </p>
          </section>
        </aside>
      </section>
    </>
  );
}

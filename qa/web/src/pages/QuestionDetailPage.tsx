import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  LoaderCircle,
  MessageCircle,
  PenLine,
  Send,
  Sparkles,
} from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { QuestionDetail } from '../types';
import { formatRelative } from '../lib/format';
import { usePageTitle } from '../lib/usePageTitle';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/Avatar';
import { Tag } from '../components/Tag';
import { Markdown } from '../components/Markdown';
import { VoteButton } from '../components/VoteButton';
import { AnswerCard } from '../components/AnswerCard';
import { LoadingScreen } from '../components/LoadingScreen';

export function QuestionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState(false);
  const [votingAnswerId, setVotingAnswerId] = useState<number | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState('');
  const [copied, setCopied] = useState(false);

  usePageTitle(question ? question.title : '问题');

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const { data } = await api.get<{ data: QuestionDetail }>(`/questions/${id}`);
        setQuestion(data.data);
      } catch (err) {
        if (!silent) setError(getErrorMessage(err));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const requireLogin = () => {
    if (user) return false;
    navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
    return true;
  };

  const voteQuestion = async () => {
    if (requireLogin() || !question || voting) return;
    setVoting(true);
    try {
      const { data } = await api.post<{ data: { liked: boolean; votes: number } }>(`/questions/${question.id}/vote`);
      setQuestion({ ...question, likedByMe: data.data.liked, votes: data.data.votes });
      await refreshUser();
      toast(data.data.liked ? '已点赞这个问题' : '已取消点赞', 'info');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setVoting(false);
    }
  };

  const voteAnswer = async (answerId: number) => {
    if (requireLogin() || !question || votingAnswerId) return;
    setVotingAnswerId(answerId);
    try {
      const { data } = await api.post<{ data: { liked: boolean; votes: number } }>(`/answers/${answerId}/vote`);
      setQuestion({
        ...question,
        answers: question.answers.map((answer) =>
          answer.id === answerId
            ? { ...answer, likedByMe: data.data.liked, votes: data.data.votes }
            : answer,
        ),
      });
      await refreshUser();
      toast(data.data.liked ? '已点赞这个回答' : '已取消点赞', 'info');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setVotingAnswerId(null);
    }
  };

  const acceptAnswer = async (answerId: number) => {
    if (!question) return;
    setAcceptingId(answerId);
    try {
      const { data } = await api.post<{ data: QuestionDetail }>(`/questions/${question.id}/accept`, { answerId });
      setQuestion(data.data);
      await refreshUser();
      toast('已采纳，回答者获得 30 积分');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setAcceptingId(null);
    }
  };

  const submitAnswer = async (event: FormEvent) => {
    event.preventDefault();
    if (requireLogin() || !question) return;
    setAnswerError('');
    if (content.trim().length < 5) {
      setAnswerError('回答至少写 5 个字，让提问者能看懂你的意思');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/questions/${question.id}/answers`, { content });
      setContent('');
      setPreview(false);
      await load(true);
      await refreshUser();
      toast('回答已发布，+10 积分');
      window.setTimeout(() => {
        document.getElementById('answers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } catch (err) {
      setAnswerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast('复制失败，请手动复制地址栏链接', 'error');
    }
  };

  if (loading) return <LoadingScreen label="正在打开这个问题" />;

  if (error || !question) {
    return (
      <section className="shell grid min-h-[55vh] place-items-center text-center">
        <div>
          <p className="font-display text-5xl text-amber/40">404</p>
          <h1 className="mt-3 font-display text-2xl font-semibold text-deep">这个问题找不到了</h1>
          <p className="mt-2 text-sm text-ink-soft">{error || '它可能已经被删除，或者链接写错了。'}</p>
          <Link to="/" className="btn-teal mt-6">回到问题列表</Link>
        </div>
      </section>
    );
  }

  const isAuthor = user?.id === question.author.id;
  const sortedAnswers = question.answers;

  return (
    <div className="shell py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-soft transition hover:text-amber-deep">
          <ArrowLeft size={14} /> 返回问题列表
        </Link>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[10px] font-semibold text-ink-soft transition hover:border-teal/40"
        >
          <Copy size={12} /> {copied ? '链接已复制' : '复制链接'}
        </button>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <article className="rounded-xl border border-line bg-panel/85 p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-1.5">
              {question.isSolved ? (
                <span className="inline-flex items-center gap-1 rounded bg-teal/10 px-2 py-0.5 text-[10px] font-bold text-teal">
                  <CheckCircle2 size={12} /> 已解决
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-amber/10 px-2 py-0.5 text-[10px] font-bold text-amber-deep">
                  <Sparkles size={11} /> 等待好答案
                </span>
              )}
              {question.tags.map((tag) => <Tag key={tag} name={tag} />)}
            </div>

            <h1 className="mt-4 font-display text-[1.8rem] font-semibold leading-[1.4] tracking-[-0.025em] text-deep sm:text-[2.15rem]">
              {question.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] text-teal-soft">
              <span className="inline-flex items-center gap-1"><Clock3 size={11} /> 提问于 {formatRelative(question.createdAt)}</span>
              <span className="inline-flex items-center gap-1"><Eye size={11} /> {question.views} 次浏览</span>
              <span className="inline-flex items-center gap-1"><MessageCircle size={11} /> {question.answersCount} 个回答</span>
            </div>

            <div className="mt-5 flex gap-4">
              <div className="hidden shrink-0 sm:block">
                <VoteButton votes={question.votes} active={question.likedByMe} onClick={voteQuestion} disabled={voting || isAuthor} />
              </div>
              <div className="min-w-0 flex-1">
                <Markdown content={question.content} />
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-4">
                  <div className="flex items-center gap-2">
                    <Avatar src={question.author.avatar} name={question.author.username} size={30} />
                    <div>
                      <Link to={`/profile/${question.author.id}`} className="text-xs font-semibold text-ink hover:text-amber-deep">
                        {question.author.username}
                      </Link>
                      <p className="text-[9px] text-teal-soft">提问者 · {question.author.points} 积分</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="sm:hidden">
                      <VoteButton votes={question.votes} active={question.likedByMe} onClick={voteQuestion} disabled={voting || isAuthor} size="small" />
                    </span>
                    <span className="text-[10px] text-teal-soft">{question.votes} 人觉得这个问题有价值</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <section id="answers" className="mt-7 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <h2 className="font-display text-xl font-semibold text-deep">
                {question.answersCount} 个回答
                {question.isSolved && <span className="ml-2 text-[10px] font-sans font-normal text-teal">已有一个被采纳</span>}
              </h2>
              <span className="text-[10px] text-teal-soft">按「已采纳 → 赞同数 → 时间」排序</span>
            </div>

            <div className="mt-4 grid gap-3">
              {sortedAnswers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-panel/40 px-5 py-10 text-center">
                  <p className="font-display text-base text-deep">还没有人回答</p>
                  <p className="mt-1 text-xs text-teal-soft">如果你正好知道答案，别让这个问题等太久。</p>
                </div>
              ) : (
                sortedAnswers.map((answer) => (
                  <AnswerCard
                    key={answer.id}
                    answer={answer}
                    canAccept={Boolean(isAuthor && !question.isSolved)}
                    currentUserId={user?.id}
                    onVote={() => voteAnswer(answer.id)}
                    onAccept={() => acceptAnswer(answer.id)}
                    voting={votingAnswerId === answer.id}
                    accepting={acceptingId === answer.id}
                  />
                ))
              )}
            </div>
          </section>

          <section className="mt-7 rounded-xl border border-line bg-panel/75 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine size={15} className="text-amber" />
                <h2 className="font-display text-lg font-semibold text-deep">写下你的回答</h2>
              </div>
              <span className="text-[10px] font-semibold text-teal">+10 积分</span>
            </div>

            {user ? (
              <form onSubmit={submitAnswer} className="mt-3">
                <div className="flex items-center gap-1 border-b border-line/70 pb-2">
                  <button type="button" onClick={() => setPreview(false)} className={`rounded px-2 py-1 text-[10px] font-semibold ${!preview ? 'bg-deep text-panel' : 'text-teal-soft'}`}>编辑</button>
                  <button type="button" onClick={() => setPreview(true)} className={`rounded px-2 py-1 text-[10px] font-semibold ${preview ? 'bg-deep text-panel' : 'text-teal-soft'}`}>预览</button>
                  <span className="ml-auto text-[9px] text-teal-soft">支持 Markdown</span>
                </div>
                {preview ? (
                  <div className="min-h-40 px-1 py-3">
                    {content ? <Markdown content={content} /> : <p className="text-xs text-teal-soft">还没有内容。</p>}
                  </div>
                ) : (
                  <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={7}
                    aria-label="回答内容"
                    className="editor-area mt-2 min-h-40"
                    placeholder="先复述一下你的理解，再说具体怎么做。可以贴代码，但别忘了解释为什么……"
                  />
                )}
                {answerError && <p className="mt-2 text-[11px] text-coral">{answerError}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[9px] text-teal-soft">回答发布后不可编辑，请检查后再提交</span>
                  <button type="submit" disabled={submitting} className="btn-teal">
                    {submitting ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}
                    {submitting ? '发布中…' : '发布回答'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-line bg-paper/40 p-5 text-center">
                <p className="text-xs text-ink-soft">登录后即可回答，回答一次获得 10 积分。</p>
                <Link to="/login" state={{ from: location.pathname }} className="btn-teal mt-3">去登录</Link>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-line bg-panel/80 p-4">
            <h2 className="text-[10px] font-bold tracking-[0.14em] text-teal-soft">问题信息</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-paper/60 py-2">
                <p className="font-display text-lg font-semibold text-deep">{question.votes}</p>
                <p className="text-[9px] text-teal-soft">赞同</p>
              </div>
              <div className="rounded-lg bg-paper/60 py-2">
                <p className="font-display text-lg font-semibold text-deep">{question.answersCount}</p>
                <p className="text-[9px] text-teal-soft">回答</p>
              </div>
              <div className="rounded-lg bg-paper/60 py-2">
                <p className="font-display text-lg font-semibold text-deep">{question.views}</p>
                <p className="text-[9px] text-teal-soft">浏览</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-teal/5 px-2.5 py-2 text-[10px] text-teal">
              <CheckCircle2 size={12} />
              {question.isSolved ? '提问者已采纳答案' : '尚未解决，欢迎补充'}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-panel/80 p-4">
            <h2 className="text-[10px] font-bold tracking-[0.14em] text-teal-soft">提问者</h2>
            <Link to={`/profile/${question.author.id}`} className="mt-3 flex items-center gap-2.5">
              <Avatar src={question.author.avatar} name={question.author.username} size={38} />
              <div>
                <p className="text-xs font-semibold text-ink">{question.author.username}</p>
                <p className="text-[9px] text-teal-soft">{question.author.points} 积分</p>
              </div>
            </Link>
            <p className="mt-3 border-t border-line/60 pt-3 text-[10px] leading-5 text-ink-soft">
              如果这个回答解决了你的问题，记得点一下「采纳」。这会让回答者获得 30 积分。
            </p>
          </section>

          <div className="rounded-xl bg-gradient-to-br from-teal to-deep p-4 text-panel">
            <p className="text-[9px] font-bold tracking-[0.16em] text-panel/60">WENQU NOTES</p>
            <p className="mt-2 font-display text-sm leading-6 text-panel/85">
              先问对问题，
              <br />
              答案才有地方落脚。
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  Link2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { PostDetail, PostListResponse, PostSummary } from '../types';
import { formatDate, formatViews, readingTime } from '../lib/format';
import { Avatar } from '../components/Avatar';
import { CoverImage } from '../components/CoverImage';
import { LoadingScreen } from '../components/LoadingScreen';
import { PostCard } from '../components/PostCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePageTitle } from '../lib/usePageTitle';

function textOf(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [related, setRelated] = useState<PostSummary[]>([]);

  usePageTitle(post ? post.title : '文章');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    setPost(null);
    setRelated([]);
    setConfirmDelete(false);
    api
      .get<{ data: PostDetail }>(`/posts/${id}`)
      .then(({ data }) => {
        if (active) setPost(data.data);
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
  }, [id]);

  useEffect(() => {
    if (!post) return;
    let active = true;
    api
      .get<PostListResponse>('/posts', {
        params: { category: post.category.slug, pageSize: 4 },
      })
      .then(({ data }) => {
        if (active) setRelated(data.data.filter((item) => item.id !== post.id).slice(0, 3));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [post]);

  const headings = useMemo(() => {
    if (!post) return [];
    return post.content
      .split('\n')
      .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => ({
        level: match[1].length,
        text: match[2].replace(/[*_`]/g, '').trim(),
        id: slugify(match[2].replace(/[*_`]/g, '').trim()),
      }));
  }, [post]);

  const isOwner = Boolean(user && post && user.id === post.author.id);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast('复制失败，请手动复制地址栏链接', 'error');
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${post.id}`);
      toast('文章已删除');
      navigate('/');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) return <LoadingScreen label="正在翻开这一页" />;

  if (error || !post) {
    return (
      <section className="page-shell grid min-h-[60vh] place-items-center py-16 text-center">
        <div>
          <p className="font-display text-6xl text-clay/30">404</p>
          <h1 className="mt-3 font-display text-2xl font-semibold text-forest-deep">这一页没有找到</h1>
          <p className="mt-2 text-sm text-ink-soft">{error || '文章可能被作者删除了。'}</p>
          <Link to="/" className="btn-primary mt-6">
            <ArrowLeft size={15} />
            回到首页
          </Link>
        </div>
      </section>
    );
  }

  return (
    <article>
      <div className="page-shell pt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-moss transition hover:text-clay-deep"
        >
          <ArrowLeft size={14} />
          返回文章列表
        </Link>
      </div>

      <header className="page-shell pb-8 pt-6 sm:pt-9">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
            <Link
              to={`/?category=${post.category.slug}`}
              className="rounded-full bg-forest/10 px-3 py-1 font-semibold tracking-[0.08em] text-forest"
            >
              {post.category.name}
            </Link>
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-line px-2.5 py-1 text-moss">
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="display-title mx-auto mt-6 max-w-3xl text-[2.1rem] text-forest-deep sm:text-[3rem] lg:text-[3.35rem]">
            {post.title}
          </h1>
          <div className="mx-auto mt-7 flex max-w-2xl flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs text-ink-soft">
            <Link
              to={`/author/${post.author.id}`}
              className="flex items-center gap-2 font-medium transition hover:text-clay-deep"
            >
              <Avatar src={post.author.avatar} name={post.author.username} size={30} />
              {post.author.username}
            </Link>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={13} className="text-moss" />
              {formatDate(post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={13} className="text-moss" />
              {readingTime(post.content)} 分钟阅读
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye size={13} className="text-moss" />
              {formatViews(post.views)} 次浏览
            </span>
          </div>
        </div>
      </header>

      <div className="page-shell">
        <CoverImage
          src={post.cover}
          alt={post.title}
          className="mx-auto aspect-[16/8] w-full max-w-5xl rounded-[1.4rem] border border-line/70 object-cover shadow-[0_30px_70px_-48px_rgba(29,43,38,0.7)]"
        />
      </div>

      <div className="page-shell mt-10 lg:mt-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_15rem] lg:items-start">
          <div className="mx-auto w-full max-w-3xl">
            {isOwner && (
              <div className="mb-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forest/15 bg-forest/[0.035] px-4 py-3">
                <p className="text-xs text-forest">这是你的文章，可以随时修改或删除。</p>
                <div className="flex items-center gap-2">
                  <Link to={`/write/${post.id}`} className="btn-ghost px-3! py-1.5! text-xs!">
                    <Pencil size={13} />
                    编辑
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-clay/30 px-3 py-1.5 text-xs font-semibold text-clay-deep transition hover:bg-clay/10"
                  >
                    <Trash2 size={13} />
                    删除
                  </button>
                </div>
              </div>
            )}

            {confirmDelete && (
              <div className="mb-7 rounded-xl border border-clay/30 bg-[#fff6f1] p-4 animate-fade">
                <p className="text-sm font-semibold text-clay-deep">确定要删除《{post.title}》吗？</p>
                <p className="mt-1 text-xs text-ink-soft">删除后无法恢复。</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-full bg-clay px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-clay-deep disabled:opacity-60"
                  >
                    {deleting ? '删除中…' : '确认删除'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-ink-soft"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="prose-article article-drop-cap">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
                  h3: ({ children }) => <h3 id={slugify(textOf(children))}>{children}</h3>,
                  a: ({ href, children }) => (
                    <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto">
                      <table>{children}</table>
                    </div>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-paper-deep/70 px-3 py-1 text-[11px] text-ink-soft">
                    #{tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[11px] font-semibold text-ink-soft transition hover:border-forest/40 hover:text-forest"
              >
                {copied ? <Check size={13} /> : <Link2 size={13} />}
                {copied ? '链接已复制' : '复制链接'}
              </button>
            </div>

            <div className="mt-10 flex flex-col gap-4 rounded-[1.2rem] border border-line bg-paper-light/60 p-5 sm:flex-row sm:items-center">
              <Avatar src={post.author.avatar} name={post.author.username} size={54} />
              <div className="flex-1">
                <p className="text-[10px] font-bold tracking-[0.18em] text-moss">写于此处</p>
                <Link
                  to={`/author/${post.author.id}`}
                  className="mt-1 inline-flex items-center gap-1 font-display text-lg font-semibold text-forest-deep hover:text-clay-deep"
                >
                  {post.author.username}
                  <ArrowRight size={14} />
                </Link>
                <p className="mt-1 text-xs leading-6 text-ink-soft/80">
                  感谢你读到这里。如果这篇文章让你想起了什么，欢迎写下来。
                </p>
              </div>
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              {headings.length > 0 && (
                <div className="rounded-[1rem] border border-line/80 bg-paper-light/45 p-4">
                  <p className="text-[10px] font-bold tracking-[0.18em] text-moss">本文目录</p>
                  <nav className="mt-3 grid gap-1.5">
                    {headings.map((heading) => (
                      <a
                        key={`${heading.id}-${heading.text}`}
                        href={`#${heading.id}`}
                        className={`border-l border-line py-0.5 text-[11px] leading-5 text-ink-soft transition hover:border-clay hover:text-clay-deep ${
                          heading.level === 3 ? 'pl-5' : 'pl-3'
                        }`}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}
              <div className="rounded-[1rem] bg-forest-deep p-4 text-paper">
                <p className="text-[10px] font-bold tracking-[0.18em] text-paper/45">阅读提示</p>
                <p className="mt-2 font-display text-sm leading-6 text-paper/85">
                  慢一点读，
                  <br />
                  让句子在脑子里多待一会儿。
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <section className="page-shell mt-20 border-t border-line pt-10">
          <div className="flex items-end justify-between">
            <div>
              <span className="eyebrow">同类文章</span>
              <h2 className="mt-3 font-display text-2xl font-semibold text-forest-deep">
                也许你还会喜欢
              </h2>
            </div>
            <Link
              to={`/?category=${post.category.slug}`}
              className="hidden text-xs font-semibold text-clay-deep sm:inline-flex sm:items-center sm:gap-1"
            >
              查看全部 <ArrowRight size={13} />
            </Link>
          </div>
          <div className="mt-7 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, index) => (
              <PostCard key={item.id} post={item} index={index} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

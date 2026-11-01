import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowRight, Feather, Search, Sparkles } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { Category, Pagination as PaginationType, PostListResponse, PostSummary } from '../types';
import { FeaturedPost } from '../components/FeaturedPost';
import { PostCard } from '../components/PostCard';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';
import { usePageTitle } from '../lib/usePageTitle';

function SkeletonGrid() {
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[16/10] rounded-[1.1rem] bg-paper-deep/80" />
          <div className="mt-4 h-3 w-24 rounded bg-paper-deep" />
          <div className="mt-3 h-5 w-4/5 rounded bg-paper-deep" />
          <div className="mt-2 h-3 w-full rounded bg-paper-deep/70" />
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  usePageTitle();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1);
  const category = params.get('category') || '';
  const keyword = params.get('keyword') || '';

  const [searchDraft, setSearchDraft] = useState(keyword);
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationType>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const listRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setSearchDraft(keyword);
  }, [keyword]);

  useEffect(() => {
    let active = true;
    api
      .get<{ data: Category[] }>('/categories')
      .then(({ data }) => {
        if (active) setCategories(data.data);
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
      .get<PostListResponse>('/posts', {
        params: {
          page,
          pageSize: 10,
          ...(category ? { category } : {}),
          ...(keyword ? { keyword } : {}),
        },
      })
      .then(({ data }) => {
        if (!active) return;
        setPosts(data.data);
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
  }, [page, category, keyword, refreshKey]);

  const setFilter = useCallback(
    (next: { category?: string; keyword?: string; page?: number }) => {
      const search = new URLSearchParams();
      const nextCategory = next.category !== undefined ? next.category : category;
      const nextKeyword = next.keyword !== undefined ? next.keyword : keyword;
      const nextPage = next.page ?? 1;
      if (nextCategory) search.set('category', nextCategory);
      if (nextKeyword) search.set('keyword', nextKeyword);
      if (nextPage > 1) search.set('page', String(nextPage));
      setParams(search);
    },
    [category, keyword, setParams],
  );

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setFilter({ keyword: searchDraft.trim() });
  };

  const featured = page === 1 && !category && !keyword ? posts[0] : undefined;
  const gridPosts = featured ? posts.slice(1) : posts;
  const activeCategory = categories.find((item) => item.slug === category);
  const isFiltering = Boolean(category || keyword);
  const totalViews = posts.reduce((sum, post) => sum + post.views, 0);

  return (
    <>
      <section className="page-shell relative pb-10 pt-10 sm:pt-16 lg:pt-20">
        <div className="grid items-end gap-10 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="animate-rise">
            <span className="eyebrow">一个人的编辑部 · 第 01 卷</span>
            <h1 className="display-title mt-5 max-w-3xl text-[2.85rem] text-forest-deep sm:text-[4.3rem] lg:text-[5.1rem]">
              把想法写下来，
              <br />
              让时间<span className="relative mx-1 inline-block text-clay">
                慢
                <svg
                  viewBox="0 0 120 12"
                  className="absolute -bottom-1 left-0 w-full text-clay/45"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M2 8C26 3 58 2 118 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
              一点。
            </h1>
            <p className="mt-6 max-w-xl text-[0.95rem] leading-8 text-ink-soft">
              关于技术、产品与生活的个人博客。记录那些值得被反复想起的瞬间，
              也记录一个普通人是如何理解这个世界的。
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href="#latest" className="btn-primary">
                开始阅读
                <ArrowDown size={15} />
              </a>
              <Link to="/write" className="btn-ghost">
                <Feather size={15} />
                写一篇文章
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-line/80 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <p className="font-display text-3xl font-semibold text-forest-deep">{pagination.total}</p>
              <p className="mt-1 text-[11px] tracking-[0.12em] text-moss">篇文章</p>
            </div>
            <div>
              <p className="font-display text-3xl font-semibold text-forest-deep">{categories.length || 4}</p>
              <p className="mt-1 text-[11px] tracking-[0.12em] text-moss">个分类</p>
            </div>
            <div>
              <p className="font-display text-3xl font-semibold text-forest-deep">
                {totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews}
              </p>
              <p className="mt-1 text-[11px] tracking-[0.12em] text-moss">次阅读</p>
            </div>
            <p className="col-span-3 mt-4 border-t border-line/60 pt-4 font-display text-xs leading-6 text-moss">
              “写作不是为了被看见，是为了看清自己。”
            </p>
          </div>
        </div>
      </section>

      {featured && !loading && (
        <section className="page-shell pb-4">
          <div className="grid gap-6 lg:grid-cols-[1.62fr_0.78fr]">
            <FeaturedPost post={featured} />
            <aside className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.2rem] border border-line bg-paper-light/60 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-[0.16em] text-moss">分类索引</span>
                  <Sparkles size={14} className="text-clay/70" />
                </div>
                <div className="mt-3 divide-y divide-line/60">
                  {categories.map((item, index) => (
                    <Link
                      key={item.id}
                      to={`/?category=${item.slug}`}
                      className="group flex items-center justify-between py-2.5"
                    >
                      <span className="flex items-center gap-2 text-xs font-medium text-ink-soft transition group-hover:text-clay-deep">
                        <span className="font-display text-[10px] text-moss/70">0{index + 1}</span>
                        {item.name}
                      </span>
                      <span className="text-[10px] text-moss/70">{item.postCount ?? 0}</span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-[1.2rem] bg-forest-deep p-5 text-paper">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full border border-paper/10" />
                <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full border border-paper/10" />
                <p className="text-[10px] font-semibold tracking-[0.2em] text-paper/50">EDITOR'S NOTE</p>
                <p className="mt-3 font-display text-lg leading-8">
                  慢慢写，
                  <br />
                  慢慢长。
                </p>
                <p className="mt-3 text-[11px] leading-5 text-paper/55">
                  这里没有算法推荐，只有按时间排列的真心话。
                </p>
              </div>
            </aside>
          </div>
        </section>
      )}

      <section className="page-shell pt-12" id="latest" ref={listRef}>
        <div className="flex flex-col gap-5 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="eyebrow">{isFiltering ? '筛选结果' : '最近写下'}</span>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-forest-deep">
              {activeCategory ? activeCategory.name : keyword ? `关于「${keyword}」` : '字里行间'}
            </h2>
          </div>
          <p className="text-xs text-moss">
            {loading ? '正在翻页…' : `共 ${pagination.total} 篇 · 第 ${pagination.page} / ${pagination.totalPages} 页`}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-4 pb-8">
          <form onSubmit={submitSearch} className="relative w-full sm:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-moss" />
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              className="field rounded-full! bg-paper-light/70! py-2.5! pl-10! pr-24!"
              placeholder="搜索标题或正文…"
              aria-label="搜索文章"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-forest px-3.5 py-1.5 text-[11px] font-semibold text-paper transition hover:bg-forest-deep"
            >
              搜索
            </button>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilter({ category: '' })}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${
                !category
                  ? 'border-forest bg-forest text-paper'
                  : 'border-line bg-paper-light/50 text-ink-soft hover:border-forest/40'
              }`}
            >
              全部
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter({ category: item.slug })}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${
                  category === item.slug
                    ? 'border-forest bg-forest text-paper'
                    : 'border-line bg-paper-light/50 text-ink-soft hover:border-forest/40'
                }`}
              >
                {item.name}
                <span className={`ml-1.5 ${category === item.slug ? 'text-paper/55' : 'text-moss/60'}`}>
                  {item.postCount ?? 0}
                </span>
              </button>
            ))}
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setSearchDraft('');
                  setFilter({ category: '', keyword: '' });
                }}
                className="shrink-0 px-2 text-[11px] font-medium text-clay-deep underline underline-offset-4"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-clay/25 bg-clay/5 p-8 text-center">
            <p className="text-sm text-clay-deep">{error}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="btn-ghost mt-4"
            >
              重新加载
            </button>
          </div>
        ) : loading ? (
          <SkeletonGrid />
        ) : gridPosts.length === 0 && !featured ? (
          <EmptyState
            description={
              isFiltering
                ? '没有找到匹配的文章。试试更短的关键词，或换一个分类。'
                : '第一篇还在路上。不如就从你开始？'
            }
            action={isFiltering ? 'clear' : 'write'}
            onClear={() => {
              setSearchDraft('');
              setFilter({ category: '', keyword: '' });
            }}
          />
        ) : (
          <div className="grid gap-x-6 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            onChange={(nextPage) => {
              setFilter({ page: nextPage });
              listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        )}
      </section>

      <section className="page-shell mt-20">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-line bg-gradient-to-br from-paper-light via-paper to-paper-deep/60 px-6 py-10 sm:px-10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full border border-forest/10" />
          <div className="absolute -bottom-16 right-24 h-48 w-48 rounded-full border border-clay/10" />
          <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <span className="eyebrow">也来写一点</span>
              <h2 className="mt-3 font-display text-2xl font-semibold text-forest-deep sm:text-3xl">
                你的故事，也值得一个安静的角落。
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-ink-soft/80">
                注册后即可发布自己的文章。不用想好全部，先写下第一句。
              </p>
            </div>
            <Link to="/register" className="btn-primary shrink-0">
              创建我的账号
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

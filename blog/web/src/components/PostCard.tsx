import { Link } from 'react-router-dom';
import { ArrowUpRight, Eye } from 'lucide-react';
import type { PostSummary } from '../types';
import { formatShortDate, formatViews } from '../lib/format';
import { Avatar } from './Avatar';
import { CoverImage } from './CoverImage';

export function PostCard({ post, index = 0 }: { post: PostSummary; index?: number }) {
  return (
    <article
      className="group flex flex-col animate-rise"
      style={{ animationDelay: `${Math.min(index, 6) * 55}ms` }}
    >
      <Link
        to={`/post/${post.id}`}
        className="relative block overflow-hidden rounded-[1.1rem] border border-line/60 bg-paper-deep"
      >
        <CoverImage
          src={post.cover}
          alt={post.title}
          className="aspect-[16/10] w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-forest-deep backdrop-blur">
          {post.category.name}
        </span>
        <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-forest-deep/80 text-paper opacity-0 backdrop-blur transition duration-300 group-hover:opacity-100">
          <ArrowUpRight size={14} />
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-1 pt-4">
        <div className="flex items-center gap-2 text-[11px] text-moss">
          <time dateTime={post.createdAt}>{formatShortDate(post.createdAt)}</time>
          <span className="h-0.5 w-0.5 rounded-full bg-moss/60" />
          <span className="inline-flex items-center gap-1">
            <Eye size={11} />
            {formatViews(post.views)}
          </span>
        </div>

        <h3 className="mt-2 font-display text-[1.28rem] font-semibold leading-[1.45] tracking-[-0.02em] text-forest-deep">
          <Link
            to={`/post/${post.id}`}
            className="bg-gradient-to-r from-clay to-clay bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-all duration-300 group-hover:bg-[length:100%_1px]"
          >
            {post.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-[0.82rem] leading-6 text-ink-soft/85">{post.excerpt}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <Link
            to={`/author/${post.author.id}`}
            className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-ink-soft transition hover:text-clay-deep"
          >
            <Avatar src={post.author.avatar} name={post.author.username} size={24} />
            <span className="truncate">{post.author.username}</span>
          </Link>
          {post.tags.length > 0 && (
            <span className="truncate text-[10px] tracking-wide text-moss/80">
              #{post.tags.slice(0, 2).join(' · #')}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

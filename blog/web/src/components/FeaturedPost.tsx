import { Link } from 'react-router-dom';
import { ArrowRight, Eye } from 'lucide-react';
import type { PostSummary } from '../types';
import { formatDate, formatViews, readingTime } from '../lib/format';
import { Avatar } from './Avatar';
import { CoverImage } from './CoverImage';

export function FeaturedPost({ post }: { post: PostSummary }) {
  return (
    <article className="group relative overflow-hidden rounded-[1.4rem] border border-line bg-paper-light/80 p-2.5 shadow-[0_28px_60px_-42px_rgba(29,43,38,0.75)] animate-rise">
      <Link to={`/post/${post.id}`} className="block overflow-hidden rounded-[1.05rem]">
        <div className="relative aspect-[16/9] overflow-hidden">
          <CoverImage
            src={post.cover}
            alt={post.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/55 via-transparent to-transparent" />
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between text-paper">
            <span className="rounded-full bg-paper/15 px-3 py-1 text-[10px] font-bold tracking-[0.16em] backdrop-blur-md">
              本期推荐 · {post.category.name}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-paper/85">
              <Eye size={12} /> {formatViews(post.views)}
            </span>
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3 pt-4">
        <h2 className="font-display text-[1.7rem] font-semibold leading-[1.35] tracking-[-0.03em] text-forest-deep sm:text-[1.9rem]">
          <Link to={`/post/${post.id}`}>{post.title}</Link>
        </h2>
        <p className="mt-2.5 line-clamp-2 text-sm leading-7 text-ink-soft/90">{post.excerpt}</p>
        <div className="mt-4 flex items-center justify-between border-t border-line/70 pt-3.5">
          <Link
            to={`/author/${post.author.id}`}
            className="flex items-center gap-2 text-xs text-ink-soft transition hover:text-clay-deep"
          >
            <Avatar src={post.author.avatar} name={post.author.username} size={28} />
            <span className="font-medium">{post.author.username}</span>
            <span className="text-moss/70">· {formatDate(post.createdAt)}</span>
          </Link>
          <Link
            to={`/post/${post.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-clay-deep"
          >
            阅读 {readingTime(post.excerpt)} 分钟
            <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

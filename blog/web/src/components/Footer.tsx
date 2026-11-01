import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line/80">
      <div className="page-shell grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[0.35rem] bg-clay font-display text-sm text-paper">
              拾
            </span>
            <span className="font-display text-lg font-semibold tracking-[0.08em] text-forest-deep">
              拾语
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-ink-soft">
            一个关于技术、产品与生活的个人博客。把散落的想法拾起来，写成可以慢慢读的字。
          </p>
          <p className="mt-5 font-display text-xs tracking-[0.18em] text-moss">
            用文字打捞时间 · 2026
          </p>
        </div>

        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-moss">浏览</p>
          <div className="mt-4 grid gap-2.5 text-sm text-ink-soft">
            <Link to="/" className="transition hover:text-clay-deep">全部文章</Link>
            <Link to="/?category=tech" className="transition hover:text-clay-deep">技术手记</Link>
            <Link to="/?category=product" className="transition hover:text-clay-deep">产品思考</Link>
            <Link to="/?category=reading" className="transition hover:text-clay-deep">阅读笔记</Link>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-moss">关于</p>
          <div className="mt-4 grid gap-2.5 text-sm text-ink-soft">
            <Link to="/write" className="inline-flex items-center gap-1 transition hover:text-clay-deep">
              写下新文章 <ArrowUpRight size={13} />
            </Link>
            <Link to="/profile" className="transition hover:text-clay-deep">个人中心</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-clay-deep">
              GitHub <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-line/60">
        <div className="page-shell flex flex-col gap-2 py-5 text-[11px] text-moss sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 拾语 · 保留所有文字与图片</span>
          <span className="tracking-[0.14em]">BUILT WITH REACT · EXPRESS · MYSQL</span>
        </div>
      </div>
    </footer>
  );
}

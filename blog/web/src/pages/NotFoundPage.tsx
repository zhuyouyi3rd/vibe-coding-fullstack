import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { usePageTitle } from '../lib/usePageTitle';

export function NotFoundPage() {
  usePageTitle('页面未找到');
  return (
    <section className="page-shell grid min-h-[65vh] place-items-center py-16">
      <div className="max-w-lg text-center">
        <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-[0.6rem] border border-clay/30 bg-clay/5">
          <span className="font-display text-4xl text-clay">拾</span>
          <span className="absolute inset-2 rounded-[0.25rem] border border-clay/20" />
        </div>
        <p className="mt-7 text-[10px] font-bold tracking-[0.24em] text-moss">PAGE NOT FOUND · 404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-forest-deep">这一页走丢了</h1>
        <p className="mt-3 text-sm leading-7 text-ink-soft">
          可能是链接写错了，也可能是文章被作者收进了抽屉。回到院子里重新逛逛吧。
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link to="/" className="btn-primary">
            <ArrowLeft size={15} />
            回到首页
          </Link>
          <Link to="/?category=life" className="btn-ghost">
            <Compass size={15} />
            随便看看
          </Link>
        </div>
      </div>
    </section>
  );
}

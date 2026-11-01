import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { usePageTitle } from '../lib/usePageTitle';

export function NotFoundPage() {
  usePageTitle('页面未找到');
  return (
    <section className="shell grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-xl border border-amber/30 bg-amber/5">
          <span className="font-display text-3xl text-amber-deep">问</span>
        </div>
        <p className="mt-6 text-[10px] font-bold tracking-[0.22em] text-teal-soft">PAGE NOT FOUND · 404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-deep">这个问题不存在</h1>
        <p className="mt-2 text-sm leading-7 text-ink-soft">可能是链接写错了，也可能问题已经被收走。回到渠边重新看看。</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to="/" className="btn-teal"><ArrowLeft size={14} /> 回到首页</Link>
          <Link to="/?sort=hot" className="btn-outline"><Compass size={14} /> 看看热门</Link>
        </div>
      </div>
    </section>
  );
}

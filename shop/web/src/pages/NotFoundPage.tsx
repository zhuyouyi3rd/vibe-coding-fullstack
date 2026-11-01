import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <section className="shell grid min-h-[60vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-md border border-brick/30 bg-brick/5"><span className="font-display text-3xl text-brick">云</span></div>
        <p className="mt-6 text-[10px] font-bold tracking-[0.22em] text-olive">PAGE NOT FOUND · 404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">这一页不在店里</h1>
        <p className="mt-2 text-sm leading-7 text-ink-soft">可能是链接写错了。回到店里重新逛逛，也许会遇到别的东西。</p>
        <div className="mt-6 flex justify-center gap-2"><Link to="/" className="btn-brick"><ArrowLeft size={14} /> 回到商店</Link><Link to="/cart" className="btn-outline"><Compass size={14} /> 看看购物车</Link></div>
      </div>
    </section>
  );
}

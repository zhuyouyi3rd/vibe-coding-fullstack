import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function AuthLayout({ mode, title, subtitle, footer, children }: { mode: 'login' | 'register'; title: string; subtitle: string; footer: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-olive-deep p-10 text-panel lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '27px 27px' }} />
        <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full border border-panel/10" />
        <Link to="/" className="relative inline-flex items-center gap-2 text-xs text-panel/60 hover:text-panel"><ArrowLeft size={14} /> 回到云市</Link>
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="grid h-12 w-12 place-items-center rounded-[0.3rem] bg-brick font-display text-xl">云</span>
            <span className="text-[9px] font-bold tracking-[0.22em] text-panel/50">YUNSHI GOODS</span>
          </div>
          <p className="mt-8 font-display text-[2.7rem] font-semibold leading-[1.35] tracking-[-0.03em] xl:text-[3.1rem]">
            {mode === 'login' ? <>欢迎回来，<br />你的购物车还在。</> : <>给日常，<br />留一点喜欢的东西。</>}
          </p>
          <p className="mt-5 max-w-sm text-sm leading-8 text-panel/60">
            {mode === 'login' ? '登录后继续挑选、下单，或者看看之前买过什么。' : '注册后可以保存收货地址、管理订单，也能把喜欢的东西先放进购物车。'}
          </p>
        </div>
        <p className="relative border-t border-panel/10 pt-5 font-display text-[11px] tracking-[0.08em] text-panel/40">把日子，过成喜欢的样子。</p>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md animate-rise">
          <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-xs text-ink-soft lg:hidden"><ArrowLeft size={14} /> 回到云市</Link>
          <span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN YUNSHI'}</span>
          <h1 className="mt-3 font-display text-[2.1rem] font-semibold tracking-[-0.03em]">{title}</h1>
          <p className="mt-2 text-sm leading-7 text-ink-soft">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <div className="mt-6 text-center text-xs text-ink-soft">{footer}</div>
        </div>
      </main>
    </div>
  );
}

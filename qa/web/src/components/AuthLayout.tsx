import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircleQuestion } from 'lucide-react';

export function AuthLayout({
  mode,
  title,
  subtitle,
  footer,
  children,
}: {
  mode: 'login' | 'register';
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-deep p-10 text-panel lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '26px 26px' }} />
        <div className="absolute -right-24 top-16 h-72 w-72 rounded-full border border-panel/10" />
        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full border border-amber/15" />

        <Link to="/" className="relative inline-flex items-center gap-2 text-xs text-panel/60 transition hover:text-panel">
          <ArrowLeft size={14} /> 回到问渠
        </Link>

        <div className="relative">
          <div className="flex items-center gap-2.5">
            <span className="grid h-12 w-12 place-items-center rounded-[0.5rem] bg-amber font-display text-xl text-deep">问</span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-panel/60">WENQU · Q&A</span>
          </div>
          <p className="mt-8 font-display text-[2.65rem] font-semibold leading-[1.35] tracking-[-0.03em] xl:text-[3.1rem]">
            {mode === 'login' ? (
              <>欢迎回来，<br />问题还在等你。</>
            ) : (
              <>不懂就问，<br />是离答案最近的一步。</>
            )}
          </p>
          <p className="mt-5 max-w-sm text-sm leading-8 text-panel/65">
            {mode === 'login'
              ? '你的问题、回答和积分，都在这里。继续把没说完的话说完。'
              : '注册即送 20 积分。提一个问题扣 5 分，回答一次加 10 分，被采纳再加 30 分。'}
          </p>
        </div>

        <div className="relative flex items-center gap-3 border-t border-panel/10 pt-5 text-[10px] text-panel/60">
          <MessageCircleQuestion size={14} />
          <span>问渠那得清如许，为有源头活水来。</span>
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md animate-rise">
          <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-xs text-teal-soft lg:hidden">
            <ArrowLeft size={14} /> 回到问渠
          </Link>
          <span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN WENQU'}</span>
          <h1 className="mt-3 font-display text-[2.15rem] font-semibold tracking-[-0.03em] text-deep">{title}</h1>
          <p className="mt-2 text-sm leading-7 text-ink-soft">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <div className="mt-6 text-center text-xs text-ink-soft">{footer}</div>
        </div>
      </main>
    </div>
  );
}

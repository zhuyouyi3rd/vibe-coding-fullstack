import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Feather } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
  mode: 'login' | 'register';
}

export function AuthLayout({ title, subtitle, footer, children, mode }: AuthLayoutProps) {
  return (
    <div className="grid min-h-[calc(100vh-4.65rem)] lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative hidden overflow-hidden bg-forest-deep p-10 text-paper lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-paper/10" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full border border-paper/[0.07]" />
        <div className="absolute right-10 top-1/3 h-24 w-24 rotate-45 border border-clay/30" />

        <Link to="/" className="relative inline-flex items-center gap-2 text-xs text-paper/55 transition hover:text-paper">
          <ArrowLeft size={14} />
          回到拾语
        </Link>

        <div className="relative">
          <span className="grid h-12 w-12 place-items-center rounded-[0.5rem] bg-clay font-display text-xl shadow-lg">
            拾
          </span>
          <p className="mt-8 font-display text-[2.6rem] font-semibold leading-[1.35] tracking-[-0.03em] xl:text-[3.1rem]">
            {mode === 'login' ? (
              <>
                好久不见，
                <br />
                继续写下去。
              </>
            ) : (
              <>
                从一个名字开始，
                <br />
                建一座小院子。
              </>
            )}
          </p>
          <p className="mt-5 max-w-sm text-sm leading-8 text-paper/55">
            {mode === 'login'
              ? '你的文章、你的读者、你未写完的草稿，都在这里等你。'
              : '不用等到想清楚一切。注册之后，先写下第一句，剩下的会慢慢长出来。'}
          </p>
        </div>

        <div className="relative flex items-center gap-3 border-t border-paper/10 pt-5 text-[11px] text-paper/40">
          <Feather size={14} />
          <span>写下来，就是对抗遗忘的方式。</span>
        </div>
      </aside>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md animate-rise">
          <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-xs text-moss lg:hidden">
            <ArrowLeft size={14} />
            回到首页
          </Link>
          <p className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN THE YARD'}</p>
          <h1 className="mt-4 font-display text-[2.2rem] font-semibold tracking-[-0.03em] text-forest-deep sm:text-[2.55rem]">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-7 text-ink-soft">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-7 text-center text-xs text-ink-soft">{footer}</div>
        </div>
      </section>
    </div>
  );
}

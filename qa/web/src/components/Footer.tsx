import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-panel/40">
      <div className="shell grid gap-8 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[0.35rem] bg-amber font-display text-sm text-deep">问</span>
            <span className="font-display text-lg font-semibold tracking-[0.1em] text-deep">问渠</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-ink-soft">
            一个认真提问、认真回答的地方。把问题问清楚，答案就会靠近。
          </p>
          <p className="mt-4 font-display text-xs tracking-[0.12em] text-teal-soft">问渠那得清如许，为有源头活水来。</p>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-teal-soft">逛逛</p>
          <div className="mt-3 grid gap-2 text-xs text-ink-soft">
            <Link to="/" className="hover:text-amber-deep">全部问题</Link>
            <Link to="/?sort=hot" className="hover:text-amber-deep">热门讨论</Link>
            <Link to="/?sort=unanswered" className="hover:text-amber-deep">等待回答</Link>
            <a href="/#leaderboard" className="hover:text-amber-deep">积分榜</a>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-teal-soft">参与</p>
          <div className="mt-3 grid gap-2 text-xs text-ink-soft">
            <Link to="/ask" className="hover:text-amber-deep">提一个问题</Link>
            <Link to="/profile" className="hover:text-amber-deep">个人主页</Link>
            <span>提问扣 5 分 · 回答加 10 分</span>
          </div>
        </div>
      </div>
      <div className="border-t border-line/70">
        <div className="shell flex flex-col gap-2 py-4 text-[10px] text-teal-soft sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 问渠 · 认真对待每一个问题</span>
          <span className="tracking-[0.12em]">REACT · EXPRESS · MYSQL</span>
        </div>
      </div>
    </footer>
  );
}

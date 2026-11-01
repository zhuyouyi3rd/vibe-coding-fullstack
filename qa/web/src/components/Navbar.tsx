import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, PenLine, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setUserOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!userOpen) return;
    const handler = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [userOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-deep/97 backdrop-blur-xl">
      <div className="shell flex h-[4.4rem] items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="relative grid h-10 w-10 place-items-center rounded-[0.45rem] bg-amber text-deep shadow-lg">
            <span className="font-display text-xl font-semibold leading-none">问</span>
            <span className="absolute inset-[3px] rounded-[0.25rem] border border-deep/25" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-semibold tracking-[0.1em] text-panel">问渠</span>
            <span className="block text-[9px] font-semibold tracking-[0.24em] text-panel/60">WENQU · Q&A</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
            问题
          </NavLink>
          <Link to="/?sort=hot" className={`nav-link ${location.search.includes('sort=hot') ? 'is-active' : ''}`}>
            热门
          </Link>
          <Link to="/?sort=unanswered" className={`nav-link ${location.search.includes('sort=unanswered') ? 'is-active' : ''}`}>
            未解决
          </Link>
          <a href="/#leaderboard" className="nav-link">用户榜</a>
        </nav>

        <div className="flex items-center gap-2.5">
          {user && (
            <div className="hidden items-center gap-1.5 rounded-full border border-amber/25 bg-amber/10 px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              <span className="text-[11px] font-bold text-[#f0b27a]">{user.points}</span>
              <span className="text-[10px] text-panel/60">积分</span>
            </div>
          )}

          <Link to="/ask" className="btn-amber hidden px-3.5! py-2! sm:inline-flex">
            <PenLine size={14} />
            提个问题
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setUserOpen((value) => !value)}
                className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1 pr-2 transition hover:bg-white/10"
                aria-label="用户菜单"
                aria-expanded={userOpen}
              >
                <Avatar src={user.avatar} name={user.username} size={30} />
                <ChevronDown size={13} className={`text-panel/65 transition ${userOpen ? 'rotate-180' : ''}`} />
              </button>
              {userOpen && (
                <div className="absolute right-0 top-[calc(100%+0.6rem)] w-48 overflow-hidden rounded-xl border border-line bg-panel p-1.5 shadow-2xl animate-fade">
                  <Link to="/profile" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:bg-panel-deep hover:text-deep">
                    <UserRound size={15} /> 个人主页
                  </Link>
                  <Link to="/ask" className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-ink-soft hover:bg-panel-deep hover:text-deep sm:hidden">
                    <PenLine size={15} /> 提个问题
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-coral hover:bg-coral/5"
                  >
                    <LogOut size={15} /> 退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="rounded-lg border border-white/20 px-3.5 py-2 text-xs font-semibold text-panel transition hover:bg-white/10">
              登录
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-panel md:hidden"
            aria-label={open ? '关闭菜单' : '打开菜单'}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-deep px-5 pb-5 pt-2 md:hidden animate-fade">
          <div className="grid">
            <Link to="/" className="rounded-lg px-3 py-2.5 text-sm text-panel/80 hover:bg-white/5">问题</Link>
            <Link to="/?sort=hot" className="rounded-lg px-3 py-2.5 text-sm text-panel/80 hover:bg-white/5">热门</Link>
            <Link to="/?sort=unanswered" className="rounded-lg px-3 py-2.5 text-sm text-panel/80 hover:bg-white/5">未解决</Link>
            <Link to="/ask" className="rounded-lg px-3 py-2.5 text-sm text-panel/80 hover:bg-white/5">提个问题</Link>
          </div>
        </div>
      )}
    </header>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, PenLine, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';

const categories = [
  { label: '技术手记', slug: 'tech' },
  { label: '产品思考', slug: 'product' },
  { label: '生活随笔', slug: 'life' },
  { label: '阅读笔记', slug: 'reading' },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!userOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [userOpen]);

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    navigate('/');
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-line/70 bg-paper/90 shadow-[0_10px_30px_-24px_rgba(29,43,38,0.8)] backdrop-blur-xl'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="page-shell flex h-[4.65rem] items-center justify-between gap-6">
        <Link to="/" className="group flex items-center gap-3" aria-label="拾语首页">
          <span className="relative grid h-10 w-10 place-items-center rounded-[0.45rem] bg-clay text-paper shadow-[0_6px_16px_-8px_rgba(155,69,40,0.9)]">
            <span className="font-display text-lg leading-none">拾</span>
            <span className="absolute inset-[3px] rounded-[0.25rem] border border-paper/35" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-semibold tracking-[0.08em] text-forest-deep">
              拾语
            </span>
            <span className="block text-[9px] font-semibold tracking-[0.26em] text-moss">
              SHIYU NOTES
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
            首页
          </NavLink>
          {categories.map((category) => {
            const active =
              location.pathname === '/' &&
              new URLSearchParams(location.search).get('category') === category.slug;
            return (
              <Link
                key={category.slug}
                to={`/?category=${category.slug}`}
                className={`nav-link ${active ? 'is-active' : ''}`}
              >
                {category.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <Link to="/write" className="btn-primary hidden px-4! py-2.5! sm:inline-flex">
                <PenLine size={15} />
                写文章
              </Link>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setUserOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-full border border-line/80 bg-white/45 p-1 pr-2 transition hover:border-forest/30 hover:bg-white/70"
                  aria-expanded={userOpen}
                  aria-label="打开用户菜单"
                >
                  <Avatar src={user.avatar} name={user.username} size={32} />
                  <span className="hidden max-w-24 truncate text-xs font-semibold sm:block">
                    {user.username}
                  </span>
                  <ChevronDown size={13} className={`text-moss transition ${userOpen ? 'rotate-180' : ''}`} />
                </button>
                {userOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.55rem)] w-48 overflow-hidden rounded-2xl border border-line bg-paper-light p-1.5 shadow-2xl animate-fade">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition hover:bg-paper-deep hover:text-forest-deep"
                    >
                      <UserRound size={15} />
                      个人中心
                    </Link>
                    <Link
                      to="/write"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition hover:bg-paper-deep hover:text-forest-deep sm:hidden"
                    >
                      <PenLine size={15} />
                      写文章
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-clay-deep transition hover:bg-clay/10"
                    >
                      <LogOut size={15} />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden text-sm font-semibold text-ink-soft transition hover:text-forest-deep sm:block">
                登录
              </Link>
              <Link to="/register" className="btn-primary px-4! py-2.5!">
                开始写
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink-soft lg:hidden"
            aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-line/70 bg-paper/97 px-5 pb-5 pt-3 backdrop-blur-xl lg:hidden animate-fade">
          <div className="grid gap-1">
            <Link to="/" className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-paper-deep">
              首页
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`/?category=${category.slug}`}
                className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-paper-deep"
              >
                {category.label}
              </Link>
            ))}
            {!user && (
              <Link to="/login" className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-paper-deep">
                登录
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

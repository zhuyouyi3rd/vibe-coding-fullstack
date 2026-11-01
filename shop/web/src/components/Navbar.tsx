import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Package, ShoppingBag, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Avatar } from './Avatar';

export function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobile(false);
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
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/95 backdrop-blur-xl">
      <div className="bg-olive-deep px-4 py-1.5 text-center text-[10px] tracking-[0.12em] text-panel/80">
        满 299 元包邮 · 每周三上新 · 只做日常会用很久的东西
      </div>
      <div className="shell flex h-[4.3rem] items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-3">
          <span className="relative grid h-9 w-9 place-items-center rounded-[0.3rem] border border-brick/30 bg-brick text-panel">
            <span className="font-display text-lg leading-none">云</span>
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-semibold tracking-[0.12em] text-ink">云市</span>
            <span className="block text-[8px] font-semibold tracking-[0.24em] text-ink-soft">YUNSHI GOODS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>首页</NavLink>
          <a href="/#collection" className="nav-link">全部商品</a>
          <Link to="/orders" className={`nav-link ${location.pathname.startsWith('/orders') ? 'is-active' : ''}`}>我的订单</Link>
          <Link to="/addresses" className={`nav-link ${location.pathname.startsWith('/addresses') ? 'is-active' : ''}`}>收货地址</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-panel/60 text-ink-soft transition hover:border-brick/40 hover:text-brick" aria-label="购物车">
            <ShoppingBag size={18} />
            {cart.count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brick px-1 text-[9px] font-bold text-panel">
                {cart.count > 99 ? '99+' : cart.count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setUserOpen((value) => !value)} aria-label="用户菜单" aria-expanded={userOpen} className="flex items-center gap-1.5 rounded-full border border-line bg-panel/70 p-1 pr-2">
                <Avatar src={user.avatar} name={user.username} size={28} />
                <ChevronDown size={12} className={`text-ink-soft transition ${userOpen ? 'rotate-180' : ''}`} />
              </button>
              {userOpen && (
                <div className="absolute right-0 top-[calc(100%+0.6rem)] w-44 overflow-hidden rounded-lg border border-line bg-panel p-1.5 shadow-2xl animate-fade">
                  <Link to="/orders" className="flex items-center gap-2 rounded px-3 py-2 text-xs text-ink-soft hover:bg-panel-deep"><Package size={14} /> 我的订单</Link>
                  <Link to="/addresses" className="flex items-center gap-2 rounded px-3 py-2 text-xs text-ink-soft hover:bg-panel-deep"><UserRound size={14} /> 收货地址</Link>
                  <button type="button" onClick={() => { logout(); navigate('/'); }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs text-brick hover:bg-brick/5"><LogOut size={14} /> 退出登录</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="hidden rounded border border-line px-3 py-2 text-xs font-semibold text-ink-soft hover:border-brick/40 sm:block">登录</Link>
          )}

          <button type="button" onClick={() => setMobile((value) => !value)} aria-label={mobile ? '关闭菜单' : '打开菜单'} aria-expanded={mobile} className="grid h-9 w-9 place-items-center rounded border border-line text-ink-soft md:hidden">
            {mobile ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {mobile && (
        <div className="border-t border-line bg-paper px-5 pb-5 pt-2 md:hidden animate-fade">
          <Link to="/" className="block rounded px-3 py-2.5 text-sm">首页</Link>
          <a href="/#collection" className="block rounded px-3 py-2.5 text-sm">全部商品</a>
          <Link to="/orders" className="block rounded px-3 py-2.5 text-sm">我的订单</Link>
          <Link to="/addresses" className="block rounded px-3 py-2.5 text-sm">收货地址</Link>
          {!user && <Link to="/login" className="block rounded px-3 py-2.5 text-sm">登录</Link>}
        </div>
      )}
    </header>
  );
}

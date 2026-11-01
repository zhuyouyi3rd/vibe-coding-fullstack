import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-panel/40">
      <div className="shell grid gap-8 py-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-[0.25rem] bg-brick font-display text-sm text-panel">云</span>
            <span className="font-display text-lg font-semibold tracking-[0.12em] text-ink">云市</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-7 text-ink-soft">
            一间收集日常之物的线上小店。我们相信，好的东西不需要很多，但值得用很久。
          </p>
          <p className="mt-4 font-display text-xs tracking-[0.1em] text-olive">云无心以出岫，鸟倦飞而知还。</p>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-olive">逛逛</p>
          <div className="mt-3 grid gap-2 text-xs text-ink-soft">
            <Link to="/" className="hover:text-brick">全部商品</Link>
            <Link to="/cart" className="hover:text-brick">购物车</Link>
            <Link to="/orders" className="hover:text-brick">我的订单</Link>
            <Link to="/addresses" className="hover:text-brick">收货地址</Link>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] text-olive">购物说明</p>
          <div className="mt-3 grid gap-2 text-xs leading-5 text-ink-soft">
            <span>满 299 元包邮</span>
            <span>7 天无理由退换</span>
            <span>订单创建后为待支付状态</span>
          </div>
        </div>
      </div>
      <div className="border-t border-line/70">
        <div className="shell flex flex-col gap-2 py-4 text-[10px] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 云市 · 把日子过成喜欢的样子</span>
          <span className="tracking-[0.12em]">REACT · EXPRESS · MYSQL</span>
        </div>
      </div>
    </footer>
  );
}

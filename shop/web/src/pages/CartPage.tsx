import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { Address, Order } from '../types';
import { formatPrice } from '../lib/format';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export function CartPage() {
  const navigate = useNavigate();
  const { cart, update, remove, refresh } = useCart();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    api.get<{ data: Address[] }>('/addresses').then(({ data }) => {
      setAddresses(data.data);
      setAddressId(data.data.find((item) => item.isDefault)?.id ?? data.data[0]?.id ?? null);
    }).catch(() => undefined);
  }, []);

  const shipping = cart.total >= 299 || cart.total === 0 ? 0 : 12;

  const changeQuantity = async (id: number, quantity: number) => {
    setBusy(id);
    try {
      await update(id, quantity);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  const checkout = async () => {
    if (!addressId) {
      toast('请先添加收货地址', 'error');
      navigate('/addresses');
      return;
    }
    setCheckingOut(true);
    try {
      const { data } = await api.post<{ data: Order }>('/orders', {
        addressId,
        cartItemIds: cart.items.map((item) => item.id),
      });
      toast('订单已创建，等待支付');
      await refresh();
      navigate(`/orders/${data.data.id}`);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setCheckingOut(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <section className="shell grid min-h-[55vh] place-items-center py-12 text-center">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-panel-deep text-olive"><ShoppingBag size={26} /></span>
          <h1 className="mt-5 font-display text-2xl font-semibold text-ink">购物车还是空的</h1>
          <p className="mt-2 text-sm text-ink-soft">去挑一件喜欢的东西，让日子多一点具体。</p>
          <Link to="/" className="btn-brick mt-6">去逛逛</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="shell py-7">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft hover:text-brick"><ArrowLeft size={13} /> 继续购物</Link>
      <div className="mt-3 flex items-end justify-between border-b border-line pb-4">
        <div>
          <span className="eyebrow">SHOPPING BAG</span>
          <h1 className="mt-2 font-display text-3xl font-semibold">购物车</h1>
        </div>
        <p className="text-[11px] text-ink-soft">{cart.count} 件商品</p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="divide-y divide-line/70 border-y border-line/70">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-3 py-4 sm:gap-4">
              <Link to={`/product/${item.product.id}`} className="shrink-0 overflow-hidden rounded border border-line">
                <img src={item.product.images[0]} alt={item.product.name} className="h-24 w-24 object-cover sm:h-28 sm:w-28" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link to={`/product/${item.product.id}`} className="font-display text-base font-semibold text-ink hover:text-brick-deep">{item.product.name}</Link>
                    <p className="mt-1 text-[10px] text-ink-soft">{item.product.category} · 单价 {formatPrice(item.product.price)}</p>
                  </div>
                  <button type="button" onClick={() => remove(item.id).catch((err) => toast(getErrorMessage(err), 'error'))} aria-label={`删除 ${item.product.name}`} className="p-1 text-ink-soft hover:text-brick"><Trash2 size={14} /></button>
                </div>
                <div className="flex items-end justify-between">
                  <div className="inline-flex items-center rounded border border-line">
                    <button type="button" onClick={() => changeQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1 || busy === item.id} aria-label="减少数量" className="grid h-8 w-8 place-items-center disabled:opacity-30"><Minus size={12} /></button>
                    <span className="w-8 text-center text-xs font-semibold">{item.quantity}</span>
                    <button type="button" onClick={() => changeQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock || busy === item.id} aria-label="增加数量" className="grid h-8 w-8 place-items-center disabled:opacity-30"><Plus size={12} /></button>
                  </div>
                  <p className="font-display text-base font-semibold text-brick-deep">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-md border border-line bg-panel/80 p-4 lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-semibold">订单小计</h2>
          <div className="mt-3 space-y-2 border-b border-line/70 pb-3 text-xs text-ink-soft">
            <div className="flex justify-between"><span>商品金额</span><span>{formatPrice(cart.total)}</span></div>
            <div className="flex justify-between"><span>运费</span><span>{shipping === 0 ? '包邮' : formatPrice(shipping)}</span></div>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="text-xs text-ink-soft">应付</span>
            <span className="font-display text-2xl font-semibold text-brick-deep">{formatPrice(cart.total + shipping)}</span>
          </div>

          <div className="mt-4 border-t border-line/70 pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold text-ink-soft"><MapPin size={12} className="text-olive" /> 收货地址</p>
            {addresses.length === 0 ? (
              <Link to="/addresses" className="text-[11px] font-semibold text-brick underline underline-offset-4">添加收货地址</Link>
            ) : (
              <select value={addressId ?? ''} onChange={(event) => setAddressId(Number(event.target.value))} aria-label="收货地址" className="field text-xs">
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>{address.name} · {address.province}{address.city}{address.district}{address.detail}</option>
                ))}
              </select>
            )}
          </div>

          <button type="button" onClick={checkout} disabled={checkingOut} className="btn-brick mt-4 w-full">
            {checkingOut ? '正在创建订单…' : '提交订单'}
          </button>
          <p className="mt-2 text-center text-[9px] leading-4 text-ink-soft">提交后生成待支付订单，可在订单详情中取消</p>
        </aside>
      </div>
    </div>
  );
}

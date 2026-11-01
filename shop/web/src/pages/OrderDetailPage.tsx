import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock3, MapPin, Package, X } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { Order } from '../types';
import { formatDate, formatPrice, statusMap } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { LoadingScreen } from '../components/LoadingScreen';

export function OrderDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<{ data: Order }>(`/orders/${id}`)
      .then(({ data }) => { if (active) setOrder(data.data); })
      .catch((err) => { if (active) setError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const cancel = async () => {
    if (!order) return;
    setCancelling(true);
    try {
      const { data } = await api.put<{ data: Order }>(`/orders/${order.id}/cancel`);
      setOrder(data.data);
      setConfirm(false);
      toast('订单已取消，库存已恢复');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
      setCancelling(false);
    }
  };

  if (loading) return <LoadingScreen label="正在查看订单" />;
  if (error || !order) {
    return (
      <section className="shell grid min-h-[50vh] place-items-center text-center">
        <div>
          <p className="display-title text-5xl text-brick/30">404</p>
          <h1 className="mt-3 font-display text-2xl font-semibold">没有找到这个订单</h1>
          <Link to="/orders" className="btn-brick mt-5">回到订单列表</Link>
        </div>
      </section>
    );
  }

  const status = statusMap[order.status];

  return (
    <div className="shell py-7">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft hover:text-brick"><ArrowLeft size={13} /> 返回订单列表</Link>

      <div className="mt-4 rounded-md border border-line bg-panel/80 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono text-ink-soft">{order.orderNo}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">订单详情</h1>
            <p className="mt-1 text-[10px] text-ink-soft">创建于 {formatDate(order.createdAt)}</p>
          </div>
          <span className={`status-badge px-2.5! py-1! text-[10px]! ${status.className}`}>{status.label}</span>
        </div>

        <div className="mt-6 flex items-center gap-2 text-[10px] text-ink-soft">
          <Clock3 size={13} className="text-olive" />
          {order.status === 'pending' && '订单已创建，等待支付。支付功能不在本 Mini 版范围内。'}
          {order.status === 'cancelled' && '订单已取消，商品库存已恢复。'}
          {order.status !== 'pending' && order.status !== 'cancelled' && '订单正在处理中。'}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_19rem]">
        <div>
          <section className="rounded-md border border-line bg-panel/75 p-4">
            <h2 className="flex items-center gap-1.5 font-display text-base font-semibold"><Package size={15} className="text-brick" /> 商品清单</h2>
            <div className="mt-3 divide-y divide-line/60">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <img src={item.image} alt={item.name} className="h-14 w-14 rounded border border-line object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">{item.name}</p>
                    <p className="mt-0.5 text-[10px] text-ink-soft">{formatPrice(item.price)} × {item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold text-brick-deep">{formatPrice(item.subtotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 border-t border-line/70 pt-3 text-xs">
              <div className="flex justify-between text-ink-soft"><span>商品金额</span><span>{formatPrice(order.total - order.shippingFee)}</span></div>
              <div className="mt-1 flex justify-between text-ink-soft"><span>运费</span><span>{order.shippingFee === 0 ? '包邮' : formatPrice(order.shippingFee)}</span></div>
              <div className="mt-2 flex justify-between"><span className="text-ink-soft">合计</span><span className="font-display text-xl font-semibold text-brick-deep">{formatPrice(order.total)}</span></div>
            </div>
          </section>

          <section className="mt-4 rounded-md border border-line bg-panel/75 p-4">
            <h2 className="flex items-center gap-1.5 font-display text-base font-semibold"><MapPin size={15} className="text-brick" /> 收货信息</h2>
            <p className="mt-2 text-xs font-semibold">{order.address.name} · {order.address.phone}</p>
            <p className="mt-1 text-[11px] leading-6 text-ink-soft">{order.address.fullAddress || `${order.address.province}${order.address.city}${order.address.district}${order.address.detail}`}</p>
          </section>
        </div>

        <aside className="h-fit rounded-md border border-line bg-panel/80 p-4">
          <h2 className="font-display text-base font-semibold">订单状态</h2>
          <div className="mt-3 space-y-3">
            {[
              { key: 'created', label: '订单创建', done: true },
              { key: 'paid', label: '完成支付', done: order.status !== 'pending' && order.status !== 'cancelled' },
              { key: 'shipped', label: '商品发出', done: ['shipped', 'completed'].includes(order.status) },
              { key: 'completed', label: '交易完成', done: order.status === 'completed' },
            ].map((step) => (
              <div key={step.key} className="flex items-center gap-2 text-[11px]">
                <span className={`grid h-5 w-5 place-items-center rounded-full border ${step.done ? 'border-olive bg-olive text-panel' : 'border-line text-ink-soft/40'}`}>
                  {step.done ? <Check size={10} /> : <X size={9} />}
                </span>
                <span className={step.done ? 'text-ink' : 'text-ink-soft'}>{step.label}</span>
              </div>
            ))}
          </div>
          {order.status === 'pending' && (
            <button type="button" onClick={() => setConfirm(true)} className="mt-4 w-full rounded border border-brick/30 py-2 text-[11px] font-semibold text-brick hover:bg-brick/5">取消订单</button>
          )}
          <p className="mt-3 text-[9px] leading-4 text-ink-soft">取消待支付订单后，商品库存会自动恢复。</p>
        </aside>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-ink/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-md border border-line bg-panel p-5 shadow-2xl animate-rise">
            <h3 className="font-display text-lg font-semibold">取消这个订单？</h3>
            <p className="mt-2 text-xs leading-6 text-ink-soft">取消后订单不可恢复，商品库存会回到商店。</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(false)} className="btn-outline px-3! py-1.5! text-[11px]!">再想想</button>
              <button type="button" onClick={cancel} disabled={cancelling} className="rounded bg-brick px-3 py-1.5 text-[11px] font-semibold text-panel disabled:opacity-50">{cancelling ? '取消中…' : '确认取消'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

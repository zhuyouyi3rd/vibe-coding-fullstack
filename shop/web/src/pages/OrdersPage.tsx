import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { Order, OrderListResponse, OrderStatus } from '../types';
import { formatDate, formatPrice, statusMap } from '../lib/format';
import { LoadingScreen } from '../components/LoadingScreen';

const tabs: Array<{ key: '' | OrderStatus; label: string }> = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待支付' },
  { key: 'paid', label: '已支付' },
  { key: 'shipped', label: '已发货' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

export function OrdersPage() {
  const [status, setStatus] = useState<'' | OrderStatus>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<OrderListResponse>('/orders', { params: { ...(status ? { status } : {}), pageSize: 20 } })
      .then(({ data }) => { if (active) setOrders(data.data); })
      .catch((err) => { if (active) setError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status]);

  return (
    <div className="shell py-8">
      <span className="eyebrow">MY ORDERS</span>
      <h1 className="mt-2 font-display text-3xl font-semibold">我的订单</h1>
      <p className="mt-1 text-xs text-ink-soft">这里记录你买下的每一件日常之物。</p>

      <div className="mt-5 flex gap-1 overflow-x-auto border-b border-line pb-2">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setStatus(tab.key)} className={`shrink-0 rounded px-3 py-2 text-[11px] font-semibold transition ${status === tab.key ? 'bg-olive-deep text-panel' : 'text-ink-soft hover:bg-panel-deep'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? <LoadingScreen label="正在整理订单" /> : error ? (
          <div className="rounded border border-brick/20 bg-brick/5 p-6 text-sm text-brick-deep">{error}</div>
        ) : orders.length === 0 ? (
          <div className="rounded-md border border-dashed border-line py-16 text-center">
            <Package size={22} className="mx-auto text-olive" />
            <p className="mt-3 font-display text-lg">还没有订单</p>
            <Link to="/" className="btn-brick mt-4">去挑点东西</Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {orders.map((order) => (
              <article key={order.id} className="rounded-md border border-line bg-panel/75 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/70 pb-2">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-ink-soft">
                    <span className="font-mono">{order.orderNo}</span>
                    <span>· {formatDate(order.createdAt)}</span>
                  </div>
                  <span className={`status-badge ${statusMap[order.status].className}`}>{statusMap[order.status].label}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex -space-x-3">
                    {order.items.slice(0, 4).map((item) => (
                      <img key={item.id} src={item.image} alt={item.name} className="h-12 w-12 rounded border-2 border-panel object-cover" />
                    ))}
                  </div>
                  <p className="min-w-0 flex-1 truncate text-xs text-ink-soft">{order.items.map((item) => item.name).join('、')}</p>
                  <div className="text-right">
                    <p className="text-[10px] text-ink-soft">共 {order.itemCount} 件</p>
                    <p className="font-display text-lg font-semibold text-brick-deep">{formatPrice(order.total)}</p>
                  </div>
                  <Link to={`/orders/${order.id}`} className="btn-outline px-3! py-1.5! text-[10px]!">查看详情 <ArrowRight size={12} /></Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { Product } from '../types';
import { formatPrice } from '../lib/format';

export function ProductCard({ product, onAdd, index = 0 }: { product: Product; onAdd?: () => void; index?: number }) {
  return (
    <article className="group flex flex-col animate-rise" style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}>
      <Link to={`/product/${product.id}`} className="product-media relative block overflow-hidden rounded-md border border-line/60">
        <img src={product.images[0]} alt={product.name} className="aspect-square w-full object-cover" loading="lazy" />
        <span className="absolute left-2.5 top-2.5 rounded-sm bg-panel/90 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-olive-deep backdrop-blur">
          {product.category}
        </span>
        {product.stock <= 5 && product.stock > 0 && (
          <span className="absolute right-2.5 top-2.5 rounded-sm bg-brick/90 px-2 py-0.5 text-[9px] font-semibold text-panel">仅剩 {product.stock} 件</span>
        )}
      </Link>

      <div className="flex flex-1 items-start justify-between gap-2 pt-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[1.02rem] font-semibold text-ink">
            <Link to={`/product/${product.id}`} className="hover:text-brick-deep">{product.name}</Link>
          </h3>
          <p className="mt-1 text-[11px] text-ink-soft">{product.category} · {product.stock > 0 ? '现货' : '暂时缺货'}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-base font-semibold text-brick-deep">{formatPrice(product.price)}</p>
          {onAdd && (
            <button type="button" onClick={onAdd} disabled={product.stock === 0} aria-label={`加入购物车：${product.name}`} className="mt-1 grid h-7 w-7 place-items-center rounded-full border border-line text-ink-soft transition hover:border-brick hover:bg-brick hover:text-panel disabled:opacity-40">
              <Plus size={14} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

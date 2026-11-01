import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { Product } from '../types';
import { formatPrice } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { ProductCard } from '../components/ProductCard';

export function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<{ data: Product }>(`/products/${id}`)
      .then(({ data }) => {
        if (!active) return;
        setProduct(data.data);
        setQuantity(1);
        return api.get<{ data: Product[] }>('/products', { params: { category: data.data.category } });
      })
      .then((response) => {
        if (active && response) setRelated(response.data.data.filter((item) => String(item.id) !== String(id)).slice(0, 3));
      })
      .catch((err) => { if (active) setError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const addToBag = async (goCart = false) => {
    if (!product) return;
    if (!user) {
      navigate('/login', { state: { from: `/product/${product.id}` } });
      return;
    }
    setAdding(true);
    try {
      await add(product.id, quantity);
      toast(`已加入购物车 · ${quantity} 件`);
      if (goCart) navigate('/cart');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <LoadingScreen label="正在打开商品" />;
  if (error || !product) {
    return (
      <section className="shell grid min-h-[55vh] place-items-center text-center">
        <div>
          <p className="display-title text-5xl text-brick/30">404</p>
          <h1 className="mt-3 font-display text-2xl font-semibold">没有找到这件商品</h1>
          <p className="mt-2 text-sm text-ink-soft">{error || '它可能暂时下架了。'}</p>
          <Link to="/" className="btn-brick mt-6">回到商店</Link>
        </div>
      </section>
    );
  }

  return (
    <div className="shell py-7">
      <Link to="/" className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft hover:text-brick">
        <ArrowLeft size={13} /> 返回全部商品
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="overflow-hidden rounded-md border border-line bg-panel-deep">
          <img src={product.images[0]} alt={product.name} className="aspect-square w-full object-cover" />
        </div>

        <div className="lg:pt-4">
          <p className="eyebrow">{product.category}</p>
          <h1 className="mt-3 font-display text-[2.1rem] font-semibold leading-[1.35] tracking-[-0.025em] text-ink sm:text-[2.6rem]">{product.name}</h1>
          <p className="mt-4 font-display text-3xl font-semibold text-brick-deep">{formatPrice(product.price)}</p>
          <p className="mt-2 text-[10px] text-ink-soft">含税 · 满 299 元包邮 · 7 天无理由退换</p>

          <div className="mt-6 border-y border-line py-5">
            <p className="whitespace-pre-line text-sm leading-7 text-ink-soft">{product.description}</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded border border-line">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} aria-label="减少数量" className="grid h-9 w-9 place-items-center text-ink-soft disabled:opacity-30"><Minus size={14} /></button>
              <span className="w-9 text-center text-sm font-semibold">{quantity}</span>
              <button type="button" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock} aria-label="增加数量" className="grid h-9 w-9 place-items-center text-ink-soft disabled:opacity-30"><Plus size={14} /></button>
            </div>
            <span className="text-[10px] text-ink-soft">{product.stock > 0 ? `现货 ${product.stock} 件` : '暂时缺货'}</span>
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => addToBag(false)} disabled={adding || product.stock === 0} className="btn-brick flex-1">
              <ShoppingBag size={15} /> {adding ? '加入中…' : '加入购物车'}
            </button>
            <button type="button" onClick={() => addToBag(true)} disabled={adding || product.stock === 0} className="btn-outline flex-1">
              立即购买
            </button>
          </div>

          <div className="mt-6 grid gap-2.5 text-[10px] text-ink-soft">
            <p className="flex items-center gap-2"><Truck size={13} className="text-olive" /> 48 小时内发出，满 299 元包邮</p>
            <p className="flex items-center gap-2"><ShieldCheck size={13} className="text-olive" /> 支持 7 天无理由退换，运费自理</p>
            <p className="flex items-center gap-2"><Check size={13} className="text-olive" /> 每件商品都经过实际使用与挑选</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-line pt-8">
          <span className="eyebrow">YOU MAY ALSO LIKE</span>
          <h2 className="mt-2 font-display text-2xl font-semibold">同类好物</h2>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3">
            {related.map((item, index) => <ProductCard key={item.id} product={item} index={index} />)}
          </div>
        </section>
      )}
    </div>
  );
}

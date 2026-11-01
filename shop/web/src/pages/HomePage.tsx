import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Leaf, PackageCheck, Search, Sparkles, Truck } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import type { Product } from '../types';
import { formatPrice } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { ProductCard } from '../components/ProductCard';

const perks = [
  { icon: Leaf, title: '认真选物', text: '只卖自己会用的东西' },
  { icon: PackageCheck, title: '现货发出', text: '48 小时内打包' },
  { icon: Truck, title: '满额包邮', text: '满 299 元免运费' },
];

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { add } = useCart();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const [keyword, setKeyword] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ data: Array<{ name: string; count: number }> }>('/categories').then(({ data }) => setCategories(data.data)).catch(() => undefined);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get<{ data: Product[] }>('/products', { params: { ...(category ? { category } : {}), ...(sort ? { sort } : {}), ...(keyword ? { keyword } : {}) } })
      .then(({ data }) => { if (active) setProducts(data.data); })
      .catch((err) => { if (active) setError(getErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [category, sort, keyword]);

  const quickAdd = async (product: Product) => {
    if (!user) {
      navigate('/login', { state: { from: '/' } });
      return;
    }
    try {
      await add(product.id, 1);
      toast(`「${product.name}」已加入购物车`);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const featured = products.find((product) => product.id === 3) || products[0];

  return (
    <>
      <section className="shell grid gap-8 pb-12 pt-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pt-14">
        <div className="animate-rise">
          <span className="eyebrow">YUNSHI GOODS · 日常选物</span>
          <h1 className="display-title mt-5 max-w-xl text-[2.9rem] text-ink sm:text-[4.1rem]">
            把日子，
            <br />
            过成<span className="text-brick">喜欢</span>的样子。
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-8 text-ink-soft">
            云市是一间小小的线上杂货铺。我们挑了一些安静、耐用、每天都会用到的东西，
            希望它们能陪你久一点。
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#collection" className="btn-brick">开始逛逛 <ArrowRight size={15} /></a>
            <Link to="/orders" className="btn-outline">查看我的订单</Link>
          </div>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-line pt-5">
            {perks.map((perk) => {
              const Icon = perk.icon;
              return (
                <div key={perk.title}>
                  <Icon size={15} className="text-olive" />
                  <p className="mt-1.5 text-[11px] font-semibold text-ink">{perk.title}</p>
                  <p className="mt-0.5 text-[9px] text-ink-soft">{perk.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {featured && (
          <div className="relative animate-rise" style={{ animationDelay: '80ms' }}>
            <div className="absolute -left-3 -top-3 h-full w-full rounded-md border border-line" />
            <Link to={`/product/${featured.id}`} className="relative block overflow-hidden rounded-md border border-line bg-panel-deep">
              <img src={featured.images[0]} alt={featured.name} className="aspect-[4/3] w-full object-cover" />
            </Link>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 rounded bg-panel/95 p-4 shadow-xl backdrop-blur">
              <div>
                <p className="text-[9px] font-bold tracking-[0.16em] text-brick">本期推荐</p>
                <p className="mt-1 font-display text-lg font-semibold text-ink">{featured.name}</p>
                <p className="mt-0.5 text-[10px] text-ink-soft">{featured.category} · 现货</p>
              </div>
              <p className="shrink-0 font-display text-xl font-semibold text-brick-deep">{formatPrice(featured.price)}</p>
            </div>
          </div>
        )}
      </section>

      <section id="collection" className="shell scroll-mt-24 border-t border-line pt-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">COLLECTION</span>
            <h2 className="mt-3 font-display text-3xl font-semibold text-ink">日常之物</h2>
            <p className="mt-1.5 text-xs text-ink-soft">共 {products.length} 件 · 慢慢挑，不着急</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <form onSubmit={(event) => { event.preventDefault(); setKeyword(draft.trim()); }} className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="搜索商品" placeholder="搜索商品…" className="field py-2! pl-9! text-xs" />
            </form>
            <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="排序方式" className="field w-auto py-2! text-xs">
              <option value="">默认排序</option>
              <option value="price_asc">价格从低到高</option>
              <option value="price_desc">价格从高到低</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={() => setCategory('')} className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${!category ? 'border-brick bg-brick text-panel' : 'border-line bg-panel/60 text-ink-soft hover:border-brick/40'}`}>全部</button>
          {categories.map((item) => (
            <button key={item.name} type="button" onClick={() => setCategory(item.name)} className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${category === item.name ? 'border-brick bg-brick text-panel' : 'border-line bg-panel/60 text-ink-soft hover:border-brick/40'}`}>
              {item.name} <span className="opacity-50">{item.count}</span>
            </button>
          ))}
          {keyword && (
            <button type="button" onClick={() => { setKeyword(''); setDraft(''); }} className="px-2 text-[11px] font-semibold text-brick underline underline-offset-4">
              清除「{keyword}」
            </button>
          )}
        </div>

        <div className="mt-6">
          {error ? (
            <div className="rounded-md border border-brick/20 bg-brick/5 p-8 text-center text-sm text-brick-deep">{error}</div>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-square rounded-md bg-panel-deep" />
                  <div className="mt-3 h-3 w-3/4 rounded bg-panel-deep" />
                  <div className="mt-2 h-2.5 w-1/3 rounded bg-panel-deep/70" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-md border border-dashed border-line py-16 text-center">
              <Sparkles size={20} className="mx-auto text-olive" />
              <p className="mt-3 font-display text-lg text-ink">没有找到合适的商品</p>
              <p className="mt-1 text-xs text-ink-soft">换个分类或关键词试试。</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} onAdd={() => quickAdd(product)} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="shell mt-20">
        <div className="grid overflow-hidden rounded-md border border-line bg-panel/70 md:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center p-7 sm:p-10">
            <span className="eyebrow">OUR LITTLE STORY</span>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.45] text-ink sm:text-3xl">
              不追流行，
              <br />
              只想找到能用很久的东西。
            </h2>
            <p className="mt-3 max-w-md text-xs leading-7 text-ink-soft">
              每一件商品都经过我们自己使用。可能不完美，但希望它在你的日常里，安静地待很多年。
            </p>
          </div>
          <div className="product-media relative min-h-56">
            <img src="/products/p6.svg" alt="燕麦色羊毛盖毯" className="h-full w-full object-cover" />
          </div>
        </div>
      </section>
    </>
  );
}

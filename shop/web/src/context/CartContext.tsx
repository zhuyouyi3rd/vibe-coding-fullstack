import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../lib/api';
import type { Cart } from '../types';
import { useAuth } from './AuthContext';

interface CartContextValue {
  cart: Cart;
  loading: boolean;
  refresh: () => Promise<void>;
  add: (productId: number, quantity: number) => Promise<void>;
  update: (id: number, quantity: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

const empty: Cart = { items: [], total: 0, count: 0 };
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>(empty);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(empty);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get<{ data: Cart }>('/cart');
      setCart(data.data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const add = useCallback(async (productId: number, quantity: number) => {
    const { data } = await api.post<{ data: Cart }>('/cart', { productId, quantity });
    setCart(data.data);
  }, []);

  const update = useCallback(async (id: number, quantity: number) => {
    const { data } = await api.put<{ data: Cart }>(`/cart/${id}`, { quantity });
    setCart(data.data);
  }, []);

  const remove = useCallback(async (id: number) => {
    const { data } = await api.delete<{ data: Cart }>(`/cart/${id}`);
    setCart(data.data);
  }, []);

  const value = useMemo(() => ({ cart, loading, refresh, add, update, remove }), [cart, loading, refresh, add, update, remove]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

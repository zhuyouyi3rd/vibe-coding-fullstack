import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Check, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = nextId.current++;
      setItems((current) => [...current.slice(-2), { id, message, kind }]);
      window.setTimeout(() => remove(id), 3600);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[80] flex flex-col items-center gap-2 px-4">
        {items.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur-md animate-toast ${
              item.kind === 'error'
                ? 'border-clay/30 bg-[#fff7f2]/95 text-clay-deep'
                : item.kind === 'info'
                  ? 'border-forest/20 bg-[#f7f4ea]/95 text-ink'
                  : 'border-forest/25 bg-[#f4f8f2]/95 text-forest'
            }`}
          >
            <span className="mt-0.5 shrink-0">
              {item.kind === 'success' ? <Check size={16} /> : item.kind === 'error' ? <X size={16} /> : <Info size={16} />}
            </span>
            <p className="flex-1 leading-6">{item.message}</p>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="mt-0.5 shrink-0 opacity-50 transition hover:opacity-100"
              aria-label="关闭提示"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

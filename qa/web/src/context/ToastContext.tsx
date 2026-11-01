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

type Kind = 'success' | 'error' | 'info';
interface Item {
  id: number;
  message: string;
  kind: Kind;
}

const ToastContext = createContext<{ toast: (message: string, kind?: Kind) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const next = useRef(1);

  const remove = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: Kind = 'success') => {
      const id = next.current++;
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
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur animate-toast ${
              item.kind === 'error'
                ? 'border-coral/30 bg-[#fff7f3]/95 text-coral'
                : item.kind === 'info'
                  ? 'border-teal/20 bg-panel/95 text-ink'
                  : 'border-teal/25 bg-[#f4f8f2]/95 text-teal'
            }`}
          >
            <span className="mt-0.5 shrink-0">
              {item.kind === 'success' ? <Check size={16} /> : item.kind === 'error' ? <X size={16} /> : <Info size={16} />}
            </span>
            <p className="flex-1 leading-6">{item.message}</p>
            <button type="button" onClick={() => remove(item.id)} className="mt-0.5 opacity-50 hover:opacity-100" aria-label="关闭提示">
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

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastTone = 'default' | 'success' | 'error';

interface ToastEntry {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string, tone: ToastTone = 'default') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={styles.stack}>
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              style={{ ...styles.toast, ...toneStyle(t.tone) }}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { show: () => {} };
  }
  return ctx;
}

function toneStyle(tone: ToastTone): React.CSSProperties {
  if (tone === 'success') {
    return {
      borderColor: 'rgba(52,211,153,0.5)',
      color: 'var(--text-primary)',
    };
  }
  if (tone === 'error') {
    return {
      borderColor: 'rgba(255,107,107,0.5)',
      color: 'var(--text-primary)',
    };
  }
  return {};
}

/** Auto-detect router-state toast on Home/etc. — used inside <ToastProvider>. */
export function useToastFromLocation(message: string | undefined, onShown: () => void) {
  const { show } = useToast();
  useEffect(() => {
    if (!message) return;
    show(message);
    onShown();
  }, [message, onShown, show]);
}

const styles: Record<string, React.CSSProperties> = {
  stack: {
    position: 'fixed',
    bottom: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    zIndex: 600,
    pointerEvents: 'none',
  },
  toast: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    padding: '12px 20px',
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    border: '1px solid var(--border-subtle)',
    pointerEvents: 'auto',
    whiteSpace: 'nowrap',
  },
};

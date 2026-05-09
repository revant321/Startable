import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical } from 'lucide-react';
import useIsMobile from '../../hooks/useIsMobile';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

interface OverflowMenuProps {
  items: MenuItem[];
}

export default function OverflowMenu({ items }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const handleSelect = (item: MenuItem) => {
    setOpen(false);
    setTimeout(() => item.onClick(), 50);
  };

  return (
    <div ref={wrapRef} style={styles.wrap}>
      <motion.button
        style={styles.trigger}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((o) => !o)}
        aria-label="More options"
      >
        <MoreVertical size={22} color="var(--text-primary)" />
      </motion.button>

      <AnimatePresence>
        {open && isMobile && (
          <motion.div
            key="overlay"
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="sheet"
              style={styles.centeredSheet}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              {items.map((item, i) => (
                <button
                  key={i}
                  style={{
                    ...styles.sheetItem,
                    color: item.destructive ? '#FF6B6B' : 'var(--text-primary)',
                    borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
                  }}
                  onClick={() => handleSelect(item)}
                >
                  {item.icon && <span style={styles.icon}>{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ))}
            </motion.div>
          </motion.div>
        )}

        {open && !isMobile && (
          <motion.div
            key="dropdown"
            style={styles.dropdown}
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            {items.map((item, i) => (
              <button
                key={i}
                style={{
                  ...styles.dropdownItem,
                  color: item.destructive ? '#FF6B6B' : 'var(--text-primary)',
                }}
                onClick={() => handleSelect(item)}
              >
                {item.icon && <span style={styles.icon}>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'relative',
    display: 'inline-flex',
  },
  trigger: {
    background: 'none',
    border: 'none',
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'var(--modal-backdrop)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 200,
  },
  centeredSheet: {
    background: 'var(--bg-elevated)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
    boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
  },
  sheetItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '18px 24px',
    background: 'none',
    border: 'none',
    fontSize: 16,
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    right: 0,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 12,
    minWidth: 240,
    padding: 6,
    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    background: 'none',
    border: 'none',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 8,
    textAlign: 'left',
    width: '100%',
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
  },
};

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
  rightAction?: ReactNode;
}

export default function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
  rightAction,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section style={styles.section}>
      <div style={styles.headerRow}>
        <button style={styles.headerButton} onClick={() => setOpen((o) => !o)}>
          <motion.span
            animate={{ rotate: open ? 0 : -90 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'inline-flex' }}
          >
            <ChevronDown size={18} color="var(--text-secondary)" />
          </motion.span>
          <span style={styles.title}>
            {title}
            {count != null && <span style={styles.count}> ({count})</span>}
          </span>
        </button>
        {rightAction}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={styles.body}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginTop: 8,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  headerButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    padding: '8px 0',
    cursor: 'pointer',
    color: 'var(--text-primary)',
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
  },
  count: {
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  body: {
    paddingTop: 8,
  },
};

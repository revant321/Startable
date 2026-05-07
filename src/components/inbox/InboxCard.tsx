import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2 } from 'lucide-react';
import { timeAgo } from '../../utils/dateHelpers';
import type { InboxItem } from '../../types';

const SWIPE_THRESHOLD = 80;

interface InboxCardProps {
  item: InboxItem;
  onDelete: (item: InboxItem) => void;
  onAccept: (item: InboxItem) => void;
  onTap: (item: InboxItem) => void;
}

export default function InboxCard({ item, onDelete, onAccept, onTap }: InboxCardProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [removing, setRemoving] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const hasMoved = useRef(false);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const handleStart = (clientX: number, clientY: number) => {
    startX.current = clientX;
    startY.current = clientY;
    hasMoved.current = false;
    isHorizontalSwipe.current = null;
    setIsDragging(true);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - startX.current;
    const dy = clientY - startY.current;

    // Determine swipe direction on first significant move
    if (isHorizontalSwipe.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isHorizontalSwipe.current = Math.abs(dx) > Math.abs(dy);
    }

    if (!isHorizontalSwipe.current) return;

    hasMoved.current = true;
    setOffsetX(dx);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (offsetX > SWIPE_THRESHOLD) {
      onAccept(item);
    } else if (offsetX < -SWIPE_THRESHOLD) {
      setRemoving(true);
      setTimeout(() => onDelete(item), 300);
    } else {
      setOffsetX(0);
    }
  };

  const handleClick = () => {
    if (!hasMoved.current) {
      onTap(item);
    }
  };

  const bgColor = offsetX > 0
    ? `rgba(52, 211, 153, ${Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1) * 0.3})`
    : offsetX < 0
      ? `rgba(239, 68, 68, ${Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1) * 0.3})`
      : 'transparent';

  return (
    <motion.div
      layout
      initial={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={removing ? { opacity: 0, height: 0 } : {}}
        transition={{ duration: 0.3 }}
      >
        {/* Swipe background */}
        <div style={{ ...styles.swipeBg, background: bgColor, borderRadius: 14 }}>
          {offsetX > 20 && (
            <div style={styles.swipeAction}>
              <Check size={20} color="#34D399" />
              <span style={{ color: '#34D399', fontSize: 13, fontWeight: 600 }}>Accept</span>
            </div>
          )}
          {offsetX < -20 && (
            <div style={{ ...styles.swipeAction, justifyContent: 'flex-end' }}>
              <span style={{ color: '#EF4444', fontSize: 13, fontWeight: 600 }}>Delete</span>
              <Trash2 size={20} color="#EF4444" />
            </div>
          )}
        </div>

        {/* Card */}
        <motion.div
          style={{
            ...styles.card,
            transform: `translateX(${offsetX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            cursor: 'grab',
          }}
          whileTap={!isDragging ? { scale: 0.98 } : undefined}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={() => { if (isDragging) handleEnd(); }}
          onClick={handleClick}
        >
          <div style={styles.cardHeader}>
            <span style={styles.title}>{item.title}</span>
            <span style={styles.time}>{timeAgo(item.createdAt)}</span>
          </div>
          {item.description && (
            <p style={styles.description}>{item.description}</p>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  swipeBg: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
  },
  swipeAction: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  card: {
    position: 'relative',
    background: 'var(--bg-card)',
    borderRadius: 14,
    padding: 16,
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    flex: 1,
  },
  time: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  description: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    marginTop: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};

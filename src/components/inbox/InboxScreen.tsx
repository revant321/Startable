import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, CheckSquare } from 'lucide-react';
import PageWrapper from '../layout/PageWrapper';
import QuickCaptureModal from './QuickCaptureModal';
import InboxCard from './InboxCard';
import { db } from '../../db/database';
import useIsMobile from '../../hooks/useIsMobile';
import { addTask } from '../../hooks/useTasks';
import type { InboxItem } from '../../types';

export default function InboxScreen() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [showCapture, setShowCapture] = useState(false);
  const [editingItem, setEditingItem] = useState<InboxItem | null>(null);
  const [acceptingItem, setAcceptingItem] = useState<InboxItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    const results = await db.inboxItems
      .where('status')
      .equals('active')
      .reverse()
      .sortBy('createdAt');
    setItems(results);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleDelete = async (item: InboxItem) => {
    await db.inboxItems.update(item.id!, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
    });
    loadItems();
  };

  const handleAccept = (item: InboxItem) => {
    setAcceptingItem(item);
  };

  const handleAcceptAsGoal = (item: InboxItem) => {
    setAcceptingItem(null);
    navigate('/goals/new', {
      state: { fromInbox: item },
    });
  };

  const handleAcceptAsTask = async (item: InboxItem) => {
    if (item.id == null) return;
    await addTask(item.title);
    await db.inboxItems.update(item.id, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
    });
    setAcceptingItem(null);
    setToast('Task added ✓');
    setTimeout(() => setToast(null), 2000);
    loadItems();
  };

  const handleSaveEdit = async (id: number, title: string, description: string) => {
    await db.inboxItems.update(id, { title, description: description || undefined });
    setEditingItem(null);
    loadItems();
  };

  const titleRight = items.length > 0 ? (
    <span style={{
      fontSize: 14,
      color: 'var(--text-secondary)',
      fontWeight: 400,
      background: 'var(--bg-card)',
      borderRadius: 10,
      padding: '2px 10px',
      marginLeft: 8,
    }}>
      {items.length}
    </span>
  ) : undefined;

  return (
    <PageWrapper
      title="Inbox"
      rightAction={titleRight}
    >
      <div style={{ position: 'relative' }}>
        {items.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>Your inbox is empty</p>
            <p style={styles.emptySubtitle}>Tap + to capture an idea</p>
          </div>
        ) : (
          <div style={{
            ...(isMobile ? styles.list : styles.grid),
            gap: isMobile ? 12 : 16,
          }}>
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <InboxCard
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onAccept={handleAccept}
                  onTap={setEditingItem}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* FAB — positioned within content flow */}
        <motion.button
          style={{
            ...styles.fab,
            position: 'fixed',
            bottom: isMobile ? 80 : 32,
            right: isMobile ? 20 : 32,
          }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCapture(true)}
        >
          <Plus size={28} color="#fff" />
        </motion.button>
      </div>

      {/* Quick Capture Modal */}
      <AnimatePresence>
        {showCapture && (
          <QuickCaptureModal
            onClose={() => setShowCapture(false)}
            onSaved={loadItems}
          />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <EditModal
            item={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={handleSaveEdit}
            isMobile={isMobile}
          />
        )}
      </AnimatePresence>

      {/* Accept Choice Modal */}
      <AnimatePresence>
        {acceptingItem && (
          <AcceptChoiceModal
            item={acceptingItem}
            isMobile={isMobile}
            onClose={() => setAcceptingItem(null)}
            onChooseGoal={handleAcceptAsGoal}
            onChooseTask={handleAcceptAsTask}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            style={styles.toast}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

function AcceptChoiceModal({
  item,
  isMobile,
  onClose,
  onChooseGoal,
  onChooseTask,
}: {
  item: InboxItem;
  isMobile: boolean;
  onClose: () => void;
  onChooseGoal: (item: InboxItem) => void;
  onChooseTask: (item: InboxItem) => void;
}) {
  const overlayStyle: React.CSSProperties = {
    ...styles.overlay,
    alignItems: isMobile ? 'flex-end' : 'center',
  };
  const cardStyle: React.CSSProperties = {
    ...styles.choiceCard,
    borderRadius: isMobile ? '20px 20px 0 0' : 16,
    maxWidth: isMobile ? '100%' : 400,
  };
  const initial = isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 };
  const animate = isMobile ? { y: 0 } : { scale: 1, opacity: 1 };
  const exit = isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 };

  return (
    <motion.div
      style={overlayStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={cardStyle}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={styles.choiceTitle}>What should this become?</h3>
        <p style={styles.choiceItemTitle}>"{item.title}"</p>

        <motion.button
          style={{ ...styles.choiceOption, borderColor: 'var(--active-green)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChooseGoal(item)}
        >
          <div style={{ ...styles.choiceIcon, background: 'rgba(52,211,153,0.15)' }}>
            <Target size={22} color="#34D399" />
          </div>
          <div style={styles.choiceText}>
            <div style={styles.choiceLabel}>Goal</div>
            <div style={styles.choiceDesc}>A structured goal to work toward over time</div>
          </div>
        </motion.button>

        <motion.button
          style={{ ...styles.choiceOption, borderColor: 'var(--border-subtle)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChooseTask(item)}
        >
          <div style={{ ...styles.choiceIcon, background: 'var(--bg-card-hover)' }}>
            <CheckSquare size={22} color="var(--text-primary)" />
          </div>
          <div style={styles.choiceText}>
            <div style={styles.choiceLabel}>Quick Task</div>
            <div style={styles.choiceDesc}>A simple task to get done</div>
          </div>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function EditModal({
  item,
  onClose,
  onSave,
  isMobile,
}: {
  item: InboxItem;
  onClose: () => void;
  onSave: (id: number, title: string, description: string) => void;
  isMobile: boolean;
}) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');

  const overlayStyle: React.CSSProperties = {
    ...styles.overlay,
    alignItems: isMobile ? 'flex-end' : 'center',
  };

  const modalStyle: React.CSSProperties = {
    ...styles.modal,
    borderRadius: isMobile ? '20px 20px 0 0' : 16,
    maxWidth: isMobile ? 480 : 450,
  };

  const modalInitial = isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 };
  const modalAnimate = isMobile ? { y: 0 } : { scale: 1, opacity: 1 };
  const modalExit = isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 };

  return (
    <motion.div
      style={overlayStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={modalStyle}
        initial={modalInitial}
        animate={modalAnimate}
        exit={modalExit}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={styles.modalTitle}>Edit Idea</h3>
        <input
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          autoFocus
        />
        <input
          style={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
        />
        <button
          style={{
            ...styles.saveButton,
            opacity: title.trim() ? 1 : 0.4,
          }}
          disabled={!title.trim()}
          onClick={() => onSave(item.id!, title.trim(), description.trim())}
        >
          Save
        </button>
      </motion.div>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: '60vh',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: 100,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    paddingBottom: 100,
    alignItems: 'start',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'var(--active-green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(52, 211, 153, 0.3)',
    zIndex: 10,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'var(--modal-backdrop)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: 'var(--bg-elevated)',
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 16,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-primary)',
    fontSize: 16,
    marginBottom: 12,
    outline: 'none',
  },
  saveButton: {
    width: '100%',
    padding: '14px 0',
    borderRadius: 12,
    background: 'var(--active-green)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    marginTop: 4,
  },
  choiceCard: {
    background: 'var(--bg-card)',
    padding: 24,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  choiceTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 4,
  },
  choiceItemTitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  choiceOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    background: 'var(--bg-primary)',
    borderRadius: 12,
    border: '1.5px solid',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  choiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  choiceText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    flex: 1,
  },
  choiceLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  choiceDesc: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  toast: {
    position: 'fixed',
    bottom: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    padding: '12px 20px',
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    zIndex: 400,
    border: '1px solid var(--border-subtle)',
  },
};

import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../db/database';

interface QuickNoteOverlayProps {
  goalId: number;
  onClose: () => void;
}

export default function QuickNoteOverlay({ goalId, onClose }: QuickNoteOverlayProps) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      onClose();
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    await db.goalNotes.add({
      goalId,
      content: trimmed,
      createdAt: now,
      updatedAt: now,
    });
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      style={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={styles.card}
        initial={{ scale: 0.94, opacity: 0, y: -8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: -8 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={styles.title}>Quick Note</h3>
        <textarea
          style={styles.textarea}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Capture a thought..."
          autoFocus
        />
        <div style={styles.actions}>
          <button style={styles.cancel} onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <motion.button
            style={{ ...styles.save, opacity: content.trim() ? 1 : 0.5 }}
            whileTap={content.trim() ? { scale: 0.96 } : undefined}
            onClick={handleSave}
            disabled={!content.trim() || saving}
          >
            Save
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'var(--modal-backdrop)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 500,
    padding: 20,
  },
  card: {
    background: 'var(--bg-elevated)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    border: '1px solid var(--border-subtle)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  textarea: {
    width: '100%',
    minHeight: 120,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 15,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
  cancel: {
    padding: '10px 18px',
    borderRadius: 10,
    background: 'var(--bg-card-hover)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  save: {
    padding: '10px 18px',
    borderRadius: 10,
    background: '#7C5CFC',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
};

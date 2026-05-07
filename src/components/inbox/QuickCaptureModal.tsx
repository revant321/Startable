import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../db/database';
import useIsMobile from '../../hooks/useIsMobile';

interface QuickCaptureModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function QuickCaptureModal({ onClose, onSaved }: QuickCaptureModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const isMobile = useIsMobile();

  const handleSave = async () => {
    if (!title.trim()) return;
    await db.inboxItems.add({
      title: title.trim(),
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
      status: 'active',
    });
    onSaved();
    onClose();
  };

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
        <h3 style={styles.title}>Capture an Idea</h3>
        <input
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's on your mind?"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && title.trim() && handleSave()}
        />
        <input
          style={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          onKeyDown={(e) => e.key === 'Enter' && title.trim() && handleSave()}
        />
        <button
          style={{
            ...styles.saveButton,
            opacity: title.trim() ? 1 : 0.4,
          }}
          disabled={!title.trim()}
          onClick={handleSave}
        >
          Save
        </button>
      </motion.div>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
  title: {
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
};

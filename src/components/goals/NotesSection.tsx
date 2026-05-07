import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { db } from '../../db/database';
import { useGoalNotes } from '../../hooks/useGoals';
import { timeAgo } from '../../utils/dateHelpers';

interface NotesSectionProps {
  goalId: number;
  accent: string;
}

export default function NotesSection({ goalId, accent }: NotesSectionProps) {
  const notes = useGoalNotes(goalId);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleAdd = async () => {
    const content = draft.trim();
    if (!content) {
      setAdding(false);
      setDraft('');
      return;
    }
    const now = new Date().toISOString();
    await db.goalNotes.add({
      goalId,
      content,
      createdAt: now,
      updatedAt: now,
    });
    setDraft('');
    setAdding(false);
  };

  const handleDelete = async (id: number) => {
    await db.goalNotes.delete(id);
    setConfirmDeleteId(null);
  };

  return (
    <section style={styles.section}>
      <div style={styles.headerRow}>
        <h3 style={styles.title}>
          Notes <span style={styles.count}>({notes.length})</span>
        </h3>
        {!adding && (
          <motion.button
            style={{ ...styles.addButton, color: accent }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAdding(true)}
          >
            <Plus size={16} />
            <span>Add note</span>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={styles.addCard}>
              <textarea
                style={styles.textarea}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a note..."
                autoFocus
              />
              <div style={styles.addActions}>
                <button
                  style={styles.cancelBtn}
                  onClick={() => {
                    setAdding(false);
                    setDraft('');
                  }}
                >
                  Cancel
                </button>
                <motion.button
                  style={{ ...styles.saveBtn, background: accent }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAdd}
                  disabled={!draft.trim()}
                >
                  Save
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {notes.length === 0 && !adding ? (
        <p style={styles.empty}>No notes yet.</p>
      ) : (
        <div style={styles.notesList}>
          {notes.map((note) => (
            <div key={note.id} style={styles.noteCard}>
              <div style={styles.noteContent}>{note.content}</div>
              <div style={styles.noteMeta}>
                <span>{timeAgo(note.createdAt)}</span>
                {confirmDeleteId === note.id ? (
                  <span style={styles.confirmRow}>
                    <button
                      style={styles.confirmCancel}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      style={styles.confirmDelete}
                      onClick={() => handleDelete(note.id!)}
                    >
                      Delete
                    </button>
                  </span>
                ) : (
                  <button
                    style={styles.deleteBtn}
                    onClick={() => setConfirmDeleteId(note.id!)}
                    aria-label="Delete note"
                  >
                    <Trash2 size={14} color="var(--text-secondary)" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    marginTop: 16,
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  count: {
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '6px 8px',
    borderRadius: 8,
  },
  addCard: {
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  textarea: {
    width: '100%',
    minHeight: 70,
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 15,
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  addActions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '8px 14px',
    borderRadius: 10,
    background: 'var(--bg-card-hover)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '8px 14px',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  empty: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    padding: '12px 0',
  },
  notesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  noteCard: {
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  noteContent: {
    fontSize: 15,
    color: 'var(--text-primary)',
    lineHeight: 1.45,
    whiteSpace: 'pre-wrap',
  },
  noteMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    padding: 4,
    cursor: 'pointer',
    display: 'flex',
    borderRadius: 4,
  },
  confirmRow: {
    display: 'flex',
    gap: 6,
  },
  confirmCancel: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '2px 6px',
  },
  confirmDelete: {
    background: 'none',
    border: 'none',
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '2px 6px',
  },
};

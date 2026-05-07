import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface InlineEditProps {
  value: string;
  placeholder?: string;
  multiline?: boolean;
  emptyText?: string;
  onSave: (next: string) => void | Promise<void>;
  textStyle?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  accent?: string;
}

export default function InlineEdit({
  value,
  placeholder,
  multiline = false,
  emptyText,
  onSave,
  textStyle,
  inputStyle,
  accent = 'var(--active-green)',
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if ('setSelectionRange' in inputRef.current) {
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const save = async () => {
    const trimmed = draft.trim();
    await onSave(trimmed);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        style={{ ...styles.viewButton, ...textStyle }}
        onClick={startEdit}
      >
        {value && value.trim() ? value : <span style={styles.empty}>{emptyText ?? placeholder}</span>}
      </button>
    );
  }

  const baseInputStyle: React.CSSProperties = {
    ...styles.input,
    ...inputStyle,
    minHeight: multiline ? 80 : undefined,
    resize: multiline ? 'vertical' : undefined,
  };

  return (
    <div style={styles.editWrap}>
      {multiline ? (
        <textarea
          ref={(el) => {
            inputRef.current = el;
          }}
          style={baseInputStyle}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          ref={(el) => {
            inputRef.current = el;
          }}
          style={baseInputStyle}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancel();
          }}
        />
      )}
      <div style={styles.actions}>
        <motion.button
          style={styles.cancelBtn}
          whileTap={{ scale: 0.96 }}
          onClick={cancel}
        >
          Cancel
        </motion.button>
        <motion.button
          style={{ ...styles.saveBtn, background: accent }}
          whileTap={{ scale: 0.96 }}
          onClick={save}
        >
          Save
        </motion.button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  viewButton: {
    background: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    textAlign: 'left',
    cursor: 'pointer',
    color: 'inherit',
    width: '100%',
    font: 'inherit',
  },
  empty: {
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
  editWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
  },
  actions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: 10,
    background: 'var(--bg-card-hover)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '8px 16px',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
};

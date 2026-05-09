import { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../db/database';
import useIsMobile from '../../hooks/useIsMobile';
import { todayISO } from '../../utils/dateHelpers';
import StatusIcon from '../shared/StatusIcon';

export type CheckResult = 'good' | 'okay' | 'missed';

interface Props {
  goalId: number;
  subFocusId: number;
  subFocusLabel: string;
  onClose: () => void;
  onSaved?: () => void;
}

const OPTIONS: { value: CheckResult; label: string; color: string; bg: string }[] = [
  { value: 'good', label: 'Good', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  { value: 'okay', label: 'Okay', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  { value: 'missed', label: 'Missed', color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
];

export default function CheckInFlow({
  goalId,
  subFocusId,
  subFocusLabel,
  onClose,
  onSaved,
}: Props) {
  const isMobile = useIsMobile();
  const [result, setResult] = useState<CheckResult | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!result || saving) return;
    setSaving(true);
    await db.passiveCheckIns.add({
      goalId,
      subFocusId,
      date: todayISO(),
      result,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    onSaved?.();
    onClose();
  };

  const sheetStyle: React.CSSProperties = styles.centeredCard;

  const sheetAnim = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  void isMobile;

  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={sheetStyle}
        {...sheetAnim}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={styles.title}>How did it go?</h3>
        <p style={styles.subtitle}>{subFocusLabel}</p>

        <div style={styles.resultRow}>
          {OPTIONS.map((opt) => (
            <motion.button
              key={opt.value}
              style={{
                ...styles.resultPill,
                background: result === opt.value ? opt.bg : 'var(--bg-card-hover)',
                border:
                  result === opt.value
                    ? `1px solid ${opt.color}`
                    : '1px solid transparent',
              }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setResult(opt.value)}
            >
              <StatusIcon status={opt.value} size="md" />
              <span
                style={{
                  ...styles.resultLabel,
                  color:
                    result === opt.value ? opt.color : 'var(--text-primary)',
                }}
              >
                {opt.label}
              </span>
            </motion.button>
          ))}
        </div>

        <input
          style={styles.noteInput}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional one-line note..."
        />

        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <motion.button
            style={{
              ...styles.saveBtn,
              opacity: result ? 1 : 0.4,
            }}
            whileTap={result ? { scale: 0.96 } : undefined}
            disabled={!result || saving}
            onClick={handleSave}
          >
            Save check-in
          </motion.button>
        </div>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 350,
  },
  bottomSheet: {
    background: 'var(--bg-elevated)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: '20px 18px 32px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: '0 -1px 0 rgba(255,255,255,0.04)',
  },
  centeredCard: {
    background: 'var(--bg-elevated)',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  resultRow: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  },
  resultPill: {
    flex: 1,
    padding: '14px 8px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    transition: 'background 0.2s, border 0.2s',
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: 600,
  },
  noteInput: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
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
    marginTop: 4,
  },
  cancelBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    background: 'var(--bg-card-hover)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    background: 'var(--passive-blue)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
};

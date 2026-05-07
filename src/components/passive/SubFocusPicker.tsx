import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { db } from '../../db/database';
import { usePassiveSubFocuses } from '../../hooks/useGoals';
import useIsMobile from '../../hooks/useIsMobile';
import { todayISO } from '../../utils/dateHelpers';
import type { Goal, PassiveSubFocus } from '../../types';

interface Props {
  goal: Goal;
  onClose: () => void;
  onPicked?: (subFocus: PassiveSubFocus) => void;
}

export default function SubFocusPicker({ goal, onClose, onPicked }: Props) {
  const isMobile = useIsMobile();
  const subFocuses = usePassiveSubFocuses(goal.id);

  const handlePick = async (sf: PassiveSubFocus) => {
    if (goal.id == null || sf.id == null) return;
    await db.goals.update(goal.id, {
      chosenSubFocusId: sf.id,
      chosenSubFocusDate: todayISO(),
      updatedAt: new Date().toISOString(),
    });
    onPicked?.(sf);
    onClose();
  };

  const sheetStyle: React.CSSProperties = isMobile
    ? styles.bottomSheet
    : styles.centeredCard;

  const sheetAnim = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
      };

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
        <header style={styles.header}>
          <button style={styles.cancel} onClick={onClose}>
            Cancel
          </button>
          <button style={styles.iconBtn} onClick={onClose} aria-label="Close">
            <X size={20} color="var(--text-secondary)" />
          </button>
        </header>

        <h3 style={styles.title}>Today's focus for {goal.title}</h3>

        <div style={styles.list}>
          {subFocuses.length === 0 ? (
            <p style={styles.empty}>No sub-focuses defined yet.</p>
          ) : (
            subFocuses.map((sf) => (
              <motion.button
                key={sf.id}
                style={styles.pill}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePick(sf)}
              >
                {sf.label}
              </motion.button>
            ))
          )}
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
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 350,
  },
  bottomSheet: {
    background: 'var(--bg-elevated)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: '12px 16px 32px',
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  centeredCard: {
    background: 'var(--bg-elevated)',
    borderRadius: 16,
    padding: '16px 20px 24px',
    width: '100%',
    maxWidth: 460,
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  cancel: {
    background: 'none',
    border: 'none',
    color: 'var(--passive-blue)',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '6px 0',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    padding: 6,
    cursor: 'pointer',
    display: 'flex',
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text-primary)',
    paddingBottom: 8,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  pill: {
    background: 'var(--bg-card-hover)',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-primary)',
    textAlign: 'left',
    cursor: 'pointer',
    border: '1px solid transparent',
  },
  empty: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    padding: '12px 4px',
  },
};

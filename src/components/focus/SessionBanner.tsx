import { useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useActiveSession } from '../../hooks/useActiveSession';

const VIOLET = '#7C5CFC';

export default function SessionBanner() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    activeSession,
    remainingSeconds,
    isCompleted,
    endSession,
  } = useActiveSession();

  const [confirmEnd, setConfirmEnd] = useState(false);

  // Hide on the focus screen (the user is already viewing the wheel) and on
  // the reflection flow (which is a continuation of the session-end UX).
  const onFocus = location.pathname.startsWith('/focus');
  const onReflection = location.pathname === '/reflection';
  const visible = activeSession != null && !onFocus && !onReflection;

  const handleNavigate = () => {
    if (!activeSession) return;
    if (isCompleted) {
      goToReflection();
    } else {
      navigate(`/focus/${activeSession.goalId}`);
    }
  };

  const goToReflection = () => {
    const data = endSession();
    if (!data) return;
    navigate('/reflection', {
      state: {
        goalId: data.goalId,
        sessionData: {
          startedAt: data.startedAt,
          endedAt: data.endedAt,
          durationMinutes: data.durationMinutes,
        },
        isActivationSession: data.isActivationSession,
      },
    });
  };

  const handleConfirmEnd = () => {
    setConfirmEnd(false);
    goToReflection();
  };

  const mm = Math.floor(remainingSeconds / 60);
  const ss = remainingSeconds % 60;
  const timeText = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  return (
    <>
      <AnimatePresence>
        {visible && activeSession && (
          <motion.div
            key="session-banner"
            initial={{ y: -52, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -52, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            style={styles.wrap}
          >
            <button
              type="button"
              style={styles.main}
              onClick={handleNavigate}
              aria-label={
                isCompleted
                  ? 'Session complete — tap to reflect'
                  : `Open focus session for ${activeSession.goalTitle}`
              }
            >
              <motion.span
                style={{
                  ...styles.dot,
                  background: isCompleted ? '#34D399' : VIOLET,
                  boxShadow: isCompleted
                    ? '0 0 8px rgba(52,211,153,0.7)'
                    : '0 0 8px rgba(124,92,252,0.7)',
                }}
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span style={styles.title}>{activeSession.goalTitle}</span>
              <span
                style={{
                  ...styles.time,
                  color: isCompleted ? '#34D399' : VIOLET,
                }}
              >
                {isCompleted
                  ? 'Tap to reflect'
                  : activeSession.isPaused
                  ? `Paused · ${timeText}`
                  : timeText}
              </span>
            </button>
            <button
              type="button"
              style={styles.endBtn}
              onClick={() => setConfirmEnd(true)}
              aria-label="End session"
            >
              <X size={16} color="var(--text-secondary)" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmEnd && (
          <motion.div
            style={styles.confirmBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmEnd(false)}
          >
            <motion.div
              style={styles.confirmCard}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={styles.confirmTitle}>End session early?</h3>
              <p style={styles.confirmBody}>
                Your time will still be logged.
              </p>
              <div style={styles.confirmActions}>
                <button
                  style={styles.confirmCancelBtn}
                  onClick={() => setConfirmEnd(false)}
                >
                  Cancel
                </button>
                <motion.button
                  style={styles.confirmEndBtn}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleConfirmEnd}
                >
                  End Session
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    position: 'sticky',
    top: 0,
    zIndex: 80,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    paddingTop: 'max(env(safe-area-inset-top, 8px), 8px)',
    background: 'rgba(20, 16, 32, 0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(124,92,252,0.18)',
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 10,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    minWidth: 0,
    color: 'var(--text-primary)',
    textAlign: 'left',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  time: {
    fontSize: 13,
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
    letterSpacing: 0.2,
  },
  endBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: 'none',
    borderRadius: 999,
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  confirmBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'var(--modal-backdrop)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 700,
    padding: 20,
  },
  confirmCard: {
    background: 'var(--bg-elevated)',
    borderRadius: 16,
    padding: 24,
    maxWidth: 380,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  confirmBody: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  confirmActions: {
    display: 'flex',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  confirmCancelBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    background: 'var(--bg-card-hover)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  confirmEndBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    background: VIOLET,
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
};

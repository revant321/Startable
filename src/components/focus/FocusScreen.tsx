import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, StickyNote, Plus } from 'lucide-react';
import { useGoal } from '../../hooks/useGoals';
import { useActiveSession } from '../../hooks/useActiveSession';
import useIsMobile from '../../hooks/useIsMobile';
import TimerWheel, { type TimerWheelState } from './TimerWheel';
import QuickNoteOverlay from './QuickNoteOverlay';

const VIOLET = '#7C5CFC';

const MIN_MINUTES = 5;
const MAX_MINUTES = 60;
const ACTIVATION_MINUTES = 20;

export default function FocusScreen() {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const id = goalId != null ? Number(goalId) : undefined;
  const { goal, loading } = useGoal(id);

  const {
    activeSession,
    remainingSeconds,
    isCompleted,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    extendSession,
  } = useActiveSession();

  const isActivation = goal?.status === 'draft';
  const sessionForThisGoal =
    activeSession != null && goal != null && activeSession.goalId === goal.id;
  const sessionForOtherGoal = activeSession != null && !sessionForThisGoal;

  const [selectedMinutes, setSelectedMinutes] = useState<number>(
    isActivation ? ACTIVATION_MINUTES : ACTIVATION_MINUTES
  );

  // Lock activation goals to 20-minute timer.
  useEffect(() => {
    if (isActivation) setSelectedMinutes(ACTIVATION_MINUTES);
  }, [isActivation]);

  const [showNote, setShowNote] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const sessionFinalizedRef = useRef(false);

  // Auto-finalize when session naturally completes while user is here.
  useEffect(() => {
    if (!isCompleted) return;
    if (!sessionForThisGoal) return;
    if (sessionFinalizedRef.current) return;
    sessionFinalizedRef.current = true;

    const timeoutId = setTimeout(() => {
      const data = endSession();
      if (data) {
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
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompleted, sessionForThisGoal]);

  if (loading) {
    return (
      <div style={styles.background}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  if (!goal) {
    return (
      <div style={styles.background}>
        <div style={styles.notFound}>
          <p style={styles.notFoundText}>Goal not found</p>
          <button style={styles.exitBtn} onClick={() => navigate('/goals')}>
            Back to Goals
          </button>
        </div>
      </div>
    );
  }

  // X button: navigate back to where the user came from. Timer keeps running.
  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/goals/${goal.id}`);
    }
  };

  const handleStart = () => {
    if (sessionForOtherGoal) return; // Should be blocked by UI anyway.
    if (goal.id == null) return;
    startSession({
      goalId: goal.id,
      goalTitle: goal.title,
      durationMinutes: selectedMinutes,
      isActivationSession: isActivation,
    });
  };

  const handleEndEarly = () => {
    if (sessionFinalizedRef.current) return;
    sessionFinalizedRef.current = true;
    const data = endSession();
    setConfirmEnd(false);
    if (data) {
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
    }
  };

  const wheelSize = isMobile ? 280 : 340;

  // Derive what to display.
  let wheelState: TimerWheelState;
  let wheelSelectedMinutes: number;
  let wheelRemainingSeconds: number;
  let wheelTotalSeconds: number;

  if (sessionForThisGoal && activeSession) {
    if (isCompleted) wheelState = 'completed';
    else if (activeSession.isPaused) wheelState = 'paused';
    else wheelState = 'running';
    wheelSelectedMinutes = activeSession.durationMinutes;
    wheelRemainingSeconds = remainingSeconds;
    wheelTotalSeconds = activeSession.durationMinutes * 60;
  } else {
    wheelState = 'pre-start';
    wheelSelectedMinutes = selectedMinutes;
    wheelRemainingSeconds = selectedMinutes * 60;
    wheelTotalSeconds = selectedMinutes * 60;
  }

  return (
    <div style={styles.background}>
      <header style={styles.topBar}>
        <motion.button
          style={styles.iconBtn}
          whileTap={{ scale: 0.9 }}
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={24} color="var(--text-secondary)" />
        </motion.button>

        {isActivation && (
          <div style={styles.activationLabel}>ACTIVATION SESSION</div>
        )}

        <motion.button
          style={styles.iconBtn}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowNote(true)}
          aria-label="Quick note"
        >
          <StickyNote size={22} color="var(--text-secondary)" />
        </motion.button>
      </header>

      <div style={styles.main}>
        <div style={styles.content}>
          <h1
            style={{
              ...styles.goalTitle,
              fontSize: isMobile ? 22 : 24,
            }}
          >
            {goal.title}
          </h1>

          {goal.reminder && !reminderDismissed && (
            <motion.div
              style={styles.reminderCard}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span style={styles.reminderText}>{goal.reminder}</span>
              <button
                style={styles.reminderDismiss}
                onClick={() => setReminderDismissed(true)}
                aria-label="Dismiss reminder"
              >
                <X size={14} color="var(--text-secondary)" />
              </button>
            </motion.div>
          )}

          {goal.currentNextStep && (
            <p style={styles.nextStep}>{goal.currentNextStep}</p>
          )}

          <div style={styles.wheelArea}>
            <TimerWheel
              state={wheelState}
              selectedMinutes={wheelSelectedMinutes}
              remainingSeconds={wheelRemainingSeconds}
              totalSessionSeconds={wheelTotalSeconds}
              onMinutesChange={(m) =>
                setSelectedMinutes(Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, m)))
              }
              locked={isActivation || sessionForOtherGoal}
              size={wheelSize}
            />
          </div>

          {sessionForOtherGoal && activeSession && (
            <ConflictNotice
              otherGoalTitle={activeSession.goalTitle}
              onSwitch={() => navigate(`/focus/${activeSession.goalId}`)}
            />
          )}

          {!sessionForOtherGoal && (
            <div style={styles.actions}>
              {wheelState === 'pre-start' && (
                <>
                  <motion.button
                    style={styles.primaryBtn}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStart}
                  >
                    Start
                  </motion.button>
                  <p style={styles.durationLabel}>{selectedMinutes} minutes</p>
                </>
              )}

              {wheelState === 'running' && (
                <>
                  <div style={styles.actionRow}>
                    <motion.button
                      style={styles.secondaryBtn}
                      whileTap={{ scale: 0.97 }}
                      onClick={pauseSession}
                    >
                      Pause
                    </motion.button>
                    <motion.button
                      style={styles.tertiaryBtn}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setConfirmEnd(true)}
                    >
                      End Session
                    </motion.button>
                  </div>
                  {!isActivation && (
                    <motion.button
                      style={styles.addTimeBtn}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => extendSession(5)}
                    >
                      <Plus size={14} />
                      <span>5 min</span>
                    </motion.button>
                  )}
                </>
              )}

              {wheelState === 'paused' && (
                <div style={styles.actionRow}>
                  <motion.button
                    style={styles.primaryBtn}
                    whileTap={{ scale: 0.97 }}
                    onClick={resumeSession}
                  >
                    Resume
                  </motion.button>
                  <motion.button
                    style={styles.tertiaryBtn}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setConfirmEnd(true)}
                  >
                    End Session
                  </motion.button>
                </div>
              )}

              {wheelState === 'completed' && (
                <motion.div
                  style={styles.completeText}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  Session Complete!
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNote && goal.id != null && (
          <QuickNoteOverlay goalId={goal.id} onClose={() => setShowNote(false)} />
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
                  onClick={handleEndEarly}
                >
                  End Session
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConflictNotice({
  otherGoalTitle,
  onSwitch,
}: {
  otherGoalTitle: string;
  onSwitch: () => void;
}) {
  return (
    <div style={conflictStyles.card}>
      <p style={conflictStyles.text}>
        A session is currently running for{' '}
        <strong style={conflictStyles.title}>{otherGoalTitle}</strong>. End it
        first to start a new session.
      </p>
      <motion.button
        style={conflictStyles.btn}
        whileTap={{ scale: 0.97 }}
        onClick={onSwitch}
      >
        Go to current session
      </motion.button>
    </div>
  );
}

const conflictStyles: Record<string, CSSProperties> = {
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 16,
    borderRadius: 14,
    background: 'rgba(124,92,252,0.08)',
    border: '1px solid rgba(124,92,252,0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginTop: 8,
  },
  text: {
    color: 'var(--text-primary)',
    fontSize: 14,
    lineHeight: 1.5,
    textAlign: 'center',
  },
  title: {
    color: VIOLET,
    fontWeight: 700,
  },
  btn: {
    padding: '12px 20px',
    borderRadius: 12,
    background: VIOLET,
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
};

const styles: Record<string, CSSProperties> = {
  background: {
    width: '100%',
    minHeight: '100dvh',
    background: `radial-gradient(circle at 50% 35%, rgba(124, 92, 252, 0.08) 0%, rgba(124, 92, 252, 0.02) 35%, var(--bg-primary) 70%)`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    paddingTop: 'max(env(safe-area-inset-top, 16px), 16px)',
    minHeight: 56,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    borderRadius: 8,
  },
  activationLabel: {
    color: VIOLET,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.4,
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px 40px',
  },
  content: {
    width: '100%',
    maxWidth: 440,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
  },
  goalTitle: {
    color: '#fff',
    fontWeight: 700,
    textAlign: 'center',
    lineHeight: 1.2,
  },
  reminderCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: '8px 12px',
    maxWidth: 380,
  },
  reminderText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  reminderDismiss: {
    background: 'none',
    border: 'none',
    padding: 2,
    cursor: 'pointer',
    display: 'flex',
    flexShrink: 0,
  },
  nextStep: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 600,
    textAlign: 'center',
    lineHeight: 1.4,
    maxWidth: 360,
    margin: '4px 0 8px',
  },
  wheelArea: {
    margin: '12px 0',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 360,
    marginTop: 8,
  },
  actionRow: {
    display: 'flex',
    gap: 10,
    width: '100%',
  },
  primaryBtn: {
    width: '100%',
    padding: '14px 28px',
    borderRadius: 14,
    background: `linear-gradient(135deg, ${VIOLET} 0%, #5B7FFC 100%)`,
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(124,92,252,0.4)',
    flex: 1,
  },
  secondaryBtn: {
    flex: 1,
    padding: '14px 28px',
    borderRadius: 14,
    background: VIOLET,
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
  tertiaryBtn: {
    flex: 1,
    padding: '14px 28px',
    borderRadius: 14,
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: 15,
    fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.2)',
    cursor: 'pointer',
  },
  addTimeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 14px',
    borderRadius: 999,
    background: 'rgba(124,92,252,0.15)',
    color: VIOLET,
    fontSize: 13,
    fontWeight: 600,
    border: '1px solid rgba(124,92,252,0.3)',
    cursor: 'pointer',
  },
  durationLabel: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    fontWeight: 500,
  },
  completeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.4,
    textShadow: '0 0 24px rgba(124,92,252,0.6)',
  },
  notFound: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  notFoundText: {
    color: 'var(--text-primary)',
    fontSize: 18,
    fontWeight: 600,
  },
  exitBtn: {
    padding: '10px 18px',
    background: 'var(--bg-card)',
    border: 'none',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
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
    zIndex: 600,
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

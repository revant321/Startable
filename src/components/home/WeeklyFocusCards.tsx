import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { Play, Check } from 'lucide-react';
import { db } from '../../db/database';
import useIsMobile from '../../hooks/useIsMobile';
import { usePassiveSubFocuses } from '../../hooks/useGoals';
import SubFocusPicker from '../passive/SubFocusPicker';
import CheckInFlow from '../passive/CheckInFlow';
import { todayISO } from '../../utils/dateHelpers';
import type { Goal } from '../../types';

interface Props {
  activeFocus: Goal | undefined;
  passiveFocus: Goal | undefined;
}

export default function WeeklyFocusCards({ activeFocus, passiveFocus }: Props) {
  const isMobile = useIsMobile();
  return (
    <section style={styles.section}>
      <div style={styles.label}>This Week</div>
      <div
        style={{
          ...styles.grid,
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        }}
      >
        <ActiveFocusCard goal={activeFocus} />
        <PassiveFocusCard goal={passiveFocus} />
      </div>
    </section>
  );
}

function ActiveFocusCard({ goal }: { goal: Goal | undefined }) {
  const navigate = useNavigate();

  if (!goal) {
    return (
      <motion.button
        style={{ ...styles.card, ...styles.cardActive, ...styles.emptyCard }}
        whileTap={{ scale: 0.99 }}
        onClick={() => navigate('/goals', { state: { tab: 'active' } })}
      >
        <div style={{ ...styles.cardLabel, color: 'var(--active-green)' }}>
          Active Focus
        </div>
        <div style={styles.emptyTitle}>No active focus</div>
        <div style={styles.emptySubtitle}>Choose this week's focus</div>
      </motion.button>
    );
  }

  const handleCardClick = () => navigate(`/goals/${goal.id}`);
  const handleStartSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/focus/${goal.id}`);
  };

  return (
    <motion.div
      style={{ ...styles.card, ...styles.cardActive }}
      whileTap={{ scale: 0.99 }}
      onClick={handleCardClick}
    >
      <div style={{ ...styles.cardLabel, color: 'var(--active-green)' }}>
        Active Focus
      </div>
      <div style={styles.cardTitle}>{goal.title}</div>
      <div style={styles.cardSubtext}>
        {goal.currentNextStep || 'No next step set'}
      </div>
      <motion.button
        style={{ ...styles.actionBtn, background: 'var(--active-green)' }}
        whileTap={{ scale: 0.97 }}
        onClick={handleStartSession}
      >
        <Play size={14} fill="#fff" color="#fff" />
        <span>Start Session</span>
      </motion.button>
    </motion.div>
  );
}

function PassiveFocusCard({ goal }: { goal: Goal | undefined }) {
  const navigate = useNavigate();
  const [showPicker, setShowPicker] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  const today = todayISO();
  const chosenToday =
    !!goal &&
    goal.chosenSubFocusDate === today &&
    goal.chosenSubFocusId != null;

  const subFocuses = usePassiveSubFocuses(goal?.id);
  const chosenLabel =
    goal && chosenToday
      ? subFocuses.find((s) => s.id === goal.chosenSubFocusId)?.label
      : undefined;

  const goalId = goal?.id;
  const chosenSubFocusId = goal?.chosenSubFocusId;
  const todaysCheckIn = useLiveQuery(async () => {
    if (goalId == null || chosenSubFocusId == null) return null;
    const all = await db.passiveCheckIns.where('goalId').equals(goalId).toArray();
    return (
      all.find((c) => c.date === today && c.subFocusId === chosenSubFocusId) ?? null
    );
  }, [goalId, chosenSubFocusId, today]);

  if (!goal) {
    return (
      <motion.button
        style={{ ...styles.card, ...styles.cardPassive, ...styles.emptyCard }}
        whileTap={{ scale: 0.99 }}
        onClick={() => navigate('/goals', { state: { tab: 'passive' } })}
      >
        <div style={{ ...styles.cardLabel, color: 'var(--passive-blue)' }}>
          Passive Focus
        </div>
        <div style={styles.emptyTitle}>No passive focus</div>
        <div style={styles.emptySubtitle}>Choose this week's focus</div>
      </motion.button>
    );
  }

  const handleCardClick = () => navigate(`/goals/${goal.id}`);
  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chosenToday) {
      setShowPicker(true);
    } else if (!todaysCheckIn) {
      setShowCheckIn(true);
    }
  };

  let actionLabel: string;
  let actionDisabled = false;
  let actionIcon: React.ReactNode = null;
  if (!chosenToday) {
    actionLabel = "Pick today's focus";
  } else if (todaysCheckIn) {
    actionLabel = `Checked in: ${capitalize(todaysCheckIn.result)}`;
    actionDisabled = true;
    actionIcon = <Check size={14} color="#fff" />;
  } else {
    actionLabel = 'Check in';
  }

  return (
    <>
      <motion.div
        style={{ ...styles.card, ...styles.cardPassive }}
        whileTap={{ scale: 0.99 }}
        onClick={handleCardClick}
      >
        <div style={{ ...styles.cardLabel, color: 'var(--passive-blue)' }}>
          Passive Focus
        </div>
        <div style={styles.cardTitle}>{goal.title}</div>
        <div
          style={{
            ...styles.cardSubtext,
            color: chosenToday ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontStyle: chosenToday ? 'normal' : 'italic',
          }}
        >
          {chosenToday ? chosenLabel ?? 'Sub-focus removed' : "Pick today's focus"}
        </div>
        <motion.button
          style={{
            ...styles.actionBtn,
            background: 'var(--passive-blue)',
            opacity: actionDisabled ? 0.7 : 1,
            cursor: actionDisabled ? 'default' : 'pointer',
          }}
          whileTap={actionDisabled ? undefined : { scale: 0.97 }}
          onClick={handleAction}
          disabled={actionDisabled}
        >
          {actionIcon}
          <span>{actionLabel}</span>
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showPicker && (
          <SubFocusPicker goal={goal} onClose={() => setShowPicker(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCheckIn &&
          chosenToday &&
          goal.id != null &&
          goal.chosenSubFocusId != null && (
            <CheckInFlow
              goalId={goal.id}
              subFocusId={goal.chosenSubFocusId}
              subFocusLabel={chosenLabel ?? ''}
              onClose={() => setShowCheckIn(false)}
            />
          )}
      </AnimatePresence>
    </>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: 0.2,
  },
  grid: {
    display: 'grid',
    gap: 12,
  },
  card: {
    background: 'var(--bg-card)',
    borderRadius: 14,
    padding: '14px 16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    cursor: 'pointer',
    border: '1px solid transparent',
    textAlign: 'left',
  },
  cardActive: {
    border: '1px solid rgba(52,211,153,0.3)',
  },
  cardPassive: {
    border: '1px solid rgba(96,165,250,0.3)',
  },
  emptyCard: {
    minHeight: 110,
    justifyContent: 'flex-start',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.25,
    marginTop: 2,
  },
  cardSubtext: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: 4,
  },
  actionBtn: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
};

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Goal } from '../../types';

interface GoalCardProps {
  goal: Goal;
  subFocusCount?: number;
  todaySubFocus?: string;
  isFocused?: boolean;
}

export default function GoalCard({ goal, subFocusCount, todaySubFocus, isFocused }: GoalCardProps) {
  const navigate = useNavigate();
  const isActive = goal.type === 'active';
  const accent = isActive ? 'var(--active-green)' : 'var(--passive-blue)';
  const isDraft = goal.status === 'draft';

  const cardStyle: React.CSSProperties = {
    ...styles.card,
    border: isFocused ? `1px solid ${accent}` : '1px solid transparent',
    boxShadow: isFocused ? `0 0 0 1px ${accent}33 inset` : undefined,
    opacity: isDraft ? 0.7 : 1,
  };

  return (
    <motion.button
      style={cardStyle}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/goals/${goal.id}`)}
    >
      {isFocused && (
        <div style={{ ...styles.focusLabel, color: accent }}>
          THIS WEEK'S FOCUS
        </div>
      )}

      <div style={styles.titleRow}>
        <h3 style={styles.title}>{goal.title}</h3>
      </div>

      <div style={styles.badgeRow}>
        <StatusBadge status={goal.status} accent={accent} />
        {goal.category && <Tag>{goal.category}</Tag>}
        {isActive && goal.timeHorizon && (
          <Tag>{horizonLabel(goal.timeHorizon)}</Tag>
        )}
      </div>

      {isActive && goal.currentNextStep && (
        <div style={styles.nextStepPreview}>
          <span style={styles.nextStepLabel}>Next: </span>
          {goal.currentNextStep}
        </div>
      )}

      {!isActive && (
        <div style={styles.passiveMeta}>
          {todaySubFocus ? (
            <span>
              <span style={{ color: accent, fontWeight: 600 }}>Today: </span>
              {todaySubFocus}
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>
              {subFocusCount ?? 0} sub-focus{(subFocusCount ?? 0) === 1 ? '' : 'es'}
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}

function StatusBadge({ status, accent }: { status: Goal['status']; accent: string }) {
  const labels: Record<Goal['status'], string> = {
    draft: 'Draft',
    active: 'Active',
    focused: 'Focused',
    completed: 'Completed',
    archived: 'Archived',
    deleted: 'Deleted',
  };
  const isStatusGray = status === 'draft';
  const color = isStatusGray ? 'var(--text-secondary)' : accent;
  const bg = isStatusGray ? 'rgba(136, 136, 136, 0.15)' : `${accent}22`;
  return (
    <span style={{ ...styles.statusBadge, color, background: bg }}>
      {labels[status]}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span style={styles.tag}>{children}</span>;
}

function horizonLabel(h: 'short' | 'mid' | 'long') {
  return h === 'short' ? 'Short-term' : h === 'mid' ? 'Mid-term' : 'Long-term';
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: '100%',
    background: 'var(--bg-card)',
    borderRadius: 14,
    padding: '16px 18px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  focusLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.3,
  },
  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: '3px 10px',
    borderRadius: 999,
  },
  tag: {
    fontSize: 12,
    color: 'var(--text-primary)',
    background: 'var(--bg-card-hover)',
    padding: '3px 10px',
    borderRadius: 999,
    fontWeight: 500,
  },
  nextStepPreview: {
    fontSize: 14,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
    marginTop: 2,
  },
  nextStepLabel: {
    color: 'var(--text-secondary)',
    fontSize: 13,
  },
  passiveMeta: {
    fontSize: 14,
    color: 'var(--text-primary)',
    marginTop: 2,
  },
};

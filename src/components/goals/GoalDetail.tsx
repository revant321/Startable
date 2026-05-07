import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useGoal } from '../../hooks/useGoals';
import GoalDetailActive from './GoalDetailActive';
import GoalDetailPassive from './GoalDetailPassive';

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goalId = id != null ? Number(id) : undefined;
  const { goal, loading } = useGoal(goalId);

  if (loading) {
    return (
      <div style={styles.center}>
        <p style={styles.muted}>Loading...</p>
      </div>
    );
  }

  if (!goal) {
    return (
      <div style={styles.notFound}>
        <motion.button
          style={styles.backBtn}
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/goals')}
        >
          <ArrowLeft size={20} />
          <span>Back to Goals</span>
        </motion.button>
        <p style={styles.notFoundTitle}>Goal not found</p>
        <p style={styles.muted}>This goal may have been deleted.</p>
      </div>
    );
  }

  return goal.type === 'active' ? (
    <GoalDetailActive goal={goal} />
  ) : (
    <GoalDetailPassive goal={goal} />
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  notFound: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70vh',
    gap: 12,
    padding: 16,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--bg-card)',
    border: 'none',
    padding: '10px 16px',
    borderRadius: 10,
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 12,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  muted: {
    color: 'var(--text-secondary)',
    fontSize: 14,
  },
};

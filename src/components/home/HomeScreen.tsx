import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageWrapper from '../layout/PageWrapper';
import QuickTasksList from '../tasks/QuickTasksList';
import WeeklyFocusCards from './WeeklyFocusCards';
import RecentActivity from './RecentActivity';
import { useFocusedGoal } from '../../hooks/useGoals';

interface LocationState {
  toast?: string;
}

export default function HomeScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const incomingToast = (location.state as LocationState | null)?.toast;
  const [toast, setToast] = useState<string | null>(null);

  const activeFocus = useFocusedGoal('active');
  const passiveFocus = useFocusedGoal('passive');

  useEffect(() => {
    if (!incomingToast) return;
    setToast(incomingToast);
    navigate('.', { replace: true, state: null });
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [incomingToast, navigate]);

  return (
    <PageWrapper title="Startable">
      <div style={styles.container}>
        <WeeklyFocusCards activeFocus={activeFocus} passiveFocus={passiveFocus} />

        <div style={styles.divider} />

        <QuickTasksList />

        <div style={styles.divider} />

        <RecentActivity />
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            style={styles.toast}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    paddingBottom: 120,
  },
  divider: {
    height: 1,
    background: 'transparent',
    margin: '4px 0',
  },
  toast: {
    position: 'fixed',
    bottom: 100,
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    padding: '12px 20px',
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    zIndex: 400,
    border: '1px solid var(--border-subtle)',
  },
};

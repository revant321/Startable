import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import PageWrapper from '../layout/PageWrapper';
import GoalCard from './GoalCard';
import { useGoalsByType } from '../../hooks/useGoals';
import { db } from '../../db/database';
import useIsMobile from '../../hooks/useIsMobile';
import type { Goal } from '../../types';

type Tab = 'active' | 'passive';

export default function GoalsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const initialTab: Tab = (location.state as { tab?: Tab } | null)?.tab ?? 'active';
  const [tab, setTab] = useState<Tab>(initialTab);

  const { goals } = useGoalsByType(tab);

  const focused = goals.find((g) => g.isWeeklyFocus);
  const others = goals.filter((g) => !g.isWeeklyFocus);

  const accent = tab === 'active' ? 'var(--active-green)' : 'var(--passive-blue)';

  return (
    <PageWrapper title="Goals">
      <div style={styles.tabBar}>
        <TabButton active={tab === 'active'} accent="var(--active-green)" onClick={() => setTab('active')}>
          Active
        </TabButton>
        <TabButton active={tab === 'passive'} accent="var(--passive-blue)" onClick={() => setTab('passive')}>
          Passive
        </TabButton>
      </div>

      <div style={{ position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            {goals.length === 0 ? (
              <div style={styles.empty}>
                <p style={styles.emptyTitle}>No {tab} goals yet</p>
                <p style={styles.emptySubtitle}>
                  Tap + to create your first {tab} goal
                </p>
              </div>
            ) : (
              <div style={isMobile ? styles.list : styles.grid}>
                {focused && (
                  <FocusedGoalRow goal={focused} />
                )}
                {others.map((g) => (
                  <GoalRow key={g.id} goal={g} />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.button
          style={{
            ...styles.fab,
            background: accent,
            boxShadow: tab === 'active'
              ? '0 4px 16px rgba(52, 211, 153, 0.3)'
              : '0 4px 16px rgba(96, 165, 250, 0.3)',
            position: 'fixed',
            bottom: isMobile ? 'calc(96px + env(safe-area-inset-bottom, 0px))' : 32,
            right: isMobile ? 20 : 32,
          }}
          whileTap={{ scale: 0.9 }}
          onClick={() =>
            navigate('/goals/new', { state: { presetType: tab } })
          }
        >
          <Plus size={28} color="#fff" />
        </motion.button>
      </div>
    </PageWrapper>
  );
}

function TabButton({
  active,
  accent,
  onClick,
  children,
}: {
  active: boolean;
  accent: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button style={styles.tabButton} onClick={onClick}>
      <span
        style={{
          ...styles.tabLabel,
          color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}
      >
        {children}
      </span>
      <div
        style={{
          ...styles.tabUnderline,
          background: active ? accent : 'transparent',
        }}
      />
    </button>
  );
}

function FocusedGoalRow({ goal }: { goal: Goal }) {
  const meta = useGoalCardMeta(goal);
  return <GoalCard goal={goal} isFocused {...meta} />;
}

function GoalRow({ goal }: { goal: Goal }) {
  const meta = useGoalCardMeta(goal);
  return <GoalCard goal={goal} {...meta} />;
}

function useGoalCardMeta(goal: Goal) {
  const [todaySubFocus, setTodaySubFocus] = useState<string | undefined>(undefined);

  const subFocuses = useLiveQuery(async () => {
    if (goal.type !== 'passive' || goal.id == null) return [];
    return db.passiveSubFocuses.where('goalId').equals(goal.id).toArray();
  }, [goal.id, goal.type]);

  useEffect(() => {
    if (goal.type !== 'passive' || goal.id == null) return;
    const today = new Date().toISOString().slice(0, 10);
    const key = `todaySubFocus:${goal.id}:${today}`;
    const stored = localStorage.getItem(key);
    if (stored && subFocuses) {
      const found = subFocuses.find((s) => s.id === Number(stored));
      setTodaySubFocus(found?.label);
    } else {
      setTodaySubFocus(undefined);
    }
  }, [goal.id, goal.type, subFocuses]);

  return {
    subFocusCount: subFocuses?.length ?? 0,
    todaySubFocus,
  };
}

const styles: Record<string, React.CSSProperties> = {
  tabBar: {
    display: 'flex',
    gap: 4,
    marginBottom: 16,
    borderBottom: '1px solid var(--border-subtle)',
  },
  tabButton: {
    flex: 1,
    background: 'none',
    border: 'none',
    padding: '10px 0 0',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: 600,
  },
  tabUnderline: {
    height: 2,
    width: '100%',
    borderRadius: 2,
    transition: 'background 0.2s',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingBottom: 120,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
    paddingBottom: 120,
    alignItems: 'start',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    zIndex: 10,
  },
};

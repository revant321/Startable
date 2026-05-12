import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Pin, FileText } from 'lucide-react';
import PageWrapper from '../layout/PageWrapper';
import StatusIcon from '../shared/StatusIcon';
import { useAllGoalSessions, useGoalsMap } from '../../hooks/useGoals';
import { formatLongDate, timeAgo, weekKey, weekRangeLabel } from '../../utils/dateHelpers';
import type { GoalSession, Goal } from '../../types';

type View = 'all' | 'goal' | 'week';

export default function ReflectionsScreen() {
  const sessions = useAllGoalSessions();
  const goalsMap = useGoalsMap();
  const [view, setView] = useState<View>('all');

  return (
    <PageWrapper title="Reflections">
      <div style={styles.tabBar}>
        <Tab active={view === 'all'} onClick={() => setView('all')}>
          All
        </Tab>
        <Tab active={view === 'goal'} onClick={() => setView('goal')}>
          By Goal
        </Tab>
        <Tab active={view === 'week'} onClick={() => setView('week')}>
          By Week
        </Tab>
      </div>

      {sessions.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyTitle}>No reflections yet</p>
          <p style={styles.emptySubtitle}>
            Complete a focus session to see reflections here.
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {view === 'all' && <AllView sessions={sessions} goalsMap={goalsMap} />}
            {view === 'goal' && <ByGoalView sessions={sessions} goalsMap={goalsMap} />}
            {view === 'week' && <ByWeekView sessions={sessions} goalsMap={goalsMap} />}
          </motion.div>
        </AnimatePresence>
      )}
    </PageWrapper>
  );
}

function Tab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button style={styles.tabBtn} onClick={onClick}>
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
          background: active ? 'var(--active-green)' : 'transparent',
        }}
      />
    </button>
  );
}

function AllView({
  sessions,
  goalsMap,
}: {
  sessions: GoalSession[];
  goalsMap: Map<number, Goal>;
}) {
  return (
    <div style={styles.list}>
      {sessions.map((s) => (
        <ReflectionCard
          key={s.id}
          session={s}
          goal={goalsMap.get(s.goalId)}
        />
      ))}
    </div>
  );
}

function ByGoalView({
  sessions,
  goalsMap,
}: {
  sessions: GoalSession[];
  goalsMap: Map<number, Goal>;
}) {
  const groups = useMemo(() => {
    const m = new Map<number, GoalSession[]>();
    for (const s of sessions) {
      const arr = m.get(s.goalId) ?? [];
      arr.push(s);
      m.set(s.goalId, arr);
    }
    return Array.from(m.entries()).sort((a, b) => {
      const ga = goalsMap.get(a[0])?.title ?? '';
      const gb = goalsMap.get(b[0])?.title ?? '';
      return ga.localeCompare(gb);
    });
  }, [sessions, goalsMap]);

  return (
    <div style={styles.groups}>
      {groups.map(([goalId, list]) => (
        <Group
          key={goalId}
          title={goalsMap.get(goalId)?.title ?? 'Unknown goal'}
          accent={
            goalsMap.get(goalId)?.type === 'passive'
              ? 'var(--passive-blue)'
              : 'var(--active-green)'
          }
          count={list.length}
        >
          {list.map((s) => (
            <ReflectionCard
              key={s.id}
              session={s}
              goal={goalsMap.get(s.goalId)}
              hideGoalName
            />
          ))}
        </Group>
      ))}
    </div>
  );
}

function ByWeekView({
  sessions,
  goalsMap,
}: {
  sessions: GoalSession[];
  goalsMap: Map<number, Goal>;
}) {
  const groups = useMemo(() => {
    const m = new Map<string, GoalSession[]>();
    for (const s of sessions) {
      const k = weekKey(s.startedAt);
      const arr = m.get(k) ?? [];
      arr.push(s);
      m.set(k, arr);
    }
    return Array.from(m.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sessions]);

  return (
    <div style={styles.groups}>
      {groups.map(([key, list]) => (
        <Group
          key={key}
          title={weekRangeLabel(key)}
          subtitle={`${list.length} session${list.length === 1 ? '' : 's'}`}
        >
          {list.map((s) => (
            <ReflectionCard
              key={s.id}
              session={s}
              goal={goalsMap.get(s.goalId)}
            />
          ))}
        </Group>
      ))}
    </div>
  );
}

function Group({
  title,
  subtitle,
  accent,
  count,
  children,
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  count?: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section style={styles.group}>
      <button style={styles.groupHeader} onClick={() => setOpen((o) => !o)}>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'inline-flex' }}
        >
          <ChevronDown size={16} color="var(--text-secondary)" />
        </motion.span>
        <span style={{ ...styles.groupTitle, color: accent ?? 'var(--text-primary)' }}>
          {title}
        </span>
        {count != null && <span style={styles.groupCount}>({count})</span>}
        {subtitle && <span style={styles.groupSubtitle}>{subtitle}</span>}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={styles.list}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ReflectionCard({
  session,
  goal,
  hideGoalName = false,
}: {
  session: GoalSession;
  goal: Goal | undefined;
  hideGoalName?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const isActive = goal?.type === 'active';
  const accent = isActive ? 'var(--active-green)' : 'var(--passive-blue)';

  const hasExtras = !!session.reminderForNextTime || !!session.noteAdded;

  return (
    <motion.div
      style={styles.card}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button
        style={styles.cardHeader}
        onClick={() => hasExtras && setExpanded((e) => !e)}
      >
        <div style={styles.cardTopRow}>
          <span style={styles.cardDate}>
            {formatLongDate(session.startedAt)} · {timeAgo(session.startedAt)}
          </span>
          <span style={styles.cardDuration}>{session.durationMinutes} min</span>
        </div>

        {!hideGoalName && goal && (
          <button
            style={{ ...styles.goalLink, color: accent }}
            onClick={(e) => {
              e.stopPropagation();
              if (goal.id != null) navigate(`/goals/${goal.id}`);
            }}
          >
            {goal.title}
          </button>
        )}

        <div style={styles.cardMid}>
          <StatusIcon status={session.progressRating} size="sm" />
          {session.summary ? (
            <span style={styles.summary}>{session.summary}</span>
          ) : (
            <span style={styles.summaryEmpty}>No summary</span>
          )}
        </div>

        {session.nextStep && (
          <div style={styles.nextStep}>
            <span style={styles.nextStepLabel}>Next:</span>
            <span style={styles.nextStepText}>{session.nextStep}</span>
          </div>
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && hasExtras && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={styles.expandedBody}>
              {session.reminderForNextTime && (
                <div style={styles.extraRow}>
                  <Pin size={13} color="var(--text-secondary)" />
                  <span style={styles.extraText}>
                    {session.reminderForNextTime}
                  </span>
                </div>
              )}
              {session.noteAdded && (
                <div style={styles.extraRow}>
                  <FileText size={13} color="var(--text-secondary)" />
                  <span style={styles.extraText}>{session.noteAdded}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tabBar: {
    display: 'flex',
    gap: 4,
    marginBottom: 16,
    borderBottom: '1px solid var(--border-subtle)',
  },
  tabBtn: {
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
    fontSize: 14,
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
    paddingBottom: 120,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingBottom: 120,
  },
  groups: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingBottom: 120,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    padding: '4px 0',
    cursor: 'pointer',
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: 700,
  },
  groupCount: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  groupSubtitle: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginLeft: 'auto',
  },
  card: {
    background: 'var(--bg-card)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '14px 16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  cardDuration: {
    fontSize: 12,
    color: 'var(--text-primary)',
    fontWeight: 600,
    background: 'var(--bg-card-hover)',
    padding: '2px 8px',
    borderRadius: 999,
  },
  goalLink: {
    fontSize: 14,
    fontWeight: 600,
    background: 'none',
    border: 'none',
    padding: 0,
    textAlign: 'left',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
  cardMid: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  summary: {
    fontSize: 14,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
    flex: 1,
  },
  summaryEmpty: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    flex: 1,
  },
  nextStep: {
    display: 'flex',
    gap: 6,
    fontSize: 13,
    lineHeight: 1.4,
    marginTop: 2,
  },
  nextStepLabel: {
    color: 'var(--text-secondary)',
    fontWeight: 600,
    flexShrink: 0,
  },
  nextStepText: {
    color: 'var(--text-primary)',
  },
  expandedBody: {
    padding: '0 16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    borderTop: '1px solid var(--border-subtle)',
    paddingTop: 10,
  },
  extraRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  extraText: {
    fontSize: 13,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
    fontStyle: 'italic',
  },
};

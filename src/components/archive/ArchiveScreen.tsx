import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { RotateCcw, Trash2, Inbox as InboxIcon, Target } from 'lucide-react';
import PageWrapper from '../layout/PageWrapper';
import useIsMobile from '../../hooks/useIsMobile';
import { useToast } from '../ui/Toast';
import { db } from '../../db/database';
import {
  formatLongDate,
  timeAgo,
} from '../../utils/dateHelpers';
import {
  autoDeleteCountdownLabel,
  daysUntilAutoDelete,
  clearAllTrash,
  purgeGoalCascade,
} from '../../utils/trashCleanup';
import { formatTotalTime } from './ArchiveGoalView';
import type { Goal, InboxItem, GoalSession, PassiveCheckIn } from '../../types';

type Tab = 'archive' | 'trash';

interface ArchiveGoalRow {
  goal: Goal;
  sessionCount: number;
  totalMinutes: number;
  checkInCount: number;
}

export default function ArchiveScreen() {
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<Tab>('archive');
  const [confirmClear, setConfirmClear] = useState(false);
  const { show } = useToast();

  const archiveRows: ArchiveGoalRow[] | undefined = useLiveQuery(async () => {
    const goals = await db.goals
      .filter((g) => g.status === 'completed' || g.status === 'archived')
      .toArray();
    const sessions = await db.goalSessions.toArray();
    const checkIns = await db.passiveCheckIns.toArray();
    const sessionsByGoal = new Map<number, GoalSession[]>();
    for (const s of sessions) {
      if (!sessionsByGoal.has(s.goalId)) sessionsByGoal.set(s.goalId, []);
      sessionsByGoal.get(s.goalId)!.push(s);
    }
    const checkInsByGoal = new Map<number, PassiveCheckIn[]>();
    for (const c of checkIns) {
      if (!checkInsByGoal.has(c.goalId)) checkInsByGoal.set(c.goalId, []);
      checkInsByGoal.get(c.goalId)!.push(c);
    }
    return goals
      .map((g): ArchiveGoalRow => {
        const goalSessions = g.id != null ? sessionsByGoal.get(g.id) ?? [] : [];
        const goalCheckIns = g.id != null ? checkInsByGoal.get(g.id) ?? [] : [];
        return {
          goal: g,
          sessionCount: goalSessions.length,
          totalMinutes: goalSessions.reduce((sum, s) => sum + s.durationMinutes, 0),
          checkInCount: goalCheckIns.length,
        };
      })
      .sort((a, b) =>
        (b.goal.lastWorkedAt ?? b.goal.updatedAt).localeCompare(
          a.goal.lastWorkedAt ?? a.goal.updatedAt
        )
      );
  });

  const trashInbox = useLiveQuery(async () => {
    const items = await db.inboxItems.filter((i) => i.status === 'deleted').toArray();
    return items.sort((a, b) =>
      (b.deletedAt ?? '').localeCompare(a.deletedAt ?? '')
    );
  });
  const trashGoals = useLiveQuery(async () => {
    const items = await db.goals.filter((g) => g.status === 'deleted').toArray();
    return items.sort((a, b) =>
      (b.deletedAt ?? '').localeCompare(a.deletedAt ?? '')
    );
  });

  const trashCount = (trashInbox?.length ?? 0) + (trashGoals?.length ?? 0);

  const handleClearAll = async () => {
    await clearAllTrash();
    setConfirmClear(false);
    show('Trash emptied', 'success');
  };

  const titleRight =
    tab === 'trash' && trashCount > 0 ? (
      <motion.button
        style={styles.clearAllBtn}
        whileTap={{ scale: 0.95 }}
        onClick={() => setConfirmClear(true)}
      >
        Clear All
      </motion.button>
    ) : undefined;

  return (
    <PageWrapper title="Archive & Trash" rightAction={titleRight}>
      <div style={styles.tabBar}>
        <TabButton
          active={tab === 'archive'}
          onClick={() => setTab('archive')}
          accent="var(--active-green)"
        >
          Archive
        </TabButton>
        <TabButton
          active={tab === 'trash'}
          onClick={() => setTab('trash')}
          accent="#FF6B6B"
        >
          Trash {trashCount > 0 && <span style={styles.tabCount}>{trashCount}</span>}
        </TabButton>
      </div>

      <div style={{ paddingBottom: 16 }}>
        <AnimatePresence mode="wait">
          {tab === 'archive' ? (
            <motion.div
              key="archive"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              <ArchiveTab rows={archiveRows} isMobile={isMobile} />
            </motion.div>
          ) : (
            <motion.div
              key="trash"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
            >
              <TrashTab
                inboxItems={trashInbox ?? []}
                goals={trashGoals ?? []}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {confirmClear && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmClear(false)}
          >
            <motion.div
              style={styles.confirmCard}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={styles.confirmTitle}>Empty trash?</h3>
              <p style={styles.confirmBody}>
                This permanently deletes everything in trash. This cannot be undone.
              </p>
              <div style={styles.confirmActions}>
                <button style={styles.confirmCancelBtn} onClick={() => setConfirmClear(false)}>
                  Cancel
                </button>
                <button style={styles.confirmDangerBtn} onClick={handleClearAll}>
                  Empty Trash
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
          display: 'flex',
          alignItems: 'center',
          gap: 8,
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

function ArchiveTab({
  rows,
  isMobile,
}: {
  rows: ArchiveGoalRow[] | undefined;
  isMobile: boolean;
}) {
  const navigate = useNavigate();

  if (rows === undefined) {
    return <p style={styles.loading}>Loading...</p>;
  }

  if (rows.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyTitle}>No archived goals yet</p>
        <p style={styles.emptySubtitle}>
          Completed and retired goals will appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={isMobile ? styles.list : styles.grid}>
      {rows.map(({ goal, sessionCount, totalMinutes, checkInCount }) => {
        const isActive = goal.type === 'active';
        const accent = isActive ? 'var(--active-green)' : 'var(--passive-blue)';
        const dateText = goal.lastWorkedAt
          ? formatLongDate(goal.lastWorkedAt)
          : formatLongDate(goal.updatedAt);
        const meta = isActive
          ? `${sessionCount} session${sessionCount === 1 ? '' : 's'}${
              totalMinutes ? ` · ${formatTotalTime(totalMinutes)}` : ''
            }`
          : `${checkInCount} check-in${checkInCount === 1 ? '' : 's'}`;
        return (
          <motion.button
            key={goal.id}
            style={styles.archiveCard}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/archive/goals/${goal.id}`)}
          >
            <div style={styles.archiveTopRow}>
              <h3 style={styles.archiveTitle}>{goal.title}</h3>
              <span
                style={{
                  ...styles.typeChip,
                  color: accent,
                  background: isActive ? 'rgba(52,211,153,0.15)' : 'rgba(96,165,250,0.15)',
                }}
              >
                {isActive ? 'Active' : 'Passive'}
              </span>
            </div>
            <div style={styles.archiveMeta}>
              {goal.category && <span style={styles.archiveTag}>{goal.category}</span>}
              <span style={styles.archiveDate}>
                {goal.status === 'completed' ? 'Completed' : 'Retired'} {dateText}
              </span>
            </div>
            <p style={styles.archiveMetaLine}>{meta}</p>
          </motion.button>
        );
      })}
    </div>
  );
}

function TrashTab({
  inboxItems,
  goals,
  isMobile,
}: {
  inboxItems: InboxItem[];
  goals: Goal[];
  isMobile: boolean;
}) {
  const total = inboxItems.length + goals.length;
  if (total === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyTitle}>Trash is empty</p>
        <p style={styles.emptySubtitle}>
          Deleted ideas and goals appear here for 3 days before being purged.
        </p>
      </div>
    );
  }

  return (
    <div style={isMobile ? styles.list : styles.grid}>
      {inboxItems.map((item) => (
        <TrashItemCard key={`inbox-${item.id}`} kind="inbox" item={item} />
      ))}
      {goals.map((g) => (
        <TrashItemCard key={`goal-${g.id}`} kind="goal" item={g} />
      ))}
    </div>
  );
}

function TrashItemCard({
  kind,
  item,
}: {
  kind: 'inbox' | 'goal';
  item: InboxItem | Goal;
}) {
  const { show } = useToast();
  const [confirmPurge, setConfirmPurge] = useState(false);
  const deletedAt = item.deletedAt ?? new Date().toISOString();
  const days = daysUntilAutoDelete(deletedAt);
  const urgent = days <= 1;

  const handleRestore = async () => {
    if (kind === 'inbox' && (item as InboxItem).id != null) {
      await db.inboxItems.update((item as InboxItem).id!, {
        status: 'active',
        deletedAt: undefined,
      });
      show('Idea restored', 'success');
    } else if (kind === 'goal' && (item as Goal).id != null) {
      await db.goals.update((item as Goal).id!, {
        status: 'active',
        deletedAt: undefined,
        updatedAt: new Date().toISOString(),
      });
      show('Goal restored', 'success');
    }
  };

  const handlePurge = async () => {
    if (kind === 'inbox' && (item as InboxItem).id != null) {
      await db.inboxItems.delete((item as InboxItem).id!);
    } else if (kind === 'goal' && (item as Goal).id != null) {
      await purgeGoalCascade((item as Goal).id!);
    }
    setConfirmPurge(false);
    show('Permanently deleted', 'success');
  };

  const isGoal = kind === 'goal';
  const goal = isGoal ? (item as Goal) : null;
  const accent =
    goal?.type === 'active'
      ? 'var(--active-green)'
      : goal?.type === 'passive'
        ? 'var(--passive-blue)'
        : 'var(--text-secondary)';

  return (
    <>
      <div style={styles.trashCard}>
        <div style={styles.trashHeader}>
          <div style={styles.trashKindBadge}>
            {isGoal ? (
              <Target size={13} color={accent} />
            ) : (
              <InboxIcon size={13} color="var(--text-secondary)" />
            )}
            <span style={{ color: isGoal ? accent : 'var(--text-secondary)' }}>
              {isGoal ? `${goal?.type === 'active' ? 'Active' : 'Passive'} goal` : 'Idea'}
            </span>
          </div>
          <span
            style={{
              ...styles.countdown,
              color: urgent ? '#FF6B6B' : 'var(--text-secondary)',
              fontWeight: urgent ? 700 : 500,
            }}
          >
            {autoDeleteCountdownLabel(deletedAt)}
          </span>
        </div>
        <h3 style={styles.trashTitle}>{item.title}</h3>
        <div style={styles.trashFooter}>
          <span style={styles.trashTimeAgo}>Deleted {timeAgo(deletedAt)}</span>
          <div style={styles.trashActions}>
            <motion.button
              style={styles.trashActionBtn}
              whileTap={{ scale: 0.94 }}
              onClick={handleRestore}
              aria-label="Restore"
              title="Restore"
            >
              <RotateCcw size={16} color="var(--active-green)" />
            </motion.button>
            <motion.button
              style={styles.trashActionBtn}
              whileTap={{ scale: 0.94 }}
              onClick={() => setConfirmPurge(true)}
              aria-label="Delete permanently"
              title="Delete permanently"
            >
              <Trash2 size={16} color="#FF6B6B" />
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {confirmPurge && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmPurge(false)}
          >
            <motion.div
              style={styles.confirmCard}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={styles.confirmTitle}>Delete permanently?</h3>
              <p style={styles.confirmBody}>
                "{item.title}" will be removed for good. This cannot be undone.
              </p>
              <div style={styles.confirmActions}>
                <button style={styles.confirmCancelBtn} onClick={() => setConfirmPurge(false)}>
                  Cancel
                </button>
                <button style={styles.confirmDangerBtn} onClick={handlePurge}>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
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
  tabCount: {
    fontSize: 11,
    fontWeight: 700,
    background: 'var(--bg-card)',
    color: 'var(--text-secondary)',
    padding: '2px 8px',
    borderRadius: 999,
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
    minHeight: '40vh',
    gap: 8,
    textAlign: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    maxWidth: 320,
    lineHeight: 1.4,
  },
  loading: {
    color: 'var(--text-secondary)',
    fontSize: 14,
    textAlign: 'center',
    padding: 24,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 16,
    alignItems: 'start',
  },
  archiveCard: {
    width: '100%',
    background: 'var(--bg-card)',
    borderRadius: 14,
    padding: '16px 18px',
    textAlign: 'left',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: 'var(--card-shadow)',
    border: 'none',
  },
  archiveTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  archiveTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.3,
    flex: 1,
  },
  typeChip: {
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 999,
    flexShrink: 0,
  },
  archiveMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  archiveTag: {
    fontSize: 12,
    color: 'var(--text-primary)',
    background: 'var(--bg-card-hover)',
    padding: '3px 10px',
    borderRadius: 999,
  },
  archiveDate: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  archiveMetaLine: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  trashCard: {
    background: 'var(--bg-card)',
    borderRadius: 14,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: 'var(--card-shadow)',
  },
  trashHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  trashKindBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  countdown: {
    fontSize: 12,
  },
  trashTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    lineHeight: 1.3,
  },
  trashFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  trashTimeAgo: {
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  trashActions: {
    display: 'flex',
    gap: 4,
  },
  trashActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'var(--bg-card-hover)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
  },
  clearAllBtn: {
    background: 'none',
    border: '1.5px solid #FF6B6B',
    color: '#FF6B6B',
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'var(--modal-backdrop)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
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
    marginTop: 8,
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
  confirmDangerBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    background: '#FF6B6B',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
};

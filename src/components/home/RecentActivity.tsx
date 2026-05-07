import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Timer, CheckCircle, Inbox as InboxIcon } from 'lucide-react';
import { useRecentActivity, useActiveInboxCount } from '../../hooks/useActivity';
import { useGoalsMap } from '../../hooks/useGoals';
import { timeAgo } from '../../utils/dateHelpers';
import type { ActivityEntry } from '../../hooks/useActivity';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';

export default function RecentActivity() {
  const navigate = useNavigate();
  const entries = useRecentActivity(7);
  const goals = useGoalsMap();
  const inboxCount = useActiveInboxCount();

  // Collect all sub-focus ids referenced by check-ins so we can label them
  const subFocusIds = entries
    .filter((e) => e.kind === 'checkIn')
    .map((e) => (e.kind === 'checkIn' ? e.data.subFocusId : 0));
  const subFocusLabels = useLiveQuery(async () => {
    if (subFocusIds.length === 0) return new Map<number, string>();
    const list = await db.passiveSubFocuses.where('id').anyOf(subFocusIds).toArray();
    const m = new Map<number, string>();
    for (const sf of list) if (sf.id != null) m.set(sf.id, sf.label);
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subFocusIds.join(',')]);

  return (
    <section style={styles.section}>
      <div style={styles.header}>
        <span style={styles.label}>Recent</span>
      </div>

      {inboxCount > 0 && (
        <motion.button
          style={styles.inboxBanner}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/inbox')}
        >
          <InboxIcon size={16} color="var(--active-green)" />
          <span style={styles.inboxText}>
            {inboxCount === 1
              ? '1 idea waiting in your inbox'
              : `${inboxCount} ideas waiting in your inbox`}
          </span>
        </motion.button>
      )}

      {entries.length === 0 ? (
        <div style={styles.empty}>Your activity will show up here</div>
      ) : (
        <div style={styles.list}>
          {entries.map((entry) => (
            <ActivityRow
              key={`${entry.kind}-${entry.data.id}`}
              entry={entry}
              goalTitle={
                goals.get(entry.data.goalId)?.title ?? '(deleted goal)'
              }
              goalType={goals.get(entry.data.goalId)?.type}
              subFocusLabel={
                entry.kind === 'checkIn'
                  ? subFocusLabels?.get(entry.data.subFocusId)
                  : undefined
              }
              onClick={() => navigate(`/goals/${entry.data.goalId}`)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface RowProps {
  entry: ActivityEntry;
  goalTitle: string;
  goalType: 'active' | 'passive' | undefined;
  subFocusLabel?: string;
  onClick: () => void;
}

function ActivityRow({ entry, goalTitle, goalType, subFocusLabel, onClick }: RowProps) {
  const accent =
    goalType === 'passive' ? 'var(--passive-blue)' : 'var(--active-green)';

  if (entry.kind === 'session') {
    const s = entry.data;
    return (
      <motion.button
        style={styles.row}
        whileTap={{ scale: 0.99 }}
        onClick={onClick}
      >
        <div style={{ ...styles.iconWrap, color: accent }}>
          <Timer size={16} />
        </div>
        <div style={styles.rowBody}>
          <div style={styles.rowText}>
            <span>{s.durationMinutes} min on </span>
            <span style={{ color: accent, fontWeight: 600 }}>{goalTitle}</span>
          </div>
          {s.summary && <div style={styles.rowSubtext}>{s.summary}</div>}
        </div>
        <span style={styles.timeAgo}>{timeAgo(entry.timestamp)}</span>
      </motion.button>
    );
  }

  // check-in
  const c = entry.data;
  const resultLabel = capitalize(c.result);
  return (
    <motion.button
      style={styles.row}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
    >
      <div style={{ ...styles.iconWrap, color: accent }}>
        <CheckCircle size={16} />
      </div>
      <div style={styles.rowBody}>
        <div style={styles.rowText}>
          {subFocusLabel ? (
            <>
              <span>{subFocusLabel}: </span>
              <span style={{ color: accent, fontWeight: 600 }}>{resultLabel}</span>
            </>
          ) : (
            <>
              <span style={{ color: accent, fontWeight: 600 }}>{goalTitle}</span>
              <span> · {resultLabel}</span>
            </>
          )}
        </div>
        {c.note && <div style={styles.rowSubtext}>{c.note}</div>}
      </div>
      <span style={styles.timeAgo}>{timeAgo(entry.timestamp)}</span>
    </motion.button>
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
    paddingTop: 8,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: 0.2,
  },
  inboxBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(52,211,153,0.08)',
    border: '1px solid rgba(52,211,153,0.25)',
    borderRadius: 12,
    padding: '10px 14px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  inboxText: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: '10px 12px',
    cursor: 'pointer',
    border: 'none',
    textAlign: 'left',
    width: '100%',
  },
  iconWrap: {
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  rowText: {
    fontSize: 14,
    color: 'var(--text-primary)',
    lineHeight: 1.35,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  rowSubtext: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.35,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  timeAgo: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    flexShrink: 0,
    marginTop: 6,
  },
  empty: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    padding: '12px 4px',
  },
};

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, Pin } from 'lucide-react';
import {
  useGoal,
  useGoalNotes,
  useGoalSessions,
  usePassiveSubFocuses,
  usePassiveCheckIns,
} from '../../hooks/useGoals';
import { db } from '../../db/database';
import useIsMobile from '../../hooks/useIsMobile';
import { formatLongDate, timeAgo } from '../../utils/dateHelpers';
import { useToast } from '../ui/Toast';
import StatusIcon from '../shared/StatusIcon';
import type { Goal } from '../../types';

export default function ArchiveGoalView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const goalId = id != null ? Number(id) : undefined;
  const { goal, loading } = useGoal(goalId);
  const { show } = useToast();
  const [confirmRestore, setConfirmRestore] = useState(false);

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
        <p style={styles.notFoundTitle}>Goal not found</p>
        <p style={styles.muted}>This goal may have been permanently removed.</p>
        <motion.button
          style={styles.linkBtn}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/archive')}
        >
          Back to Archive
        </motion.button>
      </div>
    );
  }

  const isActive = goal.type === 'active';
  const accent = isActive ? 'var(--active-green)' : 'var(--passive-blue)';

  const handleRestore = async () => {
    if (goal.id == null) return;
    await db.goals.update(goal.id, {
      status: isActive ? 'active' : 'active',
      updatedAt: new Date().toISOString(),
    });
    setConfirmRestore(false);
    show(`Restored to ${isActive ? 'Active' : 'Passive'} goals`, 'success');
    navigate('/goals', { state: { tab: goal.type } });
  };

  return (
    <div style={{ ...styles.wrap, padding: isMobile ? '0 16px 100px' : '0 32px 60px' }}>
      <header style={styles.header}>
        <motion.button
          style={styles.iconBtn}
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/archive')}
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </motion.button>
        <motion.button
          style={{ ...styles.restoreBtn, color: accent, borderColor: accent }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setConfirmRestore(true)}
        >
          <RotateCcw size={15} />
          <span>Restore</span>
        </motion.button>
      </header>

      <div style={styles.titleSection}>
        <h1 style={{ ...styles.title, fontSize: isMobile ? 24 : 28 }}>{goal.title}</h1>
        <div style={styles.badgeRow}>
          <span
            style={{
              ...styles.statusBadge,
              color: 'var(--text-secondary)',
              background: 'rgba(136,136,136,0.18)',
            }}
          >
            {goal.status === 'completed' ? 'Completed' : 'Archived'}
          </span>
          <span
            style={{
              ...styles.typeBadge,
              color: accent,
              background: isActive ? 'rgba(52,211,153,0.15)' : 'rgba(96,165,250,0.15)',
            }}
          >
            {isActive ? 'Active goal' : 'Passive goal'}
          </span>
          {goal.category && <Tag>{goal.category}</Tag>}
        </div>
        {goal.lastWorkedAt && (
          <p style={styles.dateLine}>
            {goal.status === 'completed' ? 'Completed' : 'Retired'} {timeAgo(goal.lastWorkedAt)}
          </p>
        )}
      </div>

      {goal.whyItMatters && (
        <Section title="Why this matters">
          <p style={styles.bodyText}>{goal.whyItMatters}</p>
        </Section>
      )}

      {isActive && goal.currentNextStep && (
        <Section title="Last next step">
          <p style={{ ...styles.bodyText, fontWeight: 600 }}>{goal.currentNextStep}</p>
        </Section>
      )}

      {goal.reminder && (
        <Section title="Reminder">
          <div style={styles.reminderRow}>
            <Pin size={14} color="var(--text-secondary)" />
            <span style={{ ...styles.bodyText, fontStyle: 'italic' }}>{goal.reminder}</span>
          </div>
        </Section>
      )}

      {isActive ? (
        <ReadOnlyActiveDetails goal={goal} />
      ) : (
        <ReadOnlyPassiveDetails goal={goal} />
      )}

      {goalId != null && <ReadOnlyNotes goalId={goalId} />}

      <AnimatePresence>
        {confirmRestore && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmRestore(false)}
          >
            <motion.div
              style={styles.confirmCard}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={styles.confirmTitle}>Restore this goal?</h3>
              <p style={styles.confirmBody}>
                It will be moved back to your {isActive ? 'Active' : 'Passive'} goals.
              </p>
              <div style={styles.confirmActions}>
                <button
                  style={styles.confirmCancelBtn}
                  onClick={() => setConfirmRestore(false)}
                >
                  Cancel
                </button>
                <motion.button
                  style={{ ...styles.confirmPrimaryBtn, background: accent }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleRestore}
                >
                  Restore
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReadOnlyActiveDetails({ goal }: { goal: Goal }) {
  const sessions = useGoalSessions(goal.id);
  if (sessions.length === 0) {
    return (
      <Section title={`Sessions (0)`}>
        <p style={styles.empty}>No sessions logged.</p>
      </Section>
    );
  }
  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  return (
    <Section title={`Sessions (${sessions.length})`} subtitle={formatTotalTime(totalMinutes)}>
      <div style={styles.list}>
        {sessions.map((s) => (
          <div key={s.id} style={styles.dataCard}>
            <div style={styles.dataTopRow}>
              <span style={styles.dataDate}>{formatLongDate(s.startedAt)}</span>
              <span style={styles.dataValue}>{s.durationMinutes} min</span>
            </div>
            <div style={styles.dataMid}>
              <StatusIcon status={s.progressRating} size="sm" />
              {s.summary && <span style={styles.summary}>{s.summary}</span>}
            </div>
            {s.nextStep && <p style={styles.subtle}>Next: {s.nextStep}</p>}
          </div>
        ))}
      </div>
    </Section>
  );
}

function ReadOnlyPassiveDetails({ goal }: { goal: Goal }) {
  const subFocuses = usePassiveSubFocuses(goal.id);
  const checkIns = usePassiveCheckIns(goal.id);
  const labelById = (id: number) =>
    subFocuses.find((s) => s.id === id)?.label ?? '(removed)';

  return (
    <>
      {subFocuses.length > 0 && (
        <Section title="Sub-focuses">
          <div style={styles.list}>
            {subFocuses.map((sf) => (
              <div key={sf.id} style={styles.subFocusRow}>
                {sf.label}
              </div>
            ))}
          </div>
        </Section>
      )}
      <Section title={`Check-ins (${checkIns.length})`}>
        {checkIns.length === 0 ? (
          <p style={styles.empty}>No check-ins logged.</p>
        ) : (
          <div style={styles.list}>
            {checkIns.map((c) => (
              <div key={c.id} style={styles.dataCard}>
                <div style={styles.dataTopRow}>
                  <span style={styles.dataDate}>{formatLongDate(c.date)}</span>
                  <ResultPill result={c.result} />
                </div>
                <div style={styles.subtle}>{labelById(c.subFocusId)}</div>
                {c.note && <div style={styles.subtle}>{c.note}</div>}
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

function ReadOnlyNotes({ goalId }: { goalId: number }) {
  const notes = useGoalNotes(goalId);
  if (notes.length === 0) {
    return (
      <Section title="Notes (0)">
        <p style={styles.empty}>No notes.</p>
      </Section>
    );
  }
  return (
    <Section title={`Notes (${notes.length})`}>
      <div style={styles.list}>
        {notes.map((n) => (
          <div key={n.id} style={styles.dataCard}>
            <div style={styles.noteContent}>{n.content}</div>
            <div style={styles.subtle}>{timeAgo(n.createdAt)}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHeaderRow}>
        <h3 style={styles.sectionTitle}>{title}</h3>
        {subtitle && <span style={styles.sectionSubtitle}>{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

function ResultPill({ result }: { result: 'good' | 'okay' | 'missed' }) {
  const config: Record<typeof result, { label: string; color: string; bg: string }> = {
    good: { label: 'Good', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
    okay: { label: 'Okay', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
    missed: { label: 'Missed', color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)' },
  };
  const c = config[result];
  return (
    <span style={{ ...styles.resultBadge, color: c.color, background: c.bg }}>
      {c.label}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span style={styles.tag}>{children}</span>;
}

export function formatTotalTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    flex: 1,
    width: '100%',
    overflow: 'auto',
  },
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
  notFoundTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  muted: {
    color: 'var(--text-secondary)',
    fontSize: 14,
  },
  linkBtn: {
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    padding: '10px 16px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 'env(safe-area-inset-top, 16px)',
    paddingBottom: 8,
    minHeight: 56,
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 8,
  },
  restoreBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: '1.5px solid',
    background: 'transparent',
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    paddingTop: 8,
    marginBottom: 24,
  },
  title: {
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
  },
  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: 999,
  },
  typeBadge: {
    fontSize: 12,
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: 999,
  },
  tag: {
    fontSize: 12,
    color: 'var(--text-primary)',
    background: 'var(--bg-card-hover)',
    padding: '4px 12px',
    borderRadius: 999,
    fontWeight: 500,
  },
  dateLine: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
  },
  bodyText: {
    fontSize: 15,
    color: 'var(--text-primary)',
    lineHeight: 1.5,
  },
  reminderRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: '12px 14px',
  },
  empty: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  dataCard: {
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    boxShadow: 'var(--card-shadow)',
  },
  dataTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataDate: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  dataValue: {
    fontSize: 13,
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  dataMid: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  summary: {
    fontSize: 14,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
  },
  subtle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  resultBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: 999,
  },
  subFocusRow: {
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 15,
    color: 'var(--text-primary)',
    boxShadow: 'var(--card-shadow)',
  },
  noteContent: {
    fontSize: 15,
    color: 'var(--text-primary)',
    lineHeight: 1.45,
    whiteSpace: 'pre-wrap',
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
  confirmPrimaryBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
};

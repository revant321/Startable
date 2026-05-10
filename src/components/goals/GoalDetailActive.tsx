import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Pin,
  Star,
  Check,
  Trash2,
  Edit3,
  Play,
  Zap,
} from 'lucide-react';
import { db } from '../../db/database';
import { useGoalSessions, setWeeklyFocus, removeWeeklyFocus } from '../../hooks/useGoals';
import useIsMobile from '../../hooks/useIsMobile';
import InlineEdit from './InlineEdit';
import OverflowMenu from './OverflowMenu';
import CollapsibleSection from './CollapsibleSection';
import NotesSection from './NotesSection';
import StatusIcon from '../shared/StatusIcon';
import { formatLongDate } from '../../utils/dateHelpers';
import type { Goal } from '../../types';

interface Props {
  goal: Goal;
}

const ACCENT = 'var(--active-green)';

export default function GoalDetailActive({ goal }: Props) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const sessions = useGoalSessions(goal.id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);

  const isDraft = goal.status === 'draft';

  const updateGoal = async (patch: Partial<Goal>) => {
    if (!goal.id) return;
    await db.goals.update(goal.id, { ...patch, updatedAt: new Date().toISOString() });
  };

  const handleStartSession = () => {
    navigate(`/focus/${goal.id}`);
  };

  const menuItems = [
    {
      label: 'Edit Goal',
      icon: <Edit3 size={16} />,
      onClick: () => setEditingTitle(true),
    },
    {
      label: goal.isWeeklyFocus ? 'Remove from Weekly Focus' : 'Set as Weekly Focus',
      icon: <Star size={16} />,
      onClick: () => (goal.isWeeklyFocus ? removeWeeklyFocus(goal) : setWeeklyFocus(goal)),
    },
    {
      label: 'Mark as Completed',
      icon: <Check size={16} />,
      onClick: () => updateGoal({ status: 'completed', isWeeklyFocus: false }).then(() => navigate('/goals')),
    },
    {
      label: 'Delete',
      icon: <Trash2 size={16} />,
      onClick: () => setConfirmDelete(true),
      destructive: true,
    },
  ];

  const handleConfirmDelete = async () => {
    const now = new Date().toISOString();
    await updateGoal({ status: 'deleted', deletedAt: now, isWeeklyFocus: false });
    navigate('/goals');
  };

  return (
    <div style={{ ...styles.wrap, padding: isMobile ? '0 16px 100px' : '0 32px 60px' }}>
      <header style={styles.header}>
        <motion.button
          style={styles.iconBtn}
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/goals')}
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </motion.button>
        <OverflowMenu items={menuItems} />
      </header>

      <div style={isMobile ? styles.singleColumn : styles.twoColumn}>
        <div style={isMobile ? undefined : styles.leftColumn}>
          {/* Title + status */}
          <div style={styles.titleSection}>
            {editingTitle ? (
              <InlineEdit
                value={goal.title}
                onSave={async (next) => {
                  if (next) await updateGoal({ title: next });
                  setEditingTitle(false);
                }}
                accent={ACCENT}
                inputStyle={{ fontSize: isMobile ? 22 : 26, fontWeight: 700 }}
              />
            ) : (
              <h1
                style={{ ...styles.title, fontSize: isMobile ? 24 : 28, cursor: 'pointer' }}
                onClick={() => setEditingTitle(true)}
              >
                {goal.title}
              </h1>
            )}

            <div style={styles.badgeRow}>
              <StatusBadge status={goal.status} />
              {goal.category && <Tag>{goal.category}</Tag>}
              {goal.timeHorizon && <Tag>{horizonLabel(goal.timeHorizon)}</Tag>}
            </div>
          </div>

          {/* Why this matters */}
          <div style={styles.whyBlock}>
            <div style={styles.smallLabel}>Why this matters</div>
            <InlineEdit
              value={goal.whyItMatters ?? ''}
              placeholder="Add your motivation"
              emptyText="Add your motivation"
              multiline
              accent={ACCENT}
              onSave={(next) => updateGoal({ whyItMatters: next || undefined })}
              textStyle={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.5 }}
            />
          </div>

          {/* Next step card */}
          <div style={styles.nextStepCard}>
            <div style={styles.smallLabel}>Next Step</div>
            <div style={styles.nextStepTextWrap}>
              <InlineEdit
                value={goal.currentNextStep ?? ''}
                placeholder="Define the next step"
                emptyText="Define the next step"
                accent={ACCENT}
                onSave={(next) => updateGoal({ currentNextStep: next || undefined })}
                textStyle={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}
              />
            </div>

            <motion.button
              style={styles.primaryAction}
              whileTap={{ scale: 0.97 }}
              onClick={handleStartSession}
            >
              {isDraft ? (
                <>
                  <Zap size={18} />
                  <span>Activate — Start 20 min session</span>
                </>
              ) : (
                <>
                  <Play size={18} />
                  <span>Start Session</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Reminder */}
          <div style={styles.reminderRow}>
            <Pin size={14} color="var(--text-secondary)" />
            <div style={{ flex: 1 }}>
              <InlineEdit
                value={goal.reminder ?? ''}
                placeholder="Add a reminder for next time"
                emptyText="Add a reminder for next time"
                accent={ACCENT}
                onSave={(next) => updateGoal({ reminder: next || undefined })}
                textStyle={{
                  fontSize: 14,
                  color: goal.reminder ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontStyle: goal.reminder ? 'italic' : 'normal',
                }}
              />
            </div>
          </div>
        </div>

        <div style={isMobile ? undefined : styles.rightColumn}>
          {/* Sessions */}
          <CollapsibleSection
            title="Sessions"
            count={sessions.length}
            defaultOpen={!isMobile}
          >
            {sessions.length === 0 ? (
              <p style={styles.empty}>No sessions yet. Start your first one above.</p>
            ) : (
              <div style={styles.sessionsList}>
                {sessions.map((s) => (
                  <div key={s.id} style={styles.sessionCard}>
                    <div style={styles.sessionTopRow}>
                      <span style={styles.sessionDate}>{formatLongDate(s.startedAt)}</span>
                      <span style={styles.sessionDuration}>{s.durationMinutes} min</span>
                    </div>
                    <div style={styles.sessionMid}>
                      <StatusIcon status={s.progressRating} size="sm" />
                      {s.summary && <span style={styles.summary}>{s.summary}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Notes */}
          {goal.id != null && <NotesSection goalId={goal.id} accent={ACCENT} />}
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            style={styles.confirmOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              style={styles.confirmCard}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={styles.confirmTitle}>Delete this goal?</h3>
              <p style={styles.confirmBody}>
                It will be in trash for 3 days, then permanently deleted.
              </p>
              <div style={styles.confirmActions}>
                <button
                  style={styles.confirmCancelBtn}
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button
                  style={styles.confirmDeleteBtn}
                  onClick={handleConfirmDelete}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: Goal['status'] }) {
  const config: Record<string, { label: string; color: string; bg: string; glow?: string }> = {
    draft: { label: 'Draft', color: 'var(--text-secondary)', bg: 'rgba(136,136,136,0.15)' },
    active: { label: 'Active', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
    focused: {
      label: 'Focused',
      color: '#34D399',
      bg: 'rgba(52,211,153,0.2)',
      glow: '0 0 0 1px rgba(52,211,153,0.4) inset',
    },
    completed: { label: 'Completed', color: 'var(--text-secondary)', bg: 'rgba(136,136,136,0.15)' },
    archived: { label: 'Archived', color: 'var(--text-secondary)', bg: 'rgba(136,136,136,0.15)' },
    deleted: { label: 'Deleted', color: 'var(--text-secondary)', bg: 'rgba(136,136,136,0.15)' },
  };
  const s = config[status];
  return (
    <span
      style={{
        ...styles.statusBadge,
        color: s.color,
        background: s.bg,
        boxShadow: s.glow,
      }}
    >
      {s.label}
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
  wrap: {
    flex: 1,
    width: '100%',
    overflow: 'auto',
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
  singleColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  twoColumn: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: 32,
    alignItems: 'start',
    paddingTop: 8,
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 4,
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
    alignItems: 'center',
  },
  statusBadge: {
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
  whyBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  smallLabel: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  nextStepCard: {
    background: 'var(--bg-card)',
    borderRadius: 14,
    padding: '16px 18px',
    borderLeft: '3px solid var(--active-green)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  nextStepTextWrap: {
    minHeight: 24,
  },
  primaryAction: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    background: 'var(--active-green)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    padding: '8px 0',
  },
  sessionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sessionCard: {
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  sessionTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDate: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  sessionDuration: {
    fontSize: 13,
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  sessionMid: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  summary: {
    fontSize: 14,
    color: 'var(--text-primary)',
    lineHeight: 1.4,
  },
  confirmOverlay: {
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
    background: 'var(--bg-card)',
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
  confirmDeleteBtn: {
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

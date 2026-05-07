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
  Plus,
  X,
  ListPlus,
  Archive as ArchiveIcon,
} from 'lucide-react';
import { db } from '../../db/database';
import {
  usePassiveSubFocuses,
  usePassiveCheckIns,
  setWeeklyFocus,
  removeWeeklyFocus,
} from '../../hooks/useGoals';
import useIsMobile from '../../hooks/useIsMobile';
import InlineEdit from './InlineEdit';
import OverflowMenu from './OverflowMenu';
import CollapsibleSection from './CollapsibleSection';
import NotesSection from './NotesSection';
import CheckInFlow from '../passive/CheckInFlow';
import { formatLongDate, todayISO } from '../../utils/dateHelpers';
import type { Goal, PassiveSubFocus } from '../../types';

interface Props {
  goal: Goal;
}

const ACCENT = 'var(--passive-blue)';

type CheckResult = 'good' | 'okay' | 'missed';

export default function GoalDetailPassive({ goal }: Props) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const subFocuses = usePassiveSubFocuses(goal.id);
  const checkIns = usePassiveCheckIns(goal.id);

  const today = todayISO();
  const todayId =
    goal.chosenSubFocusDate === today && goal.chosenSubFocusId != null
      ? goal.chosenSubFocusId
      : null;

  const [editingTitle, setEditingTitle] = useState(false);
  const [editSubFocuses, setEditSubFocuses] = useState(false);
  const [pendingTodayId, setPendingTodayId] = useState<number | null>(null);
  const [checkInForId, setCheckInForId] = useState<number | null>(null);
  const [recentlySaved, setRecentlySaved] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateGoal = async (patch: Partial<Goal>) => {
    if (!goal.id) return;
    await db.goals.update(goal.id, { ...patch, updatedAt: new Date().toISOString() });
  };

  const handleSubFocusTap = (sf: PassiveSubFocus) => {
    if (sf.id == null) return;
    if (todayId === sf.id) {
      setCheckInForId(sf.id);
    } else {
      setPendingTodayId(sf.id);
    }
  };

  const confirmSetToday = async () => {
    if (pendingTodayId == null || goal.id == null) return;
    await updateGoal({
      chosenSubFocusId: pendingTodayId,
      chosenSubFocusDate: today,
    });
    setPendingTodayId(null);
  };

  const handleCheckInSaved = (subFocusId: number) => {
    setRecentlySaved(subFocusId);
    setTimeout(() => setRecentlySaved(null), 2000);
  };

  const menuItems = [
    {
      label: 'Edit Goal',
      icon: <Edit3 size={16} />,
      onClick: () => setEditingTitle(true),
    },
    {
      label: 'Edit Sub-focuses',
      icon: <ListPlus size={16} />,
      onClick: () => setEditSubFocuses(true),
    },
    {
      label: goal.isWeeklyFocus ? 'Remove from Weekly Focus' : 'Set as Weekly Focus',
      icon: <Star size={16} />,
      onClick: () => (goal.isWeeklyFocus ? removeWeeklyFocus(goal) : setWeeklyFocus(goal)),
    },
    {
      label: 'Retire',
      icon: <ArchiveIcon size={16} />,
      onClick: () =>
        updateGoal({ status: 'archived', isWeeklyFocus: false }).then(() => navigate('/goals')),
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

  const subFocusLabelById = (id: number) =>
    subFocuses.find((s) => s.id === id)?.label ?? '(removed)';

  return (
    <div style={{ ...styles.wrap, padding: isMobile ? '0 16px 100px' : '0 32px 60px' }}>
      <header style={styles.header}>
        <motion.button
          style={styles.iconBtn}
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/goals', { state: { tab: 'passive' } })}
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </motion.button>
        <OverflowMenu items={menuItems} />
      </header>

      <div style={isMobile ? styles.singleColumn : styles.twoColumn}>
        <div style={isMobile ? undefined : styles.leftColumn}>
          <div style={styles.titleSection}>
            {editingTitle ? (
              <InlineEdit
                value={goal.title}
                accent={ACCENT}
                onSave={async (next) => {
                  if (next) await updateGoal({ title: next });
                  setEditingTitle(false);
                }}
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
              <PassiveStatusBadge status={goal.status} />
              {goal.category && <Tag>{goal.category}</Tag>}
            </div>
          </div>

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

          {/* Sub-focuses */}
          <section>
            <h3 style={styles.sectionTitle}>Sub-focuses</h3>
            <div style={styles.subFocusList}>
              {subFocuses.map((sf) => (
                <SubFocusPill
                  key={sf.id}
                  subFocus={sf}
                  isToday={todayId === sf.id}
                  isSaved={recentlySaved === sf.id}
                  onTap={() => handleSubFocusTap(sf)}
                />
              ))}
              {subFocuses.length === 0 && (
                <p style={styles.empty}>No sub-focuses defined yet.</p>
              )}
            </div>
          </section>

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
          <CollapsibleSection
            title="Check-ins"
            count={checkIns.length}
            defaultOpen={!isMobile}
          >
            {checkIns.length === 0 ? (
              <p style={styles.empty}>No check-ins yet.</p>
            ) : (
              <div style={styles.checkInsList}>
                {checkIns.map((c) => (
                  <div key={c.id} style={styles.checkInCard}>
                    <div style={styles.checkInTopRow}>
                      <span style={styles.checkInDate}>{formatLongDate(c.date)}</span>
                      <ResultPill result={c.result} />
                    </div>
                    <div style={styles.checkInLabel}>
                      {subFocusLabelById(c.subFocusId)}
                    </div>
                    {c.note && <div style={styles.checkInNote}>{c.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {goal.id != null && <NotesSection goalId={goal.id} accent={ACCENT} />}
        </div>
      </div>

      {/* Set today's focus confirmation */}
      <AnimatePresence>
        {pendingTodayId != null && (
          <Modal onClose={() => setPendingTodayId(null)}>
            <h3 style={styles.modalTitle}>Set as today's focus?</h3>
            <p style={styles.modalBody}>
              {subFocuses.find((s) => s.id === pendingTodayId)?.label}
            </p>
            <div style={styles.confirmActions}>
              <button
                style={styles.confirmCancelBtn}
                onClick={() => setPendingTodayId(null)}
              >
                Cancel
              </button>
              <motion.button
                style={{ ...styles.confirmPrimaryBtn, background: ACCENT }}
                whileTap={{ scale: 0.96 }}
                onClick={confirmSetToday}
              >
                Set as today's focus
              </motion.button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Daily check-in flow */}
      <AnimatePresence>
        {checkInForId != null && goal.id != null && (
          <CheckInFlow
            goalId={goal.id}
            subFocusId={checkInForId}
            subFocusLabel={subFocusLabelById(checkInForId)}
            onClose={() => setCheckInForId(null)}
            onSaved={() => handleCheckInSaved(checkInForId)}
          />
        )}
      </AnimatePresence>

      {/* Edit sub-focuses */}
      <AnimatePresence>
        {editSubFocuses && goal.id != null && (
          <Modal onClose={() => setEditSubFocuses(false)} large>
            <SubFocusEditor
              goalId={goal.id}
              existing={subFocuses}
              onClose={() => setEditSubFocuses(false)}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <Modal onClose={() => setConfirmDelete(false)}>
            <h3 style={styles.modalTitle}>Delete this goal?</h3>
            <p style={styles.modalBody}>
              It will be in trash for 3 days, then permanently deleted.
            </p>
            <div style={styles.confirmActions}>
              <button
                style={styles.confirmCancelBtn}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
              <button style={styles.confirmDeleteBtn} onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubFocusPill({
  subFocus,
  isToday,
  isSaved,
  onTap,
}: {
  subFocus: PassiveSubFocus;
  isToday: boolean;
  isSaved: boolean;
  onTap: () => void;
}) {
  return (
    <motion.button
      style={{
        ...styles.subFocusPill,
        background: isToday ? 'rgba(96,165,250,0.15)' : 'var(--bg-card)',
        border: isToday ? '1px solid var(--passive-blue)' : '1px solid transparent',
      }}
      whileTap={{ scale: 0.97 }}
      onClick={onTap}
    >
      <span style={styles.subFocusLabel}>{subFocus.label}</span>
      <span style={styles.subFocusBadges}>
        {isToday && <span style={styles.todayBadge}>Today</span>}
        {isSaved && <Check size={14} color="var(--passive-blue)" />}
      </span>
    </motion.button>
  );
}

function SubFocusEditor({
  goalId,
  existing,
  onClose,
}: {
  goalId: number;
  existing: PassiveSubFocus[];
  onClose: () => void;
}) {
  const [items, setItems] = useState<{ id?: number; label: string }[]>(
    existing.map((s) => ({ id: s.id, label: s.label }))
  );

  const handleAdd = () => {
    if (items.length < 7) setItems([...items, { label: '' }]);
  };

  const handleRemove = (i: number) => {
    setItems(items.filter((_, idx) => idx !== i));
  };

  const handleChange = (i: number, label: string) => {
    const next = [...items];
    next[i] = { ...next[i], label };
    setItems(next);
  };

  const handleSave = async () => {
    const now = new Date().toISOString();
    const valid = items.filter((it) => it.label.trim());
    const validIds = new Set(valid.filter((v) => v.id != null).map((v) => v.id!));

    // Delete sub-focuses no longer present
    for (const e of existing) {
      if (e.id != null && !validIds.has(e.id)) {
        await db.passiveSubFocuses.delete(e.id);
      }
    }
    // Update or add
    for (const it of valid) {
      if (it.id != null) {
        await db.passiveSubFocuses.update(it.id, { label: it.label.trim() });
      } else {
        await db.passiveSubFocuses.add({
          goalId,
          label: it.label.trim(),
          createdAt: now,
        });
      }
    }
    onClose();
  };

  return (
    <>
      <h3 style={styles.modalTitle}>Edit Sub-focuses</h3>
      <div style={styles.editList}>
        {items.map((it, i) => (
          <div key={i} style={styles.editRow}>
            <input
              style={styles.editInput}
              value={it.label}
              onChange={(e) => handleChange(i, e.target.value)}
              placeholder={`Sub-focus ${i + 1}`}
            />
            <motion.button
              style={styles.editRemove}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleRemove(i)}
            >
              <X size={18} color="var(--text-secondary)" />
            </motion.button>
          </div>
        ))}
      </div>
      {items.length < 7 && (
        <motion.button
          style={styles.addAnother}
          whileTap={{ scale: 0.97 }}
          onClick={handleAdd}
        >
          <Plus size={16} color="var(--passive-blue)" />
          <span>Add another</span>
        </motion.button>
      )}
      <div style={styles.confirmActions}>
        <button style={styles.confirmCancelBtn} onClick={onClose}>
          Cancel
        </button>
        <motion.button
          style={{ ...styles.confirmPrimaryBtn, background: 'var(--passive-blue)' }}
          whileTap={{ scale: 0.96 }}
          onClick={handleSave}
        >
          Save
        </motion.button>
      </div>
    </>
  );
}

function Modal({
  children,
  onClose,
  large = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  large?: boolean;
}) {
  return (
    <motion.div
      style={styles.modalOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={{ ...styles.modalCard, maxWidth: large ? 480 : 400 }}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function PassiveStatusBadge({ status }: { status: Goal['status'] }) {
  const labels: Record<string, string> = {
    active: 'Active',
    focused: 'Focused',
    draft: 'Draft',
    completed: 'Completed',
    archived: 'Archived',
    deleted: 'Deleted',
  };
  const isAccent = status === 'active' || status === 'focused';
  const color = isAccent ? '#60A5FA' : 'var(--text-secondary)';
  const bg = isAccent ? 'rgba(96,165,250,0.15)' : 'rgba(136,136,136,0.15)';
  const glow = status === 'focused' ? '0 0 0 1px rgba(96,165,250,0.4) inset' : undefined;
  return (
    <span style={{ ...styles.statusBadge, color, background: bg, boxShadow: glow }}>
      {labels[status]}
    </span>
  );
}

function ResultPill({ result }: { result: CheckResult }) {
  const config: Record<CheckResult, { label: string; color: string; bg: string }> = {
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
    gap: 16,
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
    gap: 10,
    paddingTop: 8,
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
  smallLabel: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  whyBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 12,
  },
  subFocusList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  subFocusPill: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderRadius: 12,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background 0.2s, border 0.2s',
  },
  subFocusLabel: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  subFocusBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  todayBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--passive-blue)',
    background: 'rgba(96,165,250,0.2)',
    padding: '3px 8px',
    borderRadius: 999,
    letterSpacing: 0.4,
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
  checkInsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  checkInCard: {
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  checkInTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkInDate: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  checkInLabel: {
    fontSize: 14,
    color: 'var(--text-primary)',
    fontWeight: 500,
  },
  checkInNote: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
    marginTop: 2,
  },
  resultBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: 999,
  },
  modalOverlay: {
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
  modalCard: {
    background: 'var(--bg-elevated)',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  modalBody: {
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
  resultRow: {
    display: 'flex',
    gap: 8,
    marginTop: 4,
  },
  resultPill: {
    flex: 1,
    padding: '12px 0',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  noteInput: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
  },
  editList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  editRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    flex: 1,
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
  },
  editRemove: {
    background: 'none',
    border: 'none',
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
  },
  addAnother: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    padding: '8px 0',
    color: 'var(--passive-blue)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    alignSelf: 'flex-start',
  },
};

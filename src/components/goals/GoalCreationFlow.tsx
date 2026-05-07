import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target, Eye, Plus, X } from 'lucide-react';
import { db } from '../../db/database';
import useIsMobile from '../../hooks/useIsMobile';
import type { InboxItem } from '../../types';

type GoalType = 'active' | 'passive' | null;

interface LocationState {
  fromInbox?: InboxItem;
  presetType?: 'active' | 'passive';
}

export default function GoalCreationFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const state = (location.state as LocationState) || {};
  const fromInbox = state.fromInbox;
  const presetType = state.presetType;

  const [step, setStep] = useState<'type' | 'form'>(presetType ? 'form' : 'type');
  const [goalType, setGoalType] = useState<GoalType>(presetType || null);

  // Active goal fields
  const [title, setTitle] = useState(fromInbox?.title || '');
  const [description, setDescription] = useState(fromInbox?.description || '');
  const [category, setCategory] = useState('');
  const [timeHorizon, setTimeHorizon] = useState<'short' | 'mid' | 'long'>('short');
  const [whyItMatters, setWhyItMatters] = useState('');
  const [firstNextStep, setFirstNextStep] = useState('');

  // Passive goal fields
  const [subFocuses, setSubFocuses] = useState<string[]>(['']);

  const handleTypeSelect = (type: 'active' | 'passive') => {
    setGoalType(type);
    setStep('form');
  };

  const handleAddSubFocus = () => {
    if (subFocuses.length < 5) {
      setSubFocuses([...subFocuses, '']);
    }
  };

  const handleRemoveSubFocus = (index: number) => {
    if (subFocuses.length > 1) {
      setSubFocuses(subFocuses.filter((_, i) => i !== index));
    }
  };

  const handleSubFocusChange = (index: number, value: string) => {
    const updated = [...subFocuses];
    updated[index] = value;
    setSubFocuses(updated);
  };

  const canSave = () => {
    if (!title.trim()) return false;
    if (goalType === 'active' && !firstNextStep.trim()) return false;
    if (goalType === 'passive' && !subFocuses.some((s) => s.trim())) return false;
    return true;
  };

  const handleSave = async () => {
    if (!canSave() || !goalType) return;

    const now = new Date().toISOString();

    const goalId = await db.goals.add({
      type: goalType,
      title: title.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined,
      timeHorizon: goalType === 'active' ? timeHorizon : undefined,
      whyItMatters: whyItMatters.trim() || undefined,
      currentNextStep: goalType === 'active' ? firstNextStep.trim() : undefined,
      status: goalType === 'active' ? 'draft' : 'active',
      isWeeklyFocus: false,
      createdAt: now,
      updatedAt: now,
    });

    // Save sub-focuses for passive goals
    if (goalType === 'passive') {
      const validSubFocuses = subFocuses.filter((s) => s.trim());
      for (const label of validSubFocuses) {
        await db.passiveSubFocuses.add({
          goalId: goalId as number,
          label: label.trim(),
          createdAt: now,
        });
      }
    }

    // Mark inbox item as deleted if it came from inbox
    if (fromInbox?.id) {
      await db.inboxItems.update(fromInbox.id, {
        status: 'deleted',
        deletedAt: now,
      });
    }

    navigate('/goals');
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  const desktopCenter: React.CSSProperties = !isMobile ? {
    maxWidth: 550,
    margin: '0 auto',
    width: '100%',
    paddingTop: 24,
  } : {};

  return (
    <div style={{
      ...styles.wrapper,
      padding: isMobile ? '0 16px' : '0 32px',
    }}>
      <div style={desktopCenter}>
        <header style={styles.header}>
          <motion.button
            style={styles.backButton}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (step === 'form' && !presetType) {
                setStep('type');
              } else {
                navigate(-1);
              }
            }}
          >
            <ArrowLeft size={22} />
          </motion.button>
          <h1 style={{
            ...styles.headerTitle,
            fontSize: isMobile ? 18 : 22,
          }}>
            {step === 'type' ? 'New Goal' : goalType === 'active' ? 'New Active Goal' : 'New Passive Goal'}
          </h1>
          <div style={{ width: 38 }} />
        </header>

        <div style={{
          ...styles.content,
          paddingBottom: isMobile ? 40 : 60,
        }}>
          <AnimatePresence mode="wait">
            {step === 'type' && (
              <motion.div
                key="type"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                style={styles.typeSelection}
              >
                <p style={styles.typePrompt}>What kind of goal is this?</p>

                <motion.button
                  style={styles.typeCard}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleTypeSelect('active')}
                >
                  <div style={{ ...styles.typeIcon, background: 'rgba(52, 211, 153, 0.15)' }}>
                    <Target size={24} color="#34D399" />
                  </div>
                  <div>
                    <div style={styles.typeCardTitle}>Active Goal</div>
                    <div style={styles.typeCardDesc}>
                      A tangible project or outcome you work on in timed sessions
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  style={styles.typeCard}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleTypeSelect('passive')}
                >
                  <div style={{ ...styles.typeIcon, background: 'rgba(96, 165, 250, 0.15)' }}>
                    <Eye size={24} color="#60A5FA" />
                  </div>
                  <div>
                    <div style={styles.typeCardTitle}>Passive Goal</div>
                    <div style={styles.typeCardDesc}>
                      A behavioral habit tracked through daily sub-focus check-ins
                    </div>
                  </div>
                </motion.button>
              </motion.div>
            )}

            {step === 'form' && goalType === 'active' && (
              <motion.div
                key="active-form"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                style={styles.form}
              >
                <label style={styles.label}>Title *</label>
                <input
                  style={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What do you want to accomplish?"
                  autoFocus
                />

                <label style={styles.label}>Description</label>
                <textarea
                  style={{ ...styles.input, minHeight: 72, resize: 'vertical' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A bit more context (optional)"
                />

                <label style={styles.label}>Category</label>
                <input
                  style={styles.input}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Career, Health, Creative"
                />

                <label style={styles.label}>Time Horizon</label>
                <div style={styles.horizonRow}>
                  {(['short', 'mid', 'long'] as const).map((h) => (
                    <motion.button
                      key={h}
                      style={{
                        ...styles.horizonChip,
                        background: timeHorizon === h ? 'var(--active-green)' : 'var(--bg-primary)',
                        color: timeHorizon === h ? '#fff' : 'var(--text-secondary)',
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTimeHorizon(h)}
                    >
                      {h === 'short' ? 'Short-term' : h === 'mid' ? 'Mid-term' : 'Long-term'}
                    </motion.button>
                  ))}
                </div>

                <label style={styles.label}>Why This Matters</label>
                <input
                  style={styles.input}
                  value={whyItMatters}
                  onChange={(e) => setWhyItMatters(e.target.value)}
                  placeholder="Your motivation for this goal"
                />

                <label style={styles.label}>First Next Step *</label>
                <input
                  style={styles.input}
                  value={firstNextStep}
                  onChange={(e) => setFirstNextStep(e.target.value)}
                  placeholder="The very first concrete action"
                />

                <motion.button
                  style={{
                    ...styles.saveButton,
                    background: 'var(--active-green)',
                    opacity: canSave() ? 1 : 0.4,
                  }}
                  whileTap={canSave() ? { scale: 0.97 } : undefined}
                  disabled={!canSave()}
                  onClick={handleSave}
                >
                  Create Goal
                </motion.button>
              </motion.div>
            )}

            {step === 'form' && goalType === 'passive' && (
              <motion.div
                key="passive-form"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                style={styles.form}
              >
                <label style={styles.label}>Title *</label>
                <input
                  style={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What behavior do you want to build?"
                  autoFocus
                />

                <label style={styles.label}>Description</label>
                <textarea
                  style={{ ...styles.input, minHeight: 72, resize: 'vertical' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A bit more context (optional)"
                />

                <label style={styles.label}>Category</label>
                <input
                  style={styles.input}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Mindfulness, Fitness, Communication"
                />

                <label style={styles.label}>Why This Matters</label>
                <input
                  style={styles.input}
                  value={whyItMatters}
                  onChange={(e) => setWhyItMatters(e.target.value)}
                  placeholder="Your motivation for this goal"
                />

                <label style={styles.label}>Sub-focus Behaviors * (3–5 recommended)</label>
                {subFocuses.map((sf, i) => (
                  <div key={i} style={styles.subFocusRow}>
                    <input
                      style={{ ...styles.input, flex: 1, marginBottom: 0 }}
                      value={sf}
                      onChange={(e) => handleSubFocusChange(i, e.target.value)}
                      placeholder={`Sub-focus ${i + 1}`}
                    />
                    {subFocuses.length > 1 && (
                      <motion.button
                        style={styles.removeSubFocus}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleRemoveSubFocus(i)}
                      >
                        <X size={18} color="var(--text-secondary)" />
                      </motion.button>
                    )}
                  </div>
                ))}
                {subFocuses.length < 5 && (
                  <motion.button
                    style={styles.addSubFocus}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddSubFocus}
                  >
                    <Plus size={16} color="var(--passive-blue)" />
                    <span>Add sub-focus</span>
                  </motion.button>
                )}

                <motion.button
                  style={{
                    ...styles.saveButton,
                    background: 'var(--passive-blue)',
                    opacity: canSave() ? 1 : 0.4,
                  }}
                  whileTap={canSave() ? { scale: 0.97 } : undefined}
                  disabled={!canSave()}
                  onClick={handleSave}
                >
                  Create Goal
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 'env(safe-area-inset-top, 16px)',
    paddingBottom: 12,
    minHeight: 56,
  },
  backButton: {
    background: 'none',
    border: 'none',
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 600,
  },
  content: {
    flex: 1,
  },
  typeSelection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    paddingTop: 24,
  },
  typePrompt: {
    fontSize: 17,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    marginBottom: 8,
  },
  typeCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    background: 'var(--bg-card)',
    borderRadius: 14,
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  typeCardTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
  },
  typeCardDesc: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    paddingTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-primary)',
    fontSize: 16,
    outline: 'none',
  },
  horizonRow: {
    display: 'flex',
    gap: 8,
  },
  horizonChip: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid var(--border-subtle)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  subFocusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  removeSubFocus: {
    background: 'none',
    border: 'none',
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  addSubFocus: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    padding: '8px 0',
    color: 'var(--passive-blue)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  saveButton: {
    width: '100%',
    padding: '16px 0',
    borderRadius: 14,
    color: '#fff',
    fontSize: 17,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    marginTop: 24,
  },
};

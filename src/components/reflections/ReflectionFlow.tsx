import { useEffect, useState, type CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { db } from '../../db/database';
import StatusIcon from '../shared/StatusIcon';

interface SessionData {
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
}

interface LocationState {
  goalId?: number;
  sessionData?: SessionData;
  isActivationSession?: boolean;
}

type ProgressRating = 'yes' | 'some' | 'no';

const VIOLET = '#7C5CFC';

const TOTAL_STEPS = 5;
const ACTIVATION_MIN_MINUTES = 10;

export default function ReflectionFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as LocationState) || {};

  // Redirect if we don't have session data
  useEffect(() => {
    if (state.goalId == null || state.sessionData == null) {
      navigate('/', { replace: true });
    }
  }, [state.goalId, state.sessionData, navigate]);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [progress, setProgress] = useState<ProgressRating | null>(null);
  const [summary, setSummary] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [reminder, setReminder] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (state.goalId == null || state.sessionData == null) {
    return null;
  }

  const goalId = state.goalId;
  const sessionData = state.sessionData;
  const isActivation = !!state.isActivationSession;

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep(step + 1);
    } else {
      finalize();
    }
  };

  const goBack = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const finalize = async () => {
    if (saving) return;
    setSaving(true);
    const now = new Date().toISOString();

    await db.goalSessions.add({
      goalId,
      startedAt: sessionData.startedAt,
      endedAt: sessionData.endedAt,
      durationMinutes: sessionData.durationMinutes,
      isActivationSession: isActivation,
      progressRating: progress ?? 'some',
      summary: summary.trim() || undefined,
      nextStep: nextStep.trim() || undefined,
      reminderForNextTime: reminder.trim() || undefined,
      noteAdded: note.trim() || undefined,
    });

    const goal = await db.goals.get(goalId);
    const goalUpdate: Record<string, unknown> = {
      lastWorkedAt: sessionData.endedAt,
      updatedAt: now,
    };
    if (nextStep.trim()) goalUpdate.currentNextStep = nextStep.trim();
    if (reminder.trim()) goalUpdate.reminder = reminder.trim();

    // Activation: promote draft → active if completed enough
    if (
      isActivation &&
      goal?.status === 'draft' &&
      sessionData.durationMinutes >= ACTIVATION_MIN_MINUTES
    ) {
      goalUpdate.status = 'active';
    }
    await db.goals.update(goalId, goalUpdate);

    if (note.trim()) {
      await db.goalNotes.add({
        goalId,
        content: note.trim(),
        createdAt: now,
        updatedAt: now,
      });
    }

    navigate('/', { state: { toast: 'Session logged ✓' }, replace: true });
  };

  const handleProgressSelect = (r: ProgressRating) => {
    setProgress(r);
    setTimeout(() => {
      setDirection(1);
      setStep(2);
    }, 220);
  };

  return (
    <div style={styles.background}>
      <header style={styles.header}>
        <motion.button
          style={{ ...styles.backBtn, opacity: step === 1 ? 0.3 : 1 }}
          whileTap={step > 1 ? { scale: 0.92 } : undefined}
          onClick={goBack}
          disabled={step === 1}
          aria-label="Back"
        >
          <ArrowLeft size={22} color="var(--text-primary)" />
        </motion.button>

        <ProgressDots current={step} total={TOTAL_STEPS} />

        <div style={{ width: 38 }} />
      </header>

      <div style={styles.body}>
        <div style={styles.contentWrap}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={styles.stepContent}
            >
              {step === 1 && (
                <Step1
                  selected={progress}
                  onSelect={handleProgressSelect}
                />
              )}
              {step === 2 && (
                <Step2
                  value={summary}
                  onChange={setSummary}
                  onNext={goNext}
                />
              )}
              {step === 3 && (
                <Step3
                  value={nextStep}
                  onChange={setNextStep}
                  onNext={goNext}
                />
              )}
              {step === 4 && (
                <Step4
                  value={reminder}
                  onChange={setReminder}
                  onSkip={goNext}
                  onSave={goNext}
                />
              )}
              {step === 5 && (
                <Step5
                  value={note}
                  onChange={setNote}
                  onSkip={finalize}
                  onSave={finalize}
                  saving={saving}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => {
        const idx = i + 1;
        const isCurrent = idx === current;
        const isPast = idx < current;
        return (
          <span
            key={i}
            style={{
              ...styles.dot,
              background: isPast || isCurrent ? '#34D399' : 'rgba(255,255,255,0.15)',
              transform: isCurrent ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        );
      })}
    </div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: -dir * 50, opacity: 0 }),
};

function Step1({
  selected,
  onSelect,
}: {
  selected: ProgressRating | null;
  onSelect: (r: ProgressRating) => void;
}) {
  const options: { value: ProgressRating; label: string; color: string }[] = [
    { value: 'yes', label: 'Yes', color: '#34D399' },
    { value: 'some', label: 'Some', color: '#FBBF24' },
    { value: 'no', label: 'No', color: '#F87171' },
  ];
  return (
    <>
      <h2 style={styles.question}>Did you make progress?</h2>
      <div style={styles.progressOptions}>
        {options.map((opt) => (
          <motion.button
            key={opt.value}
            style={{
              ...styles.progressPill,
              borderColor:
                selected === opt.value ? opt.color : 'var(--border-subtle)',
              background:
                selected === opt.value ? `${opt.color}1F` : 'var(--bg-card)',
            }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -2 }}
            onClick={() => onSelect(opt.value)}
          >
            <StatusIcon status={opt.value} size="lg" />
            <span style={styles.progressLabel}>{opt.label}</span>
          </motion.button>
        ))}
      </div>
    </>
  );
}

function Step2({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <>
      <h2 style={styles.question}>What happened?</h2>
      <input
        style={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="One sentence summary..."
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') onNext();
        }}
      />
      <NextButton onClick={onNext} disabled={!value.trim()} />
    </>
  );
}

function Step3({
  value,
  onChange,
  onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <>
      <h2 style={styles.question}>What's the next step?</h2>
      <input
        style={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="The next concrete action..."
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') onNext();
        }}
      />
      <NextButton onClick={onNext} disabled={!value.trim()} />
    </>
  );
}

function Step4({
  value,
  onChange,
  onSkip,
  onSave,
}: {
  value: string;
  onChange: (v: string) => void;
  onSkip: () => void;
  onSave: () => void;
}) {
  return (
    <>
      <h2 style={styles.question}>Reminder for next time?</h2>
      <input
        style={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Start with the outline first..."
        autoFocus
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSave();
        }}
      />
      <SkipSaveRow onSkip={onSkip} onSave={onSave} hasValue={!!value.trim()} />
    </>
  );
}

function Step5({
  value,
  onChange,
  onSkip,
  onSave,
  saving,
}: {
  value: string;
  onChange: (v: string) => void;
  onSkip: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <>
      <h2 style={styles.question}>Save a note to this goal?</h2>
      <textarea
        style={{ ...styles.input, minHeight: 120, resize: 'vertical' }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Anything you want to remember..."
        autoFocus
      />
      <SkipSaveRow
        onSkip={onSkip}
        onSave={onSave}
        hasValue={!!value.trim()}
        saving={saving}
        finalLabel="Finish"
      />
    </>
  );
}

function NextButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button
      style={{
        ...styles.primaryBtn,
        opacity: disabled ? 0.4 : 1,
      }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
    >
      Next
    </motion.button>
  );
}

function SkipSaveRow({
  onSkip,
  onSave,
  hasValue,
  saving,
  finalLabel,
}: {
  onSkip: () => void;
  onSave: () => void;
  hasValue: boolean;
  saving?: boolean;
  finalLabel?: string;
}) {
  return (
    <div style={styles.skipSaveRow}>
      <button style={styles.skipBtn} onClick={onSkip} disabled={saving}>
        Skip
      </button>
      <motion.button
        style={{
          ...styles.primaryBtn,
          opacity: hasValue && !saving ? 1 : 0.5,
          flex: 1,
        }}
        whileTap={hasValue && !saving ? { scale: 0.97 } : undefined}
        onClick={onSave}
        disabled={!hasValue || saving}
      >
        {finalLabel ?? 'Save'}
      </motion.button>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  background: {
    width: '100%',
    minHeight: '100dvh',
    background: `radial-gradient(circle at 50% 30%, rgba(124, 92, 252, 0.10) 0%, rgba(96, 165, 250, 0.04) 30%, var(--bg-primary) 70%)`,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    paddingTop: 'max(env(safe-area-inset-top, 16px), 16px)',
    minHeight: 56,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    borderRadius: 8,
  },
  dotsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    transition: 'background 0.2s, transform 0.2s',
  },
  body: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px 20px 60px',
    overflow: 'hidden',
  },
  contentWrap: {
    width: '100%',
    maxWidth: 480,
    position: 'relative',
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    paddingTop: 32,
  },
  question: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center',
    lineHeight: 1.3,
  },
  progressOptions: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  progressPill: {
    flex: 1,
    minWidth: 92,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '24px 12px',
    borderRadius: 16,
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'border 0.2s, background 0.2s',
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    fontSize: 16,
    outline: 'none',
    fontFamily: 'inherit',
  },
  primaryBtn: {
    width: '100%',
    padding: '14px 24px',
    borderRadius: 14,
    background: `linear-gradient(135deg, ${VIOLET} 0%, #5B7FFC 100%)`,
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(124,92,252,0.3)',
  },
  skipSaveRow: {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
  },
  skipBtn: {
    padding: '14px 22px',
    borderRadius: 14,
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontSize: 15,
    fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.12)',
    cursor: 'pointer',
  },
};

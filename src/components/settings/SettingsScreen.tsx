import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  Archive as ArchiveIcon,
  Trash2,
  Minus,
  Plus,
} from 'lucide-react';
import PageWrapper from '../layout/PageWrapper';
import { useSettings, updateSettings } from '../../hooks/useSettings';
import {
  exportData,
  importData,
  type ImportMode,
} from '../../hooks/useExportImport';
import { clearAllData } from '../../utils/trashCleanup';
import { useToast } from '../ui/Toast';
import type { ThemeMode } from '../../hooks/useTheme';

const APP_VERSION = '1.1';

export default function SettingsScreen() {
  const settings = useSettings();
  const navigate = useNavigate();
  const { show } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingImport, setPendingImport] = useState<File | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmClearData, setConfirmClearData] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleThemeChange = async (theme: ThemeMode) => {
    await updateSettings({ theme });
  };

  const handleSessionLengthChange = async (delta: number) => {
    const next = Math.max(5, Math.min(60, settings.defaultSessionMinutes + delta));
    if (next !== settings.defaultSessionMinutes) {
      await updateSettings({ defaultSessionMinutes: next });
    }
  };

  const handleSoundToggle = async () => {
    await updateSettings({ timerSoundEnabled: !settings.timerSoundEnabled });
  };

  const handleExport = async () => {
    try {
      await exportData();
      show('Backup exported', 'success');
    } catch {
      show('Export failed', 'error');
    }
  };

  const handlePickImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingImport(file);
    e.target.value = '';
  };

  const runImport = async (mode: ImportMode) => {
    if (!pendingImport) return;
    setBusy(true);
    const result = await importData(pendingImport, mode);
    setBusy(false);
    setPendingImport(null);
    setConfirmReplace(false);
    if (result.ok) {
      show(`Imported ${mode === 'merge' ? '(merged)' : '(replaced)'}`, 'success');
    } else {
      show(result.error, 'error');
    }
  };

  const handleClearAllData = async () => {
    setBusy(true);
    await clearAllData();
    setBusy(false);
    setConfirmClearData(false);
    show('All data cleared', 'success');
  };

  return (
    <PageWrapper title="Settings">
      <div style={styles.container}>
        {/* Appearance */}
        <SettingsSection title="Appearance">
          <Row label="Theme">
            <ThemePicker value={settings.theme} onChange={handleThemeChange} />
          </Row>
        </SettingsSection>

        {/* Focus Sessions */}
        <SettingsSection title="Focus Sessions">
          <Row label="Default session length" subtitle="Used as the starting time on Focus">
            <Stepper
              value={settings.defaultSessionMinutes}
              suffix="min"
              onDecrement={() => handleSessionLengthChange(-5)}
              onIncrement={() => handleSessionLengthChange(5)}
              decDisabled={settings.defaultSessionMinutes <= 5}
              incDisabled={settings.defaultSessionMinutes >= 60}
            />
          </Row>
          <Row label="Timer completion sound">
            <ToggleSwitch
              on={settings.timerSoundEnabled}
              onChange={handleSoundToggle}
            />
          </Row>
        </SettingsSection>

        {/* Data */}
        <SettingsSection title="Data">
          <ActionRow
            icon={<Download size={18} color="var(--text-primary)" />}
            label="Export Data"
            subtitle="Download a .startable backup file"
            onClick={handleExport}
          />
          <ActionRow
            icon={<Upload size={18} color="var(--text-primary)" />}
            label="Import Data"
            subtitle="Merge or replace from a .startable file"
            onClick={handlePickImport}
          />
          <ActionRow
            icon={<ArchiveIcon size={18} color="var(--text-primary)" />}
            label="View Archive & Trash"
            onClick={() => navigate('/archive')}
          />
          <ActionRow
            icon={<Trash2 size={18} color="#FF6B6B" />}
            label="Clear All Data"
            subtitle="Delete every goal, note, session, and task"
            danger
            onClick={() => setConfirmClearData(true)}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <div style={styles.aboutCard}>
            <div style={styles.aboutRow}>
              <span style={styles.aboutLabel}>Version</span>
              <span style={styles.aboutValue}>{APP_VERSION}</span>
            </div>
            <div style={styles.aboutRow}>
              <span style={styles.aboutLabel}>Built by</span>
              <span style={styles.aboutValue}>Revant</span>
            </div>
            <p style={styles.aboutTagline}>Local-first · No cloud · No tracking</p>
          </div>
        </SettingsSection>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".startable,.json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />

      <AnimatePresence>
        {pendingImport && !confirmReplace && (
          <Modal onClose={() => setPendingImport(null)}>
            <h3 style={styles.modalTitle}>Import data</h3>
            <p style={styles.modalBody}>
              Choose how to bring in <strong>{pendingImport.name}</strong>.
            </p>

            <motion.button
              style={{ ...styles.choiceOption, borderColor: 'var(--active-green)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => runImport('merge')}
              disabled={busy}
            >
              <div style={styles.choiceText}>
                <div style={styles.choiceLabel}>Merge</div>
                <div style={styles.choiceDesc}>
                  Add imported items alongside what's already here. Safe — keeps existing data.
                </div>
              </div>
            </motion.button>

            <motion.button
              style={{ ...styles.choiceOption, borderColor: '#FF6B6B' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setConfirmReplace(true)}
              disabled={busy}
            >
              <div style={styles.choiceText}>
                <div style={{ ...styles.choiceLabel, color: '#FF6B6B' }}>Replace All</div>
                <div style={styles.choiceDesc}>
                  Wipe current data and replace with the file. This cannot be undone.
                </div>
              </div>
            </motion.button>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmReplace && pendingImport && (
          <Modal onClose={() => setConfirmReplace(false)}>
            <h3 style={styles.modalTitle}>Replace all data?</h3>
            <p style={styles.modalBody}>
              Every existing goal, session, note, and task will be permanently deleted and
              replaced with the contents of <strong>{pendingImport.name}</strong>. This cannot
              be undone.
            </p>
            <div style={styles.confirmActions}>
              <button
                style={styles.confirmCancelBtn}
                onClick={() => setConfirmReplace(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                style={styles.confirmDangerBtn}
                onClick={() => runImport('replace')}
                disabled={busy}
              >
                Replace
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmClearData && (
          <Modal onClose={() => setConfirmClearData(false)}>
            <h3 style={styles.modalTitle}>Permanently delete ALL data?</h3>
            <p style={styles.modalBody}>
              This includes goals, sessions, notes, tasks, and reflections. Your settings
              (theme, defaults) will be preserved. This cannot be undone.
            </p>
            <div style={styles.confirmActions}>
              <button
                style={styles.confirmCancelBtn}
                onClick={() => setConfirmClearData(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                style={styles.confirmDangerBtn}
                onClick={handleClearAllData}
                disabled={busy}
              >
                Delete Everything
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionHeader}>{title}</h2>
      <div style={styles.sectionCard}>{children}</div>
    </section>
  );
}

function Row({
  label,
  subtitle,
  children,
}: {
  label: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.row}>
      <div style={styles.rowText}>
        <div style={styles.rowLabel}>{label}</div>
        {subtitle && <div style={styles.rowSubtitle}>{subtitle}</div>}
      </div>
      <div style={styles.rowControl}>{children}</div>
    </div>
  );
}

function ActionRow({
  icon,
  label,
  subtitle,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <motion.button
      style={styles.actionRow}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
    >
      <div style={styles.actionIcon}>{icon}</div>
      <div style={styles.actionText}>
        <div style={{ ...styles.actionLabel, color: danger ? '#FF6B6B' : 'var(--text-primary)' }}>
          {label}
        </div>
        {subtitle && <div style={styles.rowSubtitle}>{subtitle}</div>}
      </div>
    </motion.button>
  );
}

function ThemePicker({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (theme: ThemeMode) => void;
}) {
  const options: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'system', label: 'System', icon: <Monitor size={14} /> },
    { value: 'light', label: 'Light', icon: <Sun size={14} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
  ];
  return (
    <div style={styles.themeRow}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <motion.button
            key={o.value}
            style={{
              ...styles.themePill,
              background: active ? 'var(--active-green)' : 'var(--bg-card-hover)',
              color: active ? '#0A0A0A' : 'var(--text-primary)',
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(o.value)}
          >
            {o.icon}
            <span>{o.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

function Stepper({
  value,
  suffix,
  onDecrement,
  onIncrement,
  decDisabled,
  incDisabled,
}: {
  value: number;
  suffix?: string;
  onDecrement: () => void;
  onIncrement: () => void;
  decDisabled?: boolean;
  incDisabled?: boolean;
}) {
  return (
    <div style={styles.stepper}>
      <motion.button
        style={{
          ...styles.stepperBtn,
          opacity: decDisabled ? 0.4 : 1,
          cursor: decDisabled ? 'default' : 'pointer',
        }}
        whileTap={decDisabled ? undefined : { scale: 0.9 }}
        onClick={decDisabled ? undefined : onDecrement}
        disabled={decDisabled}
        aria-label="Decrease"
      >
        <Minus size={14} />
      </motion.button>
      <span style={styles.stepperValue}>
        {value}
        {suffix && <span style={styles.stepperSuffix}> {suffix}</span>}
      </span>
      <motion.button
        style={{
          ...styles.stepperBtn,
          opacity: incDisabled ? 0.4 : 1,
          cursor: incDisabled ? 'default' : 'pointer',
        }}
        whileTap={incDisabled ? undefined : { scale: 0.9 }}
        onClick={incDisabled ? undefined : onIncrement}
        disabled={incDisabled}
        aria-label="Increase"
      >
        <Plus size={14} />
      </motion.button>
    </div>
  );
}

function ToggleSwitch({
  on,
  onChange,
}: {
  on: boolean;
  onChange: () => void;
}) {
  return (
    <motion.button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      style={{
        ...styles.switch,
        background: on ? 'var(--active-green)' : 'var(--bg-card-hover)',
      }}
      whileTap={{ scale: 0.96 }}
    >
      <motion.div
        layout
        transition={{ type: 'spring', damping: 28, stiffness: 400 }}
        style={{
          ...styles.switchKnob,
          marginLeft: on ? 22 : 2,
        }}
      />
    </motion.button>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      style={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={styles.modalCard}
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

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
    paddingBottom: 120,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    padding: '0 4px',
  },
  sectionCard: {
    background: 'var(--bg-card)',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: 'var(--card-shadow)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '14px 18px',
    borderBottom: '1px solid var(--border-subtle)',
    minHeight: 56,
  },
  rowText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-primary)',
  },
  rowSubtitle: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    lineHeight: 1.3,
  },
  rowControl: {
    flexShrink: 0,
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 18px',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border-subtle)',
    width: '100%',
    cursor: 'pointer',
    textAlign: 'left',
    minHeight: 56,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    background: 'var(--bg-card-hover)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    minWidth: 0,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: 500,
  },
  themeRow: {
    display: 'flex',
    gap: 6,
  },
  themePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  stepper: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--bg-card-hover)',
    padding: '4px 6px',
    borderRadius: 999,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'var(--bg-card)',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-primary)',
  },
  stepperValue: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums',
    minWidth: 60,
    textAlign: 'center',
  },
  stepperSuffix: {
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  switch: {
    width: 46,
    height: 26,
    borderRadius: 999,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'background 0.2s',
  },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  aboutCard: {
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  aboutRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 14,
  },
  aboutLabel: {
    color: 'var(--text-secondary)',
  },
  aboutValue: {
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  aboutTagline: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    marginTop: 4,
    paddingTop: 8,
    borderTop: '1px solid var(--border-subtle)',
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
  modalCard: {
    background: 'var(--bg-elevated)',
    borderRadius: 16,
    padding: 24,
    maxWidth: 420,
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
    lineHeight: 1.5,
  },
  choiceOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    background: 'var(--bg-primary)',
    borderRadius: 12,
    border: '1.5px solid',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
  choiceText: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: 1,
  },
  choiceLabel: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  choiceDesc: {
    fontSize: 13,
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

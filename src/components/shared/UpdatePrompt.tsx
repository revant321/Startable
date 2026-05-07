/// <reference types="vite-plugin-pwa/react" />
import { useRegisterSW } from 'virtual:pwa-register/react';

const CHECK_INTERVAL_MS = 30 * 60 * 1000;

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      if (!r) return;
      setInterval(() => {
        r.update().catch(() => {});
      }, CHECK_INTERVAL_MS);
    },
  });

  if (!needRefresh) return null;

  return (
    <div style={styles.banner} role="status" aria-live="polite">
      <span style={styles.message}>A new version is available</span>
      <div style={styles.actions}>
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          style={styles.updateBtn}
        >
          Update
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          style={styles.laterBtn}
        >
          Later
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: 'fixed',
    top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    background: '#1A1A1F',
    border: '1px solid rgba(124, 92, 252, 0.45)',
    borderRadius: 999,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 500,
    zIndex: 200,
    maxWidth: 'calc(100vw - 32px)',
  },
  message: {
    whiteSpace: 'nowrap',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  updateBtn: {
    background: '#34D399',
    color: '#0A0A0A',
    border: 'none',
    borderRadius: 999,
    padding: '6px 14px',
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  laterBtn: {
    background: 'transparent',
    color: '#98989F',
    border: 'none',
    padding: '6px 8px',
    fontSize: 13,
    cursor: 'pointer',
  },
};

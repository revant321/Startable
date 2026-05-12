import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const BASE = import.meta.env.BASE_URL;

const tabs = [
  { path: '/', icon: `${BASE}icons/home.png`, label: 'Home' },
  { path: '/inbox', icon: `${BASE}icons/inbox.png`, label: 'Inbox' },
  { path: '/goals', icon: `${BASE}icons/goals.png`, label: 'Goals' },
  { path: '/reflections', icon: `${BASE}icons/reflections.png`, label: 'Reflections' },
] as const;

interface BottomNavProps {
  visible: boolean;
}

export default function BottomNav({ visible }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!visible) return null;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav style={styles.nav}>
      {tabs.map(({ path, icon, label }) => {
        const active = isActive(path);
        return (
          <motion.button
            key={path}
            onClick={() => navigate(path)}
            style={styles.tab}
            whileTap={{ scale: 0.92 }}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            {active && (
              <motion.div
                layoutId="activeTab"
                style={styles.activePill}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <img
              src={icon}
              alt=""
              width={58}
              height={58}
              draggable={false}
              className="nav-icon"
              style={{
                opacity: active ? 1 : 0.55,
                position: 'relative',
                zIndex: 1,
                pointerEvents: 'none',
                WebkitTouchCallout: 'none',
              }}
            />
            <span
              style={{
                ...styles.tabLabel,
                opacity: active ? 1 : 0.55,
              }}
            >
              {label}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'fixed',
    bottom: 14,
    left: 22,
    right: 22,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 0,
    paddingLeft: 6,
    paddingRight: 6,
    paddingBottom: 0,
    borderRadius: 999,
    background: 'var(--nav-glass-bg)',
    backdropFilter: 'blur(60px) saturate(180%)',
    WebkitBackdropFilter: 'blur(60px) saturate(180%)',
    border: '1.5px solid var(--nav-glass-border)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.12)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    zIndex: 50,
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    padding: '0 4px',
    position: 'relative',
    flex: 1,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  activePill: {
    position: 'absolute',
    top: 2,
    bottom: -12,
    left: 2,
    right: 2,
    borderRadius: 16,
    background: 'var(--nav-active-pill-bg)',
    border: '1px solid var(--nav-active-pill-border)',
    zIndex: 0,
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 1,
    fontWeight: 500,
    color: 'var(--nav-icon-active)',
    letterSpacing: '0.2px',
    position: 'relative',
    zIndex: 1,
  },
};

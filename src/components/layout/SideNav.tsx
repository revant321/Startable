import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';

const BASE = import.meta.env.BASE_URL;

const tabs = [
  { path: '/', icon: `${BASE}icons/home.png`, label: 'Home' },
  { path: '/inbox', icon: `${BASE}icons/inbox.png`, label: 'Inbox' },
  { path: '/goals', icon: `${BASE}icons/goals.png`, label: 'Goals' },
  { path: '/reflections', icon: `${BASE}icons/reflections.png`, label: 'Reflections' },
] as const;

interface SideNavProps {
  visible: boolean;
}

export default function SideNav({ visible }: SideNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!visible) return null;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isSettingsActive = location.pathname === '/settings';

  return (
    <nav style={styles.nav}>
      <div style={styles.mainIcons}>
        {tabs.map(({ path, icon }) => {
          const active = isActive(path);
          return (
            <motion.button
              key={path}
              onClick={() => navigate(path)}
              style={styles.tab}
              whileTap={{ scale: 0.9 }}
            >
              <div style={styles.iconContainer}>
                <AnimatePresence>
                  {active && (
                    <motion.div
                      key={`bubble-${path}`}
                      style={styles.activeBubble}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                        duration: 0.25,
                      }}
                    />
                  )}
                </AnimatePresence>
                <img
                  src={icon}
                  alt=""
                  width={46}
                  height={46}
                  draggable={false}
                  className="nav-icon"
                  style={{
                    opacity: active ? 1.0 : 0.4,
                    position: 'relative',
                    zIndex: 1,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    WebkitTouchCallout: 'none',
                  } as React.CSSProperties}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      <motion.button
        style={styles.tab}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/settings')}
      >
        <div style={styles.iconContainer}>
          <AnimatePresence>
            {isSettingsActive && (
              <motion.div
                key="bubble-settings"
                style={styles.activeBubble}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 25,
                  duration: 0.25,
                }}
              />
            )}
          </AnimatePresence>
          <Settings
            size={32}
            color="var(--text-primary)"
            style={{
              opacity: isSettingsActive ? 1.0 : 0.4,
              position: 'relative',
              zIndex: 1,
            }}
          />
        </div>
      </motion.button>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 90,
    height: '100dvh',
    background: 'var(--bg-sidenav)',
    borderRight: '1px solid var(--border-subtle)',
    flexShrink: 0,
    paddingTop: 24,
    paddingBottom: 24,
    userSelect: 'none',
  },
  mainIcons: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 32,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    userSelect: 'none',
  },
  iconContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 62,
    height: 62,
  },
  activeBubble: {
    position: 'absolute',
    width: 62,
    height: 62,
    borderRadius: '50%',
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    border: '1px solid rgba(52, 211, 153, 0.3)',
    top: 0,
    left: 0,
  },
};

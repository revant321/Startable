import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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
                width={36}
                height={36}
                draggable={false}
                className="nav-icon"
                style={{
                  opacity: active ? 1.0 : 0.4,
                  position: 'relative',
                  zIndex: 1,
                  pointerEvents: 'none',
                  WebkitTouchCallout: 'none',
                }}
              />
            </div>
          </motion.button>
        );
      })}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    flexShrink: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 'calc(70px + env(safe-area-inset-bottom, 0px))',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    background: '#111111',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 0,
    paddingRight: 0,
    minWidth: 60,
    marginTop: -1,
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  iconContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
  },
  activeBubble: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: '50%',
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    border: '1px solid rgba(52, 211, 153, 0.3)',
    top: 0,
    left: 0,
  },
};

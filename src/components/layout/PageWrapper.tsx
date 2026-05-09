import type { ReactNode } from 'react';
import { Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import useIsMobile from '../../hooks/useIsMobile';

interface PageWrapperProps {
  title: string;
  rightAction?: ReactNode;
  children: ReactNode;
}

export default function PageWrapper({ title, rightAction, children }: PageWrapperProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isHome = location.pathname === '/';

  const renderRightAction = () => {
    if (rightAction) return <div>{rightAction}</div>;
    if (!isMobile || !isHome) return null;
    return (
      <motion.button
        onClick={() => navigate('/settings')}
        style={styles.gearButton}
        whileTap={{ opacity: 0.5 }}
      >
        <Settings size={26} color="#888888" />
      </motion.button>
    );
  };

  const wrapperStyle: React.CSSProperties = {
    ...styles.wrapper,
    padding: isMobile ? '0 16px' : '0 48px',
  };

  const titleStyle: React.CSSProperties = {
    ...styles.title,
    fontSize: isMobile ? 24 : 32,
  };

  const headerStyle: React.CSSProperties = {
    ...styles.header,
    paddingTop: isMobile ? 'env(safe-area-inset-top, 16px)' : 32,
  };

  return (
    <div style={wrapperStyle} className="page-wrapper">
      <header style={headerStyle} className="page-header">
        <h1 style={titleStyle} className="page-title">{title}</h1>
        {renderRightAction()}
      </header>
      <div style={styles.content}>{children}</div>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    minHeight: 56,
  },
  title: {
    fontWeight: 700,
  },
  content: {
    flex: 1,
  },
  gearButton: {
    background: 'none',
    border: 'none',
    padding: 8,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

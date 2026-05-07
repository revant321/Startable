import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import BottomNav from './components/layout/BottomNav';
import SideNav from './components/layout/SideNav';
import HomeScreen from './components/home/HomeScreen';
import InboxScreen from './components/inbox/InboxScreen';
import GoalsScreen from './components/goals/GoalsScreen';
import GoalDetail from './components/goals/GoalDetail';
import GoalCreationFlow from './components/goals/GoalCreationFlow';
import FocusScreen from './components/focus/FocusScreen';
import SessionBanner from './components/focus/SessionBanner';
import ReflectionsScreen from './components/reflections/ReflectionsScreen';
import ReflectionFlow from './components/reflections/ReflectionFlow';
import SettingsScreen from './components/settings/SettingsScreen';
import ArchiveScreen from './components/archive/ArchiveScreen';
import ArchiveGoalView from './components/archive/ArchiveGoalView';
import { ActiveSessionProvider } from './hooks/useActiveSession';
import { ToastProvider } from './components/ui/Toast';
import { useTheme } from './hooks/useTheme';
import { purgeExpiredTrash } from './utils/trashCleanup';
import useIsMobile from './hooks/useIsMobile';

export default function App() {
  const location = useLocation();
  const isMobile = useIsMobile();
  useTheme();

  useEffect(() => {
    purgeExpiredTrash().catch(() => {});
  }, []);

  const showNav =
    !location.pathname.startsWith('/focus') &&
    location.pathname !== '/reflection';

  const mainPaddingBottom =
    isMobile && showNav ? 'calc(60px + env(safe-area-inset-bottom, 0px))' : 0;

  return (
    <ToastProvider>
      <ActiveSessionProvider>
        <div className="app-shell">
          {!isMobile && <SideNav visible={showNav} />}
          <main className="app-main" style={{ paddingBottom: mainPaddingBottom }}>
            <div className="app-content">
              <SessionBanner />
              <Routes>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/inbox" element={<InboxScreen />} />
                <Route path="/goals" element={<GoalsScreen />} />
                <Route path="/goals/new" element={<GoalCreationFlow />} />
                <Route path="/goals/:id" element={<GoalDetail />} />
                <Route path="/focus/:goalId" element={<FocusScreen />} />
                <Route path="/reflection" element={<ReflectionFlow />} />
                <Route path="/reflections" element={<ReflectionsScreen />} />
                <Route path="/archive" element={<ArchiveScreen />} />
                <Route path="/archive/goals/:id" element={<ArchiveGoalView />} />
                <Route path="/settings" element={<SettingsScreen />} />
              </Routes>
            </div>
          </main>
          {isMobile && <BottomNav visible={showNav} />}
        </div>
      </ActiveSessionProvider>
    </ToastProvider>
  );
}

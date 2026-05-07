import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'startable.activeSession.v1';

export interface ActiveSession {
  goalId: number;
  goalTitle: string;
  startedAt: number;
  durationMinutes: number;
  isPaused: boolean;
  pausedAt: number | null;
  totalPausedMs: number;
  isActivationSession: boolean;
}

export interface EndedSessionData {
  goalId: number;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  isActivationSession: boolean;
}

interface StartParams {
  goalId: number;
  goalTitle: string;
  durationMinutes: number;
  isActivationSession: boolean;
}

interface ContextValue {
  activeSession: ActiveSession | null;
  remainingSeconds: number;
  isCompleted: boolean;
  startSession: (params: StartParams) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => EndedSessionData | null;
  discardSession: () => void;
  extendSession: (minutes: number) => void;
  getRemainingSeconds: () => number;
}

const ActiveSessionContext = createContext<ContextValue | null>(null);

function loadSession(): ActiveSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.goalId !== 'number' ||
      typeof parsed?.startedAt !== 'number' ||
      typeof parsed?.durationMinutes !== 'number'
    ) {
      return null;
    }
    return parsed as ActiveSession;
  } catch {
    return null;
  }
}

function saveSession(s: ActiveSession | null) {
  try {
    if (s == null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore quota / privacy errors
  }
}

function computeRemainingSeconds(s: ActiveSession | null): number {
  if (!s) return 0;
  const now = Date.now();
  const currentPauseMs =
    s.isPaused && s.pausedAt != null ? now - s.pausedAt : 0;
  const elapsedMs = now - s.startedAt - s.totalPausedMs - currentPauseMs;
  const remainingMs = s.durationMinutes * 60 * 1000 - elapsedMs;
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

export function ActiveSessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    () => loadSession()
  );
  const [, setTick] = useState(0);

  const sessionRef = useRef(activeSession);
  useEffect(() => {
    sessionRef.current = activeSession;
  }, [activeSession]);

  // 1Hz tick for live remaining-time updates while running.
  useEffect(() => {
    if (!activeSession || activeSession.isPaused) return;
    const id = setInterval(() => setTick((t) => (t + 1) % 1_000_000), 1000);
    return () => clearInterval(id);
  }, [activeSession?.goalId, activeSession?.isPaused, activeSession?.startedAt]);

  // Persist any change.
  useEffect(() => {
    saveSession(activeSession);
  }, [activeSession]);

  const remainingSeconds = computeRemainingSeconds(activeSession);
  const isCompleted =
    activeSession != null && remainingSeconds <= 0 && !activeSession.isPaused;

  const startSession = useCallback((params: StartParams) => {
    const now = Date.now();
    setActiveSession({
      goalId: params.goalId,
      goalTitle: params.goalTitle,
      startedAt: now,
      durationMinutes: params.durationMinutes,
      isPaused: false,
      pausedAt: null,
      totalPausedMs: 0,
      isActivationSession: params.isActivationSession,
    });
  }, []);

  const pauseSession = useCallback(() => {
    setActiveSession((s) => {
      if (!s || s.isPaused) return s;
      return { ...s, isPaused: true, pausedAt: Date.now() };
    });
  }, []);

  const resumeSession = useCallback(() => {
    setActiveSession((s) => {
      if (!s || !s.isPaused || s.pausedAt == null) return s;
      const pauseDelta = Date.now() - s.pausedAt;
      return {
        ...s,
        isPaused: false,
        pausedAt: null,
        totalPausedMs: s.totalPausedMs + pauseDelta,
      };
    });
  }, []);

  const extendSession = useCallback((minutes: number) => {
    setActiveSession((s) => {
      if (!s) return s;
      return { ...s, durationMinutes: Math.max(1, s.durationMinutes + minutes) };
    });
  }, []);

  const endSession = useCallback((): EndedSessionData | null => {
    const s = sessionRef.current;
    if (!s) return null;
    const now = Date.now();
    const currentPauseMs =
      s.isPaused && s.pausedAt != null ? now - s.pausedAt : 0;
    const elapsedMs = Math.max(
      0,
      now - s.startedAt - s.totalPausedMs - currentPauseMs
    );
    const cappedMs = Math.min(elapsedMs, s.durationMinutes * 60 * 1000);
    const durationMinutes = Math.max(1, Math.round(cappedMs / 60000));
    const startedAtISO = new Date(s.startedAt).toISOString();
    const endedAtISO = new Date(now).toISOString();
    setActiveSession(null);
    return {
      goalId: s.goalId,
      startedAt: startedAtISO,
      endedAt: endedAtISO,
      durationMinutes,
      isActivationSession: s.isActivationSession,
    };
  }, []);

  const discardSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  const getRemainingSeconds = useCallback(
    () => computeRemainingSeconds(sessionRef.current),
    []
  );

  const value: ContextValue = {
    activeSession,
    remainingSeconds,
    isCompleted,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    discardSession,
    extendSession,
    getRemainingSeconds,
  };

  return (
    <ActiveSessionContext.Provider value={value}>
      {children}
    </ActiveSessionContext.Provider>
  );
}

export function useActiveSession(): ContextValue {
  const ctx = useContext(ActiveSessionContext);
  if (!ctx) {
    throw new Error('useActiveSession must be used within ActiveSessionProvider');
  }
  return ctx;
}

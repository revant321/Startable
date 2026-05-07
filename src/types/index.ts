export interface InboxItem {
  id?: number;
  title: string;
  description?: string;
  createdAt: string;
  status: 'active' | 'deleted';
  deletedAt?: string;
}

export interface Goal {
  id?: number;
  type: 'active' | 'passive';
  title: string;
  description?: string;
  category?: string;
  timeHorizon?: 'short' | 'mid' | 'long';
  whyItMatters?: string;
  currentNextStep?: string;
  reminder?: string;
  status: 'draft' | 'active' | 'focused' | 'completed' | 'archived' | 'deleted';
  isWeeklyFocus: boolean;
  createdAt: string;
  updatedAt: string;
  lastWorkedAt?: string;
  deletedAt?: string;
  chosenSubFocusId?: number;     // Passive goals: today's chosen sub-focus
  chosenSubFocusDate?: string;   // YYYY-MM-DD — date the sub-focus was chosen
}

export interface GoalNote {
  id?: number;
  goalId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalSession {
  id?: number;
  goalId: number;
  startedAt: string;
  endedAt: string;
  durationMinutes: number;
  isActivationSession: boolean;
  progressRating: 'yes' | 'some' | 'no';
  summary?: string;
  nextStep?: string;
  reminderForNextTime?: string;
  noteAdded?: string;
}

export interface PassiveSubFocus {
  id?: number;
  goalId: number;
  label: string;
  createdAt: string;
}

export interface PassiveCheckIn {
  id?: number;
  goalId: number;
  subFocusId: number;
  date: string;
  result: 'good' | 'okay' | 'missed';
  note?: string;
  createdAt: string;
}

export interface AppSettings {
  id?: number;
  theme: 'system' | 'light' | 'dark';
  defaultSessionMinutes: number;
  timerSoundEnabled: boolean;
}

export interface QuickTask {
  id?: number;
  title: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  sortOrder: number;
  createdAt: string;
}

import Dexie, { type Table } from 'dexie';
import type {
  InboxItem,
  Goal,
  GoalNote,
  GoalSession,
  PassiveSubFocus,
  PassiveCheckIn,
  AppSettings,
  QuickTask,
} from '../types';

class StartableDB extends Dexie {
  inboxItems!: Table<InboxItem>;
  goals!: Table<Goal>;
  goalNotes!: Table<GoalNote>;
  goalSessions!: Table<GoalSession>;
  passiveSubFocuses!: Table<PassiveSubFocus>;
  passiveCheckIns!: Table<PassiveCheckIn>;
  appSettings!: Table<AppSettings>;
  quickTasks!: Table<QuickTask>;

  constructor() {
    super('StartableDB');
    this.version(1).stores({
      inboxItems: '++id, status, createdAt, deletedAt',
      goals: '++id, type, status, isWeeklyFocus, category, createdAt, updatedAt, lastWorkedAt',
      goalNotes: '++id, goalId, createdAt',
      goalSessions: '++id, goalId, startedAt',
      passiveSubFocuses: '++id, goalId',
      passiveCheckIns: '++id, goalId, subFocusId, date',
      appSettings: '++id',
    });
    this.version(2).stores({
      quickTasks: '++id, completed, sortOrder, dueDate, createdAt',
    });
    this.version(3).stores({
      goals: '++id, type, status, isWeeklyFocus, category, createdAt, updatedAt, lastWorkedAt, chosenSubFocusDate',
    });
  }
}

export const db = new StartableDB();

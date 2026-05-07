import { db } from '../db/database';
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

const SCHEMA_VERSION = 1;

interface ExportPayload {
  version: number;
  exportedAt: string;
  data: {
    inboxItems: InboxItem[];
    goals: Goal[];
    goalNotes: GoalNote[];
    goalSessions: GoalSession[];
    passiveSubFocuses: PassiveSubFocus[];
    passiveCheckIns: PassiveCheckIn[];
    quickTasks: QuickTask[];
    appSettings: AppSettings[];
  };
}

export type ImportMode = 'merge' | 'replace';

function todayFilename(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `startable-backup-${y}-${m}-${d}.startable`;
}

export async function exportData(): Promise<void> {
  const [
    inboxItems,
    goals,
    goalNotes,
    goalSessions,
    passiveSubFocuses,
    passiveCheckIns,
    quickTasks,
    appSettings,
  ] = await Promise.all([
    db.inboxItems.toArray(),
    db.goals.toArray(),
    db.goalNotes.toArray(),
    db.goalSessions.toArray(),
    db.passiveSubFocuses.toArray(),
    db.passiveCheckIns.toArray(),
    db.quickTasks.toArray(),
    db.appSettings.toArray(),
  ]);

  const payload: ExportPayload = {
    version: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      inboxItems,
      goals,
      goalNotes,
      goalSessions,
      passiveSubFocuses,
      passiveCheckIns,
      quickTasks,
      appSettings,
    },
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = todayFilename();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function isValidPayload(p: unknown): p is ExportPayload {
  if (!p || typeof p !== 'object') return false;
  const obj = p as Record<string, unknown>;
  if (typeof obj.version !== 'number') return false;
  const data = obj.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') return false;
  return Array.isArray(data.goals) && Array.isArray(data.inboxItems);
}

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export async function importData(
  file: File,
  mode: ImportMode
): Promise<{ ok: true; counts: Record<string, number> } | { ok: false; error: string }> {
  let text: string;
  try {
    text = await readFileAsText(file);
  } catch {
    return { ok: false, error: 'Could not read the file.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }

  if (!isValidPayload(parsed)) {
    return { ok: false, error: 'File is not a valid Startable backup.' };
  }

  const data = parsed.data;
  const counts: Record<string, number> = {};

  if (mode === 'replace') {
    // Wipe and re-insert with original IDs preserved when possible.
    await Promise.all([
      db.inboxItems.clear(),
      db.goals.clear(),
      db.goalNotes.clear(),
      db.goalSessions.clear(),
      db.passiveSubFocuses.clear(),
      db.passiveCheckIns.clear(),
      db.quickTasks.clear(),
      db.appSettings.clear(),
    ]);

    counts.inboxItems = await db.inboxItems.bulkPut(data.inboxItems ?? []).then(() => (data.inboxItems ?? []).length);
    counts.goals = await db.goals.bulkPut(data.goals ?? []).then(() => (data.goals ?? []).length);
    counts.goalNotes = await db.goalNotes.bulkPut(data.goalNotes ?? []).then(() => (data.goalNotes ?? []).length);
    counts.goalSessions = await db.goalSessions.bulkPut(data.goalSessions ?? []).then(() => (data.goalSessions ?? []).length);
    counts.passiveSubFocuses = await db.passiveSubFocuses.bulkPut(data.passiveSubFocuses ?? []).then(() => (data.passiveSubFocuses ?? []).length);
    counts.passiveCheckIns = await db.passiveCheckIns.bulkPut(data.passiveCheckIns ?? []).then(() => (data.passiveCheckIns ?? []).length);
    counts.quickTasks = await db.quickTasks.bulkPut(data.quickTasks ?? []).then(() => (data.quickTasks ?? []).length);
    counts.appSettings = await db.appSettings.bulkPut(data.appSettings ?? []).then(() => (data.appSettings ?? []).length);
    return { ok: true, counts };
  }

  // MERGE — let Dexie auto-assign IDs for everything to avoid collisions, and remap referential IDs.
  const goalIdMap = new Map<number, number>();
  const subFocusIdMap = new Map<number, number>();

  // Goals first (so we can remap goalId references)
  for (const g of data.goals ?? []) {
    const oldId = g.id;
    const { id: _id, ...payload } = g;
    void _id;
    // Remap chosenSubFocusId after sub-focuses are imported — store old ref temporarily on the new row, fix later.
    const newId = (await db.goals.add(payload as Goal)) as number;
    if (oldId != null) goalIdMap.set(oldId, newId);
  }
  counts.goals = data.goals?.length ?? 0;

  // Sub-focuses
  for (const sf of data.passiveSubFocuses ?? []) {
    const oldId = sf.id;
    const { id: _omit, ...payload } = sf;
    void _omit;
    payload.goalId = goalIdMap.get(payload.goalId) ?? payload.goalId;
    const newId = (await db.passiveSubFocuses.add(payload as PassiveSubFocus)) as number;
    if (oldId != null) subFocusIdMap.set(oldId, newId);
  }
  counts.passiveSubFocuses = data.passiveSubFocuses?.length ?? 0;

  // Now repair goal.chosenSubFocusId references
  const importedGoals = await db.goals.toArray();
  for (const g of importedGoals) {
    if (g.id != null && g.chosenSubFocusId != null) {
      const remapped = subFocusIdMap.get(g.chosenSubFocusId);
      if (remapped != null && remapped !== g.chosenSubFocusId) {
        await db.goals.update(g.id, { chosenSubFocusId: remapped });
      }
    }
  }

  // Notes
  for (const n of data.goalNotes ?? []) {
    const { id: _omit, ...payload } = n;
    void _omit;
    payload.goalId = goalIdMap.get(payload.goalId) ?? payload.goalId;
    await db.goalNotes.add(payload as GoalNote);
  }
  counts.goalNotes = data.goalNotes?.length ?? 0;

  // Sessions
  for (const s of data.goalSessions ?? []) {
    const { id: _omit, ...payload } = s;
    void _omit;
    payload.goalId = goalIdMap.get(payload.goalId) ?? payload.goalId;
    await db.goalSessions.add(payload as GoalSession);
  }
  counts.goalSessions = data.goalSessions?.length ?? 0;

  // Check-ins
  for (const c of data.passiveCheckIns ?? []) {
    const { id: _omit, ...payload } = c;
    void _omit;
    payload.goalId = goalIdMap.get(payload.goalId) ?? payload.goalId;
    payload.subFocusId = subFocusIdMap.get(payload.subFocusId) ?? payload.subFocusId;
    await db.passiveCheckIns.add(payload as PassiveCheckIn);
  }
  counts.passiveCheckIns = data.passiveCheckIns?.length ?? 0;

  // Inbox items (no foreign refs)
  for (const i of data.inboxItems ?? []) {
    const { id: _omit, ...payload } = i;
    void _omit;
    await db.inboxItems.add(payload as InboxItem);
  }
  counts.inboxItems = data.inboxItems?.length ?? 0;

  // Quick tasks (no foreign refs)
  for (const t of data.quickTasks ?? []) {
    const { id: _omit, ...payload } = t;
    void _omit;
    await db.quickTasks.add(payload as QuickTask);
  }
  counts.quickTasks = data.quickTasks?.length ?? 0;

  // App settings — merging settings doesn't really make sense; preserve existing.
  counts.appSettings = 0;

  return { ok: true, counts };
}

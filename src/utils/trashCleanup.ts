import { db } from '../db/database';

const TRASH_TTL_DAYS = 3;
const TRASH_TTL_MS = TRASH_TTL_DAYS * 24 * 60 * 60 * 1000;

export function daysUntilAutoDelete(deletedAt: string): number {
  const ms = TRASH_TTL_MS - (Date.now() - new Date(deletedAt).getTime());
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export function autoDeleteCountdownLabel(deletedAt: string): string {
  const ms = TRASH_TTL_MS - (Date.now() - new Date(deletedAt).getTime());
  if (ms <= 0) return 'Auto-deleting...';
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  if (hours < 24) return `Auto-deletes in ${hours}h`;
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  return `Auto-deletes in ${days} day${days === 1 ? '' : 's'}`;
}

/** Remove inbox items + goals that have been in trash longer than 3 days. */
export async function purgeExpiredTrash(): Promise<number> {
  const cutoff = new Date(Date.now() - TRASH_TTL_MS).toISOString();
  let purged = 0;

  const expiredInbox = await db.inboxItems
    .filter(
      (item) => item.status === 'deleted' && !!item.deletedAt && item.deletedAt < cutoff
    )
    .toArray();
  for (const item of expiredInbox) {
    if (item.id != null) {
      await db.inboxItems.delete(item.id);
      purged++;
    }
  }

  const expiredGoals = await db.goals
    .filter(
      (g) => g.status === 'deleted' && !!g.deletedAt && g.deletedAt < cutoff
    )
    .toArray();
  for (const g of expiredGoals) {
    if (g.id != null) {
      await purgeGoalCascade(g.id);
      purged++;
    }
  }

  return purged;
}

/** Permanently delete a goal and all of its dependent records. */
export async function purgeGoalCascade(goalId: number): Promise<void> {
  await db.goalNotes.where('goalId').equals(goalId).delete();
  await db.goalSessions.where('goalId').equals(goalId).delete();
  await db.passiveSubFocuses.where('goalId').equals(goalId).delete();
  await db.passiveCheckIns.where('goalId').equals(goalId).delete();
  await db.goals.delete(goalId);
}

/** Empty the trash: permanently delete all inbox items + goals currently in trash. */
export async function clearAllTrash(): Promise<void> {
  const trashedInbox = await db.inboxItems
    .filter((i) => i.status === 'deleted')
    .toArray();
  for (const item of trashedInbox) {
    if (item.id != null) await db.inboxItems.delete(item.id);
  }

  const trashedGoals = await db.goals
    .filter((g) => g.status === 'deleted')
    .toArray();
  for (const g of trashedGoals) {
    if (g.id != null) await purgeGoalCascade(g.id);
  }
}

/** Wipe the entire database — used by Settings → Clear All Data. */
export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.inboxItems.clear(),
    db.goals.clear(),
    db.goalNotes.clear(),
    db.goalSessions.clear(),
    db.passiveSubFocuses.clear(),
    db.passiveCheckIns.clear(),
    db.quickTasks.clear(),
    // Keep appSettings — clearing also wipes theme/defaults; users would likely want those preserved
  ]);
}

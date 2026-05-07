import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { GoalSession, PassiveCheckIn } from '../types';

export type ActivityEntry =
  | { kind: 'session'; timestamp: string; data: GoalSession }
  | { kind: 'checkIn'; timestamp: string; data: PassiveCheckIn };

const RECENT_LIMIT = 7;

export function useRecentActivity(limit: number = RECENT_LIMIT): ActivityEntry[] {
  const entries = useLiveQuery(async () => {
    const sessions = await db.goalSessions
      .orderBy('startedAt')
      .reverse()
      .limit(20)
      .toArray();
    const checkIns = await db.passiveCheckIns.toArray();
    const merged: ActivityEntry[] = [
      ...sessions.map<ActivityEntry>((s) => ({
        kind: 'session',
        timestamp: s.endedAt || s.startedAt,
        data: s,
      })),
      ...checkIns.map<ActivityEntry>((c) => ({
        kind: 'checkIn',
        timestamp: c.createdAt,
        data: c,
      })),
    ];
    merged.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return merged.slice(0, limit);
  }, [limit]);
  return entries ?? [];
}

export function useActiveInboxCount(): number {
  const count = useLiveQuery(async () => {
    return db.inboxItems.where('status').equals('active').count();
  });
  return count ?? 0;
}

export function useSubFocusesByIds(ids: number[]) {
  const map = useLiveQuery(async () => {
    if (ids.length === 0) return new Map<number, string>();
    const results = await db.passiveSubFocuses.where('id').anyOf(ids).toArray();
    const m = new Map<number, string>();
    for (const sf of results) {
      if (sf.id != null) m.set(sf.id, sf.label);
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);
  return map ?? new Map<number, string>();
}

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { Goal } from '../types';

export function useGoal(id: number | undefined) {
  const goal = useLiveQuery(
    () => (id == null ? undefined : db.goals.get(id)),
    [id]
  );
  return { goal, loading: goal === undefined };
}

export function useGoalsByType(type: 'active' | 'passive') {
  const goals = useLiveQuery(async () => {
    const results = await db.goals.where('type').equals(type).toArray();
    return results
      .filter((g) => g.status !== 'deleted' && g.status !== 'archived' && g.status !== 'completed')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [type]);
  return { goals: goals ?? [], loading: goals === undefined };
}

export function useGoalNotes(goalId: number | undefined) {
  const notes = useLiveQuery(async () => {
    if (goalId == null) return [];
    const results = await db.goalNotes.where('goalId').equals(goalId).toArray();
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [goalId]);
  return notes ?? [];
}

export function useGoalSessions(goalId: number | undefined) {
  const sessions = useLiveQuery(async () => {
    if (goalId == null) return [];
    const results = await db.goalSessions.where('goalId').equals(goalId).toArray();
    return results.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }, [goalId]);
  return sessions ?? [];
}

export function usePassiveSubFocuses(goalId: number | undefined) {
  const subFocuses = useLiveQuery(async () => {
    if (goalId == null) return [];
    const results = await db.passiveSubFocuses.where('goalId').equals(goalId).toArray();
    return results.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [goalId]);
  return subFocuses ?? [];
}

export function usePassiveCheckIns(goalId: number | undefined) {
  const checkIns = useLiveQuery(async () => {
    if (goalId == null) return [];
    const results = await db.passiveCheckIns.where('goalId').equals(goalId).toArray();
    return results.sort((a, b) => b.date.localeCompare(a.date));
  }, [goalId]);
  return checkIns ?? [];
}

export function useAllGoalSessions() {
  const sessions = useLiveQuery(async () => {
    const all = await db.goalSessions.toArray();
    return all.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  });
  return sessions ?? [];
}

export function useGoalsMap() {
  const goals = useLiveQuery(async () => {
    const all = await db.goals.toArray();
    const map = new Map<number, Goal>();
    for (const g of all) {
      if (g.id != null) map.set(g.id, g);
    }
    return map;
  });
  return goals ?? new Map<number, Goal>();
}

export function useFocusedGoal(type: 'active' | 'passive') {
  const goal = useLiveQuery(async () => {
    const results = await db.goals.where('type').equals(type).toArray();
    return results.find((g) => g.isWeeklyFocus && g.status !== 'deleted' && g.status !== 'archived');
  }, [type]);
  return goal as Goal | undefined;
}

export async function setWeeklyFocus(goal: Goal) {
  if (!goal.id) return;
  const now = new Date().toISOString();
  const existing = await db.goals.where('type').equals(goal.type).toArray();
  for (const g of existing) {
    if (g.id !== goal.id && g.isWeeklyFocus) {
      await db.goals.update(g.id!, {
        isWeeklyFocus: false,
        status: g.status === 'focused' ? 'active' : g.status,
        updatedAt: now,
      });
    }
  }
  await db.goals.update(goal.id, {
    isWeeklyFocus: true,
    status: goal.type === 'active' && goal.status !== 'draft' ? 'focused' : goal.status,
    updatedAt: now,
  });
}

export async function removeWeeklyFocus(goal: Goal) {
  if (!goal.id) return;
  const now = new Date().toISOString();
  await db.goals.update(goal.id, {
    isWeeklyFocus: false,
    status: goal.status === 'focused' ? 'active' : goal.status,
    updatedAt: now,
  });
}

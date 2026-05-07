import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { QuickTask } from '../types';

export function useQuickTasks(): QuickTask[] {
  const tasks = useLiveQuery(async () => {
    const all = await db.quickTasks.toArray();
    const incomplete = all
      .filter((t) => !t.completed)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const complete = all
      .filter((t) => t.completed)
      .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
    return [...incomplete, ...complete];
  });
  return tasks ?? [];
}

export async function addTask(title: string, dueDate?: string): Promise<number> {
  const trimmed = title.trim();
  if (!trimmed) return -1;
  // Shift all existing incomplete tasks down so new task is at top (sortOrder 0)
  const existing = await db.quickTasks.filter((t) => !t.completed).toArray();
  for (const t of existing) {
    if (t.id != null) {
      await db.quickTasks.update(t.id, { sortOrder: t.sortOrder + 1 });
    }
  }
  const id = await db.quickTasks.add({
    title: trimmed,
    dueDate,
    completed: false,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
  });
  return id as number;
}

export async function toggleTask(id: number): Promise<void> {
  const task = await db.quickTasks.get(id);
  if (!task) return;
  if (task.completed) {
    await db.quickTasks.update(id, {
      completed: false,
      completedAt: undefined,
    });
  } else {
    await db.quickTasks.update(id, {
      completed: true,
      completedAt: new Date().toISOString(),
    });
  }
}

export async function deleteTask(id: number): Promise<void> {
  await db.quickTasks.delete(id);
}

export async function reorderTasks(taskIds: number[]): Promise<void> {
  for (let i = 0; i < taskIds.length; i++) {
    await db.quickTasks.update(taskIds[i], { sortOrder: i });
  }
}

export async function updateTask(
  id: number,
  updates: Partial<Pick<QuickTask, 'title' | 'dueDate'>>
): Promise<void> {
  await db.quickTasks.update(id, updates);
}

export async function clearCompleted(): Promise<void> {
  const completed = await db.quickTasks.filter((t) => t.completed).toArray();
  for (const t of completed) {
    if (t.id != null) await db.quickTasks.delete(t.id);
  }
}

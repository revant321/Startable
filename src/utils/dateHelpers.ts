export type DueRelation = 'overdue' | 'today' | 'tomorrow' | 'future';

export function dueRelation(dueDate: string): DueRelation {
  const today = todayISO();
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  const t = new Date(today);
  t.setDate(t.getDate() + 1);
  const tomorrow = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  if (dueDate === tomorrow) return 'tomorrow';
  return 'future';
}

export function formatDueDate(dueDate: string): string {
  const rel = dueRelation(dueDate);
  if (rel === 'today') return 'Today';
  if (rel === 'tomorrow') return 'Tomorrow';
  // Parse YYYY-MM-DD as local date (no timezone shift)
  const [y, m, d] = dueDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

export function dueColor(dueDate: string): string {
  const rel = dueRelation(dueDate);
  if (rel === 'overdue') return '#FF6B6B';
  if (rel === 'today') return '#FBBF24';
  return 'var(--text-secondary)';
}

export function formatLongDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function weekKey(dateString: string): string {
  const d = new Date(dateString);
  // Move to Monday of that week
  const day = d.getDay() || 7; // 1..7 (Mon..Sun)
  const monday = new Date(d);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(d.getDate() - (day - 1));
  return monday.toISOString().slice(0, 10);
}

export function weekRangeLabel(weekKeyStr: string): string {
  const [y, m, d] = weekKeyStr.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const sameYear = end.getFullYear() === new Date().getFullYear();
  return `${fmt(start)} – ${fmt(end)}${sameYear ? '' : `, ${end.getFullYear()}`}`;
}

export function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

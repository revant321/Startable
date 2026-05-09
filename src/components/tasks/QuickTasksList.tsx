import {
  useState,
  useRef,
  useEffect,
  type CSSProperties,
} from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  Plus,
  X,
  Check,
  GripVertical,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import {
  useQuickTasks,
  addTask,
  toggleTask,
  deleteTask,
  reorderTasks,
  updateTask,
  clearCompleted,
} from '../../hooks/useTasks';
import { formatDueDate, dueColor } from '../../utils/dateHelpers';
import type { QuickTask } from '../../types';

export default function QuickTasksList() {
  const tasks = useQuickTasks();
  const incomplete = tasks.filter((t) => !t.completed);
  const complete = tasks.filter((t) => t.completed);

  // Local order state for drag — keeps the list smooth during DB writes
  const [localOrder, setLocalOrder] = useState<QuickTask[]>(incomplete);
  useEffect(() => {
    // Only sync when not actively dragging
    setLocalOrder(incomplete);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomplete.map((t) => `${t.id}:${t.sortOrder}`).join(',')]);

  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [completedOpen, setCompletedOpen] = useState(true);

  const handleAdd = async () => {
    const t = newTitle.trim();
    if (!t) {
      setNewTitle('');
      setAdding(false);
      return;
    }
    await addTask(t);
    setNewTitle('');
    setAdding(false);
  };

  const handleReorder = async (next: QuickTask[]) => {
    setLocalOrder(next);
    const ids = next.map((t) => t.id!).filter((id) => id != null);
    await reorderTasks(ids);
  };

  const incompleteCount = incomplete.length;

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <h3 style={styles.heading}>
          Tasks <span style={styles.count}>({incompleteCount})</span>
        </h3>
        {!adding && (
          <motion.button
            style={styles.addButton}
            whileTap={{ scale: 0.94 }}
            onClick={() => setAdding(true)}
            aria-label="Add task"
          >
            <Plus size={18} color="var(--text-primary)" />
          </motion.button>
        )}
      </div>

      <Reorder.Group
        axis="y"
        values={localOrder}
        onReorder={handleReorder}
        style={styles.list}
      >
        {localOrder.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </Reorder.Group>

      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={styles.addRow}
          >
            <input
              style={styles.addInput}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a task..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') {
                  setNewTitle('');
                  setAdding(false);
                }
              }}
              onBlur={handleAdd}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {incomplete.length === 0 && !adding && complete.length === 0 && (
        <p style={styles.empty}>No tasks yet. Tap + to add one.</p>
      )}

      {complete.length > 0 && (
        <div style={styles.completedSection}>
          <div style={styles.completedHeaderRow}>
            <button
              style={styles.completedHeaderBtn}
              onClick={() => setCompletedOpen((o) => !o)}
            >
              <motion.span
                animate={{ rotate: completedOpen ? 0 : -90 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'inline-flex' }}
              >
                <ChevronDown size={16} color="var(--text-secondary)" />
              </motion.span>
              <span style={styles.completedHeaderLabel}>
                Completed <span style={styles.count}>({complete.length})</span>
              </span>
            </button>
            <button style={styles.clearCompleted} onClick={clearCompleted}>
              Clear completed
            </button>
          </div>
          <AnimatePresence initial={false}>
            {completedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={styles.list}>
                  {complete.map((task) => (
                    <CompletedRow key={task.id} task={task} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

const LONG_PRESS_MS = 350;
const MOVE_TOLERANCE = 8;

function TaskRow({ task }: { task: QuickTask }) {
  const dragControls = useDragControls();
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftDate, setDraftDate] = useState(task.dueDate ?? '');
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [showCheckPop, setShowCheckPop] = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStart = useRef<{ x: number; y: number } | null>(null);
  const dragStarted = useRef(false);

  useEffect(() => setDraftTitle(task.title), [task.title]);
  useEffect(() => setDraftDate(task.dueDate ?? ''), [task.dueDate]);

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    pressStart.current = null;
  };

  const onItemPointerDown = (e: React.PointerEvent<HTMLLIElement>) => {
    if (editingTitle || editingDate) return;
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea')) return;
    pressStart.current = { x: e.clientX, y: e.clientY };
    dragStarted.current = false;
    const nativeEvent = e.nativeEvent;
    longPressTimer.current = setTimeout(() => {
      dragStarted.current = true;
      dragControls.start(nativeEvent);
      longPressTimer.current = null;
    }, LONG_PRESS_MS);
  };

  const onItemPointerMove = (e: React.PointerEvent<HTMLLIElement>) => {
    if (!pressStart.current || !longPressTimer.current) return;
    const dx = Math.abs(e.clientX - pressStart.current.x);
    const dy = Math.abs(e.clientY - pressStart.current.y);
    if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) cancelLongPress();
  };

  const onItemClickCapture = (e: React.MouseEvent<HTMLLIElement>) => {
    if (dragStarted.current) {
      e.stopPropagation();
      e.preventDefault();
      dragStarted.current = false;
    }
  };

  const handleToggle = () => {
    if (task.id == null) return;
    setShowCheckPop(true);
    setTimeout(() => {
      if (task.id != null) toggleTask(task.id);
    }, 450);
  };

  const saveTitle = async () => {
    const t = draftTitle.trim();
    if (task.id != null && t && t !== task.title) {
      await updateTask(task.id, { title: t });
    } else {
      setDraftTitle(task.title);
    }
    setEditingTitle(false);
  };

  const saveDate = async (next: string) => {
    if (task.id == null) return;
    await updateTask(task.id, { dueDate: next || undefined });
    setDraftDate(next);
    setEditingDate(false);
  };

  return (
    <Reorder.Item
      value={task}
      id={String(task.id)}
      dragListener={false}
      dragControls={dragControls}
      style={styles.item as CSSProperties}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        zIndex: 5,
      }}
      transition={{ type: 'spring', damping: 28, stiffness: 350 }}
      onPointerDown={onItemPointerDown}
      onPointerMove={onItemPointerMove}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onClickCapture={onItemClickCapture}
    >
      <button
        style={styles.dragHandle}
        onPointerDown={(e) => dragControls.start(e)}
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} color="var(--text-secondary)" />
      </button>

      <motion.button
        style={styles.checkbox}
        whileTap={{ scale: 0.85 }}
        onClick={handleToggle}
        aria-label="Mark complete"
      >
        <AnimatePresence>
          {showCheckPop && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={styles.checkboxFill}
            >
              <Check size={14} color="#fff" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <div style={styles.titleArea}>
        {editingTitle ? (
          <input
            style={styles.titleInput}
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            autoFocus
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveTitle();
              if (e.key === 'Escape') {
                setDraftTitle(task.title);
                setEditingTitle(false);
              }
            }}
          />
        ) : (
          <button
            style={styles.titleText}
            onClick={() => setEditingTitle(true)}
          >
            {task.title}
          </button>
        )}
      </div>

      <div style={styles.rightArea}>
        {editingDate ? (
          <input
            ref={dateInputRef}
            type="date"
            style={styles.dateInput}
            value={draftDate}
            onChange={(e) => saveDate(e.target.value)}
            onBlur={() => setEditingDate(false)}
            autoFocus
          />
        ) : task.dueDate ? (
          <button
            style={{ ...styles.dueDate, color: dueColor(task.dueDate) }}
            onClick={() => setEditingDate(true)}
          >
            {formatDueDate(task.dueDate)}
          </button>
        ) : (
          <button
            style={styles.addDateBtn}
            onClick={() => setEditingDate(true)}
            aria-label="Add due date"
          >
            <Calendar size={14} color="var(--text-secondary)" />
          </button>
        )}

        <button
          style={styles.deleteBtn}
          onClick={() => task.id != null && deleteTask(task.id)}
          aria-label="Delete task"
        >
          <X size={16} color="var(--text-secondary)" />
        </button>
      </div>
    </Reorder.Item>
  );
}

function CompletedRow({ task }: { task: QuickTask }) {
  const handleToggle = () => task.id != null && toggleTask(task.id);
  const handleDelete = () => task.id != null && deleteTask(task.id);
  return (
    <motion.div layout style={styles.item}>
      <span style={styles.dragHandlePlaceholder} />
      <motion.button
        style={{ ...styles.checkbox, ...styles.checkboxComplete }}
        whileTap={{ scale: 0.85 }}
        onClick={handleToggle}
        aria-label="Mark incomplete"
      >
        <Check size={14} color="#fff" strokeWidth={3} />
      </motion.button>
      <div style={styles.titleArea}>
        <span style={{ ...styles.titleText, ...styles.titleComplete }}>
          {task.title}
        </span>
      </div>
      <div style={styles.rightArea}>
        {task.dueDate && (
          <span style={{ ...styles.dueDate, color: 'var(--text-secondary)' }}>
            {formatDueDate(task.dueDate)}
          </span>
        )}
        <button style={styles.deleteBtn} onClick={handleDelete} aria-label="Delete task">
          <X size={16} color="var(--text-secondary)" />
        </button>
      </div>
    </motion.div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heading: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  count: {
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  addButton: {
    background: 'var(--bg-card)',
    border: 'none',
    width: 32,
    height: 32,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: '8px 10px 8px 4px',
    listStyle: 'none',
    userSelect: 'none',
  },
  dragHandle: {
    background: 'none',
    border: 'none',
    padding: 6,
    cursor: 'grab',
    display: 'flex',
    alignItems: 'center',
    touchAction: 'none',
  },
  dragHandlePlaceholder: {
    width: 28,
    flexShrink: 0,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: '2px solid var(--text-secondary)',
    background: 'transparent',
    cursor: 'pointer',
    flexShrink: 0,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  checkboxComplete: {
    background: 'var(--active-green)',
    border: '2px solid var(--active-green)',
  },
  checkboxFill: {
    position: 'absolute',
    inset: -2,
    borderRadius: '50%',
    background: 'var(--active-green)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleArea: {
    flex: 1,
    minWidth: 0,
  },
  titleText: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    fontSize: 15,
    cursor: 'pointer',
    padding: '6px 8px',
    textAlign: 'left',
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
  titleComplete: {
    color: 'var(--text-secondary)',
    textDecoration: 'line-through',
  },
  titleInput: {
    width: '100%',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '6px 10px',
    color: 'var(--text-primary)',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
  },
  rightArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  dueDate: {
    background: 'none',
    border: 'none',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 6,
  },
  addDateBtn: {
    background: 'none',
    border: 'none',
    padding: 6,
    cursor: 'pointer',
    display: 'flex',
    borderRadius: 6,
  },
  dateInput: {
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '4px 8px',
    color: 'var(--text-primary)',
    fontSize: 13,
    outline: 'none',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    padding: 6,
    cursor: 'pointer',
    display: 'flex',
    borderRadius: 6,
  },
  addRow: {
    marginTop: 6,
    background: 'var(--bg-card)',
    borderRadius: 12,
    padding: '4px 14px 4px 38px',
  },
  addInput: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    padding: '10px 0',
    color: 'var(--text-primary)',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
  },
  empty: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    fontStyle: 'italic',
    padding: '16px 0',
    textAlign: 'center',
  },
  completedSection: {
    marginTop: 16,
  },
  completedHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  completedHeaderBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'none',
    border: 'none',
    padding: '6px 0',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
  },
  completedHeaderLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  clearCompleted: {
    background: 'none',
    border: 'none',
    padding: '6px 8px',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 6,
  },
};

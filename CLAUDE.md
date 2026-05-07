# CLAUDE.md — Startable

## What This File Is
This file is auto-read by Claude Code at the start of every session. It contains project context, current state, and session history so work can resume cleanly.

## Project Overview
Startable is a local-first goals, focus, and execution PWA. It helps users capture ideas, structure them into active (tangible) or passive (behavioral) goals, focus weekly attention, work through timed sessions with a draggable circular timer, and log quick reflections — all stored locally with no cloud dependency.

## Tech Stack
- React 18 + TypeScript + Vite (PWA)
- Dexie.js (IndexedDB wrapper) for all local storage
- React Router v6 for navigation
- Framer Motion for animations
- Lucide React for icons
- CSS variables for theming (system-adaptive dark/light mode)

## Design Language
- **Dark-first:** Near-black background (#0A0A0A), white text, gray pill/card containers (#1A1A1A to #222222)
- **Light mode:** Light gray background (#F5F5F5), white cards with subtle shadows, dark text
- **Three accent color roles:**
  - Green (#34D399) = Active goals
  - Blue (#60A5FA) = Passive goals  
  - Violet (#7C5CFC) = Focus screen / timer
- **Typography:** SF system font stack (-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui)
- **Icons:** Lucide React, minimal line style, consistent stroke weight
- **Cards:** Rounded corners (12-16px), floating on background, consistent padding (16-20px)
- **Animations:** Poppy and clean via Framer Motion — quick springs, smooth transitions, satisfying micro-interactions

## Key Architecture Decisions
- All data in IndexedDB via Dexie.js — no cloud, no AI
- Manual sync via .startable JSON file export/import
- Bottom nav with 5 tabs (hidden on Focus screen)
- Active goals require 20-min activation session to leave Draft status
- Focus screen has a draggable circular timer wheel (full circle = 60 min)
- Post-session reflections are a 5-step quick flow (under 60 seconds)

## Database Tables
- inboxItems, goals, goalNotes, goalSessions, passiveSubFocuses, passiveCheckIns, appSettings, quickTasks (v2)

## Current Phase
**Phase 7: Archive, Trash, Settings, Polish**

## Current Status
COMPLETE — Startable v1 build complete

## What Phase 1 Includes
- Vite + React + TypeScript + PWA plugin setup
- Dexie.js database with all 7 tables defined
- React Router with all routes
- Bottom navigation component (Home, Inbox, Goals, Reflections, More)
- Placeholder pages for all screens
- CSS variables and theme system (dark mode first, system-adaptive)
- Basic responsive layout
- TypeScript interfaces for all data models

## File Structure Reference
See startable-project-spec.md for full file tree.

## Session Log

### 2026-04-09 — Phase 1 Complete
- Initialized Vite + React 18 + TypeScript project with PWA plugin
- Installed all dependencies: dexie, react-router-dom, framer-motion, lucide-react, vite-plugin-pwa
- Created TypeScript interfaces for all 7 data models (src/types/index.ts)
- Set up Dexie database with all 7 tables and indexes (src/db/database.ts)
- Built CSS variable theme system with dark-first + light mode support (src/styles/globals.css)
- Created BottomNav component with 5 tabs, active state highlighting, hidden on Focus routes
- Created PageWrapper component for consistent page layout
- Set up React Router with all 8 routes
- Created placeholder pages for all screens (Home, Inbox, Goals, GoalDetail, Focus, Reflections, Archive, Settings)
- FocusScreen renders without BottomNav (zen mode)
- Configured PWA manifest, viewport meta, and theme-color
- Build passes cleanly with type-checking

### 2026-04-09 — Phase 2 Complete
- Built full InboxScreen with swipeable cards (touch + mouse), empty state, count badge, FAB
- Swipe right = accept (navigates to goal creation with pre-filled data), swipe left = delete (soft delete with deletedAt)
- Tap on card opens edit modal for updating title/description
- Built QuickCaptureModal — bottom sheet with title + description fields, saves to Dexie
- Built GoalCreationFlow — multi-step: type selection (active/passive), then type-specific form
- Active goal form: title, description, category, time horizon selector, why it matters, first next step → creates in Draft status
- Passive goal form: title, description, category, why it matters, 3-5 sub-focus behaviors → creates in Active status, saves PassiveSubFocus entries
- When accepting an inbox item, its data pre-fills the goal form and the inbox item is soft-deleted on save
- Created dateHelpers utility (timeAgo function)
- Added /goals/new route to App.tsx
- Build passes cleanly

### 2026-05-06 — Phase 3 Complete
- Installed dexie-react-hooks for live-updating Dexie queries
- Built useGoals.ts: useGoal, useGoalsByType, useGoalNotes, useGoalSessions, usePassiveSubFocuses, usePassiveCheckIns, useFocusedGoal, plus setWeeklyFocus/removeWeeklyFocus mutators (enforce only-one-focused per type)
- Built GoalsScreen with Active/Passive tab switcher, animated tab transitions, focused goal pinned at top with accent border + "THIS WEEK'S FOCUS" label, color-coded FAB
- Built GoalCard reusable card showing title, status badge, category/horizon tags, next-step preview (active) or sub-focus count + today's focus (passive)
- Built GoalDetailActive: top bar with back + overflow menu, large title, status/category/horizon badges, editable "Why this matters", green-bordered Next Step card with "Activate — Start 20 min session" (Draft) or "Start Session" (Active/Focused) button, editable reminder, collapsible Sessions section with date/duration/emoji rating, Notes section with add/delete + confirmation
- Built GoalDetailPassive: same structure adapted for passive goals (blue-accented), Sub-focuses list with today's selection highlighted, "Set as today's focus?" confirmation, daily check-in flow (Good/Okay/Missed + optional note → PassiveCheckIn), check-in history, sub-focus editor (add/remove/reword, max 7), retire option
- Built shared sub-components: InlineEdit (tap-to-edit single/multi-line with Save/Cancel), CollapsibleSection (animated height), OverflowMenu (bottom sheet on mobile, dropdown on desktop), NotesSection (CRUD + delete confirmation)
- GoalDetail.tsx now dispatches to Active or Passive view based on goal.type, with loading and not-found states
- Desktop layout uses two-column grid: main info on left ~60%, sessions/check-ins + notes on right ~40%; mobile stacks vertically with collapsibles closed by default
- Today's passive sub-focus stored in localStorage keyed by goal+date
- Build passes cleanly (npx tsc --noEmit && npx vite build)

### 2026-05-06 — Phase 3.5 Complete (Quick Tasks)
- Added QuickTask interface (title, dueDate, completed, completedAt, sortOrder, createdAt) to types
- Bumped Dexie database to v2 with new quickTasks table indexed on completed/sortOrder/dueDate/createdAt
- Built useTasks hook: useQuickTasks (live-sorted: incomplete by sortOrder asc → completed by completedAt desc), addTask (shifts existing tasks down so new task takes sortOrder 0), toggleTask, deleteTask, reorderTasks, updateTask, clearCompleted
- Added date helpers: dueRelation (overdue/today/tomorrow/future), formatDueDate ("Today"/"Tomorrow"/"May 8"), dueColor (red overdue, amber today, gray future)
- Built QuickTasksList component: drag-to-reorder using framer-motion Reorder.Group + dragControls (handle-only drag), animated checkbox toggle (450ms pop before DB write), inline title edit, native date picker for due date, X to delete, collapsible Completed section with Clear completed
- Updated Inbox accept flow: swipe right now opens AcceptChoiceModal — Goal (continues to /goals/new) or Quick Task (creates task immediately, soft-deletes inbox item, shows "Task added ✓" toast). Renders as bottom sheet on mobile, centered modal on desktop
- Mounted QuickTasksList on HomeScreen below the placeholder for Phase 6
- Updated spec with QuickTask interface and v2 schema
- Build passes cleanly

### 2026-05-06 — Phase 4 Complete (Focus Screen + Timer Wheel)
- Built useTimer hook: state machine (pre-start/running/paused/completed), uses targetEndTime + Date.now() for tab-backgrounding accuracy, requestAnimationFrame loop only updates state when integer second changes, exposes start/pause/resume/end/reset/addMinutes
- Built TimerWheel SVG component (200 viewBox, normalized): two arcs (background ring + violet progress arc with drop-shadow glow), drag handle as filled white circle with violet stroke, transparent 22px capture surface around handle for easy grabbing. Pointer events use atan2(dx, -dy) to compute angle from 12 o'clock clockwise, snap to 1-min increments, wrap-detection (delta > 30 → clamp to 5; delta < -30 → clamp to 60). Full circle (60 min) renders as <circle> instead of arc to avoid SVG arc-degeneracy. Locked when activation session (handle hidden, no interaction). Completion triggers radial-gradient pulse animation
- Built QuickNoteOverlay: floating modal with backdrop blur, autosaves GoalNote without pausing timer
- Built FocusScreen: radial violet wash background, X close (confirms if running/paused), StickyNote icon for quick note, "ACTIVATION SESSION" label when goal is Draft. Renders TimerWheel + state-dependent action buttons (Start / Pause+End / Resume+End / "Session Complete!"). +5 min button during running state. Reminder callout below title (dismissible). On end (manual or auto): saves placeholder GoalSession to Dexie (progressRating 'some', empty fields), updates goal.lastWorkedAt, navigates to /reflection with sessionData state
- Race-condition guard: sessionFinalizedRef ref prevents double-save when manual end triggers state='completed' that would also fire the auto-completion useEffect
- Created ReflectionPlaceholder for Phase 5: confirms session logged, "Back to Goal" button. Route /reflection added; nav hidden on /reflection (continuation of zen flow)
- Wheel sizing: 280px mobile, 340px desktop. Center display tabular-nums MM:SS with violet text-shadow
- Build passes cleanly

### 2026-05-06 — Phase 5 Complete (Reflection Flow + Reflections Log)
- Built ReflectionFlow: full-screen 5-step flow over violet/blue radial gradient continuing from Focus screen, ProgressDots header (5 dots, current scaled 1.3x and filled green), back arrow disabled on step 1, slide-in/slide-out transitions (x:dir*50 → 0 → -dir*50)
- Step 1 Progress: 3 large pill buttons (✅ Yes / 🔶 Some / ❌ No) with hover lift and tinted-border-on-select; auto-advances after 220ms
- Steps 2/3: single-line inputs with autoFocus + Enter-to-advance, Next button disabled until value present
- Step 4 Reminder: input + Skip/Save row (optional)
- Step 5 Note: textarea + Skip/Finish row (optional)
- On finalize: writes complete GoalSession (real progressRating + summary + nextStep + reminder + note), updates goal.currentNextStep / reminder / lastWorkedAt; if isActivationSession AND duration ≥ 10 min, promotes goal status from 'draft' → 'active'; if note provided, also writes a GoalNote. Navigates to / with toast "Session logged ✓" (replace history)
- Guard: if /reflection visited without sessionData state (refresh, deep link), redirects to /
- Removed FocusScreen's placeholder GoalSession write — ReflectionFlow now owns the canonical save. FocusScreen still navigates to /reflection with sessionData on natural completion or "End Session early"
- Replaced ReflectionsScreen placeholder with full implementation: Tab bar (All / By Goal / By Week, green underline), expandable ReflectionCard showing date+timeAgo, color-coded clickable goal name, duration pill, progress emoji, summary, "Next: ..." preview, and (when expanded) reminder + note rows. By Goal: collapsible group per goal sorted by title. By Week: collapsible group per ISO week, week range label "May 4 – May 10"
- Added useAllGoalSessions and useGoalsMap hooks for cross-goal querying; added weekKey + weekRangeLabel date helpers
- HomeScreen now displays incoming router-state toast (e.g., "Session logged ✓") and clears state after showing
- Deleted obsolete ReflectionPlaceholder
- Build passes cleanly

### 2026-05-06 — Phase 7 Complete (Archive, Trash, Settings, Polish)
- Built ArchiveScreen with Archive/Trash tab switcher (red-highlighted Trash tab includes count badge); each tab live-queried separately with sortable result lists
- Archive tab: cards for completed active goals + retired/archived passive goals with goal-type pill, category tag, completion/retirement date, and meta line ("12 sessions · 4h 30m" for active goals, "23 check-ins" for passive). Empty state when nothing archived
- Built ArchiveGoalView (src/components/archive/ArchiveGoalView.tsx) at /archive/goals/:id — read-only detail view that pulls from existing useGoal/useGoalSessions/usePassiveSubFocuses/usePassiveCheckIns/useGoalNotes hooks. Renders simple `<h1>`/`<p>` instead of InlineEdit, no Start Session / Set Focus / overflow menu, sessions and check-ins always expanded, notes display only. Top-right "Restore" pill prompts confirmation, sets status back to active and navigates to /goals with the right tab
- Trash tab: unified list of deleted inbox items + deleted goals sorted by deletedAt newest first. Each card shows kind badge (Idea / Active or Passive goal with accent color), title, deleted timeAgo, and color-coded countdown (red/bold when ≤ 1 day remaining). Two icon buttons per card: Restore (RotateCcw) clears deletedAt and sets status='active', and permanent Delete (Trash2) with confirmation that runs purgeGoalCascade for goals (drops goalNotes/goalSessions/passiveSubFocuses/passiveCheckIns then the goal itself). "Clear All" pill in the page header (visible only on Trash tab) opens a single confirmation that empties everything
- Built trashCleanup utility (src/utils/trashCleanup.ts): `purgeExpiredTrash` (runs on app mount via useEffect in App.tsx — deletes inbox items + goals with deletedAt older than 3 days, cascading goal-related rows), `purgeGoalCascade`, `clearAllTrash`, `clearAllData` (wipes every table except appSettings), plus `daysUntilAutoDelete` and `autoDeleteCountdownLabel` helpers
- Built SettingsScreen (src/components/settings/SettingsScreen.tsx) with grouped sections — Appearance (System/Light/Dark theme picker pills, selected pill filled green), Focus Sessions (default session length stepper 5–60 min in increments of 5, timer completion sound toggle switch with sliding knob), Data (Export Data, Import Data, View Archive & Trash, Clear All Data — destructive red), About (version 1.0, "Built by Revant", "Local-first · No cloud · No tracking" tagline)
- Built useExportImport hook (src/hooks/useExportImport.ts): `exportData` reads every table, wraps in { version: 1, exportedAt, data: {...} }, triggers Blob download as `startable-backup-YYYY-MM-DD.startable`. `importData(file, mode)` parses + validates, then either bulkPuts (replace mode, preserving original IDs) or auto-assigns new IDs and remaps goalId/subFocusId references across goalNotes/goalSessions/passiveSubFocuses/passiveCheckIns + repairs goal.chosenSubFocusId references (merge mode)
- Import flow: file picker accepts `.startable` and `.json`, opens a Merge / Replace All choice modal, Replace requires a second confirmation modal explaining destructiveness. Toast on success/error
- Clear All Data: red destructive action with confirmation modal that explains what gets wiped and that settings are preserved
- Built useSettings hook (src/hooks/useSettings.ts): singleton AppSettings row (id=1) with safe defaults (theme=system, defaultSessionMinutes=20, timerSoundEnabled=false), `useSettings` live-queries and ensures the row exists, `updateSettings(patch)` writes
- Built useTheme hook (src/hooks/useTheme.ts): reads theme from settings, applies/removes `.light` and `.dark` class on `<html>`. Mounted at the App root so theme follows users across the whole app, and the choice persists across reloads
- Updated globals.css: added explicit `html.light` and `html.dark` selectors that override the existing `@media (prefers-color-scheme: light)` rule so users can force a theme regardless of OS. Added `html.light` rule to override SideNav's hard-coded #111111 background with white + subtle right border
- Built ToastProvider (src/components/ui/Toast.tsx): global stacked-toast component mounted at app root, exposes `useToast().show(message, tone)` with default/success/error tones. Replaces ad-hoc per-screen toast handling for new flows; pre-existing per-screen toasts (Inbox, Home) still work in parallel
- App.tsx: re-added /archive and /archive/goals/:id routes, wrapped tree in ToastProvider, mounted useTheme(), runs purgeExpiredTrash() on first mount
- PWA finalization: vite.config.ts manifest now includes description, orientation: 'portrait-primary', maskable icon variant. index.html: apple-touch-icon link, description meta tag, fixed favicon path to /icons/favicon.svg
- Build (tsc --noEmit && vite build) passes cleanly. Bundle is ~636 KB (186 KB gzipped) with PWA precache configured for offline use

### 2026-05-06 — Phase 6 Complete (Home Screen + Passive Check-ins)
- Bumped Dexie database to v3, added `chosenSubFocusId` and `chosenSubFocusDate` (YYYY-MM-DD) to Goal interface for passive goals — replaces localStorage-based "today's chosen sub-focus" persistence with a queryable, sync-friendly field that auto-resets each day
- Built useActivity.ts: useRecentActivity (merges last 20 GoalSessions + all PassiveCheckIns, sorts by timestamp newest first, slices to 7), useActiveInboxCount (live count of inbox items with status 'active'), useSubFocusesByIds (for label resolution)
- Built SubFocusPicker (src/components/passive/SubFocusPicker.tsx): bottom sheet on mobile / centered modal on desktop, lists all sub-focuses as tappable pills, on tap writes goal.chosenSubFocusId + chosenSubFocusDate=todayISO() and closes
- Built CheckInFlow (src/components/passive/CheckInFlow.tsx): unified daily check-in modal triggerable from anywhere — props: goalId, subFocusId, subFocusLabel, onClose, onSaved. Three pill buttons (Good/Okay/Missed) + optional note + Save. Save writes PassiveCheckIn with date=todayISO()
- Built WeeklyFocusCards (src/components/home/WeeklyFocusCards.tsx): two pill cards in a 2-column grid on desktop, stacked on mobile. Active card (green-bordered): label + title + currentNextStep one-line + green "Start Session" button → /focus/:goalId, card body → /goals/:id. Passive card (blue-bordered): label + title + today's sub-focus or "Pick today's focus" + dynamic action button (Pick → opens SubFocusPicker / Check in → opens CheckInFlow / "Checked in: Good" disabled status if check-in done today). Empty states for both navigate to /goals with tab pre-selected
- Built RecentActivity (src/components/home/RecentActivity.tsx): "Recent" section header, optional inbox banner ("3 ideas waiting in your inbox" — green-tinted, navigates to /inbox), compact list of up to 7 entries. Sessions show Timer icon + "X min on [Goal]" + summary subtext. Check-ins show CheckCircle icon + "[Sub-focus]: Good" + note subtext. Goal name color-coded (green for active, blue for passive). Each row tappable → /goals/:id. Empty state when nothing yet
- Replaced HomeScreen placeholder + bare QuickTasksList with full launchpad: PageWrapper("Startable") containing WeeklyFocusCards → QuickTasksList → RecentActivity. Bottom padding 120px to clear nav. Toast handling preserved
- Migrated GoalDetailPassive: removed localStorage approach, todayId now derived from goal.chosenSubFocusDate === today comparison. Inline CheckInForm replaced with shared CheckInFlow component. Confirmation modal still appears when tapping a non-today sub-focus to set it as today's focus
- Drive-by fixes for `tsc -b` strictness: GoalsScreen useLiveQuery now uses async function form (was returning Promise.resolve([]) which broke type inference); removed unused useCallback import in QuickTasksList
- Updated spec implicitly via type/Dexie change; full project build (tsc -b && vite build) passes cleanly

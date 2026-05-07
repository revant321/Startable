# Startable — Project Specification v1

## Overview

Startable is a local-first goals, focus, and execution PWA for people who generate lots of ideas but struggle to begin because work feels too abstract or unstructured. The app transforms vague ideas into structured, startable goals — and then makes acting on them frictionless.

**Core principle:** An idea should not just be stored. It should be made startable.

**Platform:** Progressive Web App (PWA) — iPhone (Safari) + Mac (Safari/Chrome)
**Stack:** React 18 + TypeScript + Vite + Dexie.js (IndexedDB) + React Router + Framer Motion
**Storage:** Local-only, all data in IndexedDB via Dexie.js. No cloud. No AI.
**Sync:** Manual export/import via `.startable` JSON file (AirDrop-friendly)
**Target size:** Well under 10GB — app stores only text and structured data

---

## Design Language

### Philosophy
Simple enough that it doesn't feel cluttered, but has all the tools for effective goal tracking. Every UI element earns its place by helping the user act, not just organize. The app should feel inviting and motivating — opening it should feel like picking up a tool, not opening a spreadsheet.

### Color System

**Three distinct color roles with no overlap:**

| Role | Color | Usage |
|------|-------|-------|
| Active Goals | Green family (`#34D399` primary, with lighter/darker variants) | Active goal cards, badges, icons, progress indicators, "Start Session" buttons |
| Passive Goals | Blue family (`#60A5FA` primary, with lighter/darker variants) | Passive goal cards, badges, icons, sub-focus highlights, check-in indicators |
| Focus Screen | Violet/mid-blue (`#7C5CFC` primary, with lighter/darker variants) | Focus screen background tint, draggable timer wheel, session-related UI |

**Base palette (Dark Mode — primary):**
- Background: Near-black (`#0A0A0A`) — not pure black, provides subtle depth
- Card/pill containers: Dark gray (`#1A1A1A` to `#222222`) with subtle rounded corners
- Primary text: White (`#F5F5F5`)
- Secondary text: Gray (`#888888` to `#999999`) for labels, timestamps, descriptions
- Borders/dividers: Subtle (`#2A2A2A`)

**Base palette (Light Mode — system-adaptive):**
- Background: Light gray (`#F5F5F5`)
- Card/pill containers: White (`#FFFFFF`) with subtle shadows
- Primary text: Near-black (`#111111`)
- Secondary text: Gray (`#666666`)
- Same green/blue/violet accent colors (may need slight saturation adjustments for light backgrounds)

### Typography
- Font stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif`
- Headings: Bold weight, clean hierarchy (24px/20px/16px)
- Body: Regular weight, comfortable reading size (15-16px)
- Nothing decorative — clean, native Apple feel

### Icons
- Lucide React — minimal line icons with consistent stroke weight
- Cohesive across all screens
- Accent-colored when associated with goal types, neutral gray otherwise

### Animations (Framer Motion)
- Poppy and clean — quick spring animations on card interactions
- Smooth slide transitions between screens
- Satisfying micro-interactions (checkmark pop on completion, card press feedback)
- Timer wheel: smooth, responsive drag animation
- Page transitions: subtle fade or slide, not dramatic
- Loading states: gentle pulse or skeleton screens

### Card/Pill Design
- Rounded corners (12-16px radius)
- Floating appearance on near-black background
- Consistent internal padding (16-20px)
- Subtle hover/press states with scale or brightness shift

---

## Screen Architecture

### Bottom Navigation (persistent except Focus Screen)
Five tabs in a frosted/dark bar:
1. **Home** — house icon (`Home`)
2. **Inbox** — tray icon (`Inbox`)
3. **Goals** — target icon (`Target`)
4. **Reflections** — book icon (`BookOpen`)
5. **More** — three-dot icon (`MoreHorizontal`) — opens Archive/Trash and Settings

Focus Screen hides the bottom nav entirely for distraction-free zen mode.

---

### Screen 1: Home

**Purpose:** Immediate clarity. Answers: What matters this week? What should I do next? What have I done recently?

**Layout (top to bottom):**

**Top bar:**
- "Startable" title, left-aligned, bold
- Settings gear icon, right-aligned (shortcut to Settings)

**Weekly Focus section (two pill cards side by side):**
- **Left card (green-accented):** Focused active goal title + current next step preview. If no focused active goal is set, shows "Choose this week's focus" prompt.
- **Right card (blue-accented):** Focused passive goal title + today's chosen sub-focus. If no sub-focus chosen yet today, shows "Pick today's focus" prompt. If no focused passive goal set, shows "Choose this week's focus" prompt.

**Start Session button:**
- Prominent, centered below focus cards
- Green-tinted rounded button
- Tapping goes directly to Focus Screen for the focused active goal
- Disabled/hidden if no focused active goal is set

**Recent Activity section:**
- Section header: "Recent"
- Scrollable list of recent sessions and reflections (compact cards)
- Each entry: goal name (color-coded), duration, time ago, progress emoji
- Inbox count badge if ideas are waiting: "3 ideas in Inbox" (tappable, navigates to Inbox)

**Empty states:**
- No focused goals: Friendly prompt to go to Goals and set weekly focus
- No recent activity: "Start your first session to see activity here"

---

### Screen 2: Inbox

**Purpose:** Fastest possible idea capture. Zero friction.

**Top bar:**
- "Inbox" title + item count badge

**Floating "+" button:**
- Bottom-right corner, always visible
- Tapping opens a quick-capture modal:
  - Title field (required) — auto-focused for immediate typing
  - Optional one-line description field
  - "Save" button
  - No category, no tags, no structure — that comes later

**Inbox list:**
- Each item: gray pill card showing title, description preview (if exists), time ago
- Sorted by newest first
- Swipe right: Accept (navigates to goal creation flow with pre-filled title/description)
- Swipe left: Delete (sends to Trash with 3-day auto-delete)
- Tap: Opens item for viewing/editing title and description

**Empty state:** "Your inbox is empty. Tap + to capture an idea."

---

### Screen 3: Goals

**Purpose:** Core organizational screen. Active and passive goals separated clearly.

**Top bar:**
- "Goals" title

**Tab bar (directly below top bar):**
- Two tabs: "Active" (green underline when selected) | "Passive" (blue underline when selected)
- Tapping switches the goal list below

**Active tab content:**
- **Focused goal pinned at top:** Subtle green border/highlight, labeled "This Week's Focus"
- **Other active goals below:** Gray pill cards, sorted by last worked date
- **Each card shows:** Title, status badge (Draft / Active / Focused), category tag, current next step preview
- **Draft goals:** Visually dimmed with "Draft" badge — haven't completed their activation session yet
- **"+" button:** Bottom-right, starts goal creation flow (pre-set to Active type)

**Passive tab content:**
- **Focused goal pinned at top:** Subtle blue border/highlight, labeled "This Week's Focus"
- **Other passive goals below:** Gray pill cards
- **Each card shows:** Title, number of sub-focuses defined, today's sub-focus if picked
- **"+" button:** Bottom-right, starts goal creation flow (pre-set to Passive type)

**Goal creation flow (from "+" or accepted Inbox item):**
- Step 1: Active or Passive? (if not pre-set from tab context)
- Active goal form: Title, description, category, time horizon (short/mid/long), why this matters, first next step
- Passive goal form: Title, description, category, why this matters, 3–5 sub-focus behaviors
- New active goals start in **Draft** status
- New passive goals start in **Active** status (no activation session needed — they're behavioral)

---

### Screen 4: Goal Detail — Active

**Purpose:** Full view of an active goal. Everything about this goal in one place.

**Top section:**
- Back arrow (returns to Goals list)
- Goal title (large, bold)
- Status badge (Draft / Active / Focused) — green-accented
- Category tag + time horizon tag (short / mid / long-term)

**"Why this matters" section:**
- One or two lines set during goal creation
- Always visible as a motivation anchor
- Editable via tap

**Current Next Step (prominent card):**
- Green-accented highlight card
- Shows the current next step text (large, readable)
- If goal is **Draft**: Button reads "Activate — Start 20 min session"
- If goal is **Active/Focused**: Button reads "Start Session"
- Tapping either button navigates to Focus Screen

**Reminder callout:**
- Subtle card below next step
- Shows reminder text with a pin icon if one exists
- If no reminder: "Add a reminder for next time"
- Editable via tap

**Session History (collapsible section):**
- Header: "Sessions" + count
- Each entry: Date, duration, progress rating (emoji or badge), one-line summary
- Scrollable, sorted newest first
- Tapping an entry expands to show full reflection details

**Notes section (bottom):**
- Header: "Notes" + count
- List of saved notes, each with content and timestamp
- Add note button (opens simple text input)
- Swipe to delete a note, tap to edit

**Overflow menu (three dots, top right):**
- Edit goal details
- Set as weekly focus / Remove from weekly focus
- Mark as completed (moves to Archive)
- Delete (moves to Trash)

---

### Screen 5: Goal Detail — Passive

**Purpose:** Full view of a passive goal. Behavioral tracking and daily sub-focus selection.

**Top section:**
- Back arrow
- Goal title (large, bold) — blue-accented
- Status badge (Active / Focused)
- Category tag

**"Why this matters" section:**
- Same as active goals — always visible, editable

**Sub-focuses list:**
- Header: "Sub-focuses"
- Each sub-focus is a tappable pill
- Today's chosen sub-focus gets a blue highlight + "Today" label
- Tapping a sub-focus that is NOT today's selection: "Set as today's focus?" confirmation
- Tapping today's selected sub-focus: Opens check-in flow for that behavior

**Daily check-in flow (for selected sub-focus):**
- "How did it go today?"
- Three tappable options: Good / Okay / Missed
- Optional one-line note
- Saves as a PassiveCheckIn entry

**Check-in History (collapsible):**
- Past daily check-ins: date, sub-focus label, result, note
- Sorted newest first

**Reminder + Notes:**
- Same structure as active goals, blue-accented instead of green

**Overflow menu:**
- Edit goal details
- Edit sub-focuses (add/remove/reword)
- Set as weekly focus / Remove from weekly focus
- Retire (moves to Archive)
- Delete (moves to Trash)

---

### Screen 6: Focus Screen

**Purpose:** Distraction-free zen mode for active goal work sessions. The most visually distinct screen in the app.

**Behavior:** Hides bottom navigation entirely. Full-screen takeover. Background uses a subtle violet/mid-blue wash (`#7C5CFC` at low opacity over the near-black base).

**Layout (centered vertically):**

**Goal title** — medium size, white text

**Reminder from last session** — shown below goal title in a subtle callout card (slightly lighter background, italic text). Only appears if a reminder exists. Dismissible.

**Current next step** — large, bold, white. The primary visual element on the screen.

**Draggable Timer Wheel:**
- Circular clock-like interface, violet/mid-blue themed
- Full circle = 60 minutes
- Each minute = 6 degrees of arc
- Default starting position: 20 minutes (120 degrees filled)
- User drags clockwise around the circle to add time
- Dragging counter-clockwise reduces time (minimum: 5 minutes)
- The filled arc glows in violet/blue, unfilled arc is dark/muted
- Center of the wheel shows the current time remaining in large digits (MM:SS)
- Smooth, responsive drag animation with subtle haptic-style feedback (visual snap at 5-minute increments)
- When the timer is running, the filled arc animates smoothly as time decreases
- Visual pulse or glow effect when timer reaches zero

**Timer states:**
1. **Pre-start:** Wheel is draggable, time is adjustable. "Start" button below the wheel.
2. **Running:** Wheel animates as time decreases. "Pause" and "End Session" buttons below. Wheel is NOT draggable during running state — but a "Add Time" mode could re-enable dragging if the user taps a "+" icon.
3. **Paused:** Timer frozen. "Resume" and "End Session" buttons.
4. **Completed:** Timer reaches 0:00. Celebration micro-animation (subtle glow burst or pulse). Auto-transitions to Reflection flow after 1-2 seconds.

**Quick Note icon:** Small icon in top-right corner. Opens a minimal text input overlay without leaving the Focus screen — for capturing thoughts mid-session.

**Close/exit:** "X" button in top-left corner. If timer is running, asks "End session early?" with confirm/cancel.

**Activation session distinction:**
- If this is a Draft goal's first session (the activation session), the screen shows a subtle label: "Activation Session" near the top
- Timer is locked to 20 minutes (not adjustable for activation)
- On completion, the goal status changes from Draft → Active

---

### Screen 7: Reflection Flow (Post-Session)

**Purpose:** Quick structured reflection immediately after a focus session ends. Designed to take under 60 seconds.

**Presentation:** Full-screen modal flow. Step-by-step, one question per screen. Clean transitions between steps. Violet/blue tint carries over from the Focus screen to maintain continuity.

**Step 1: Progress**
- "Did you make progress?"
- Three tappable pill buttons: ✅ Yes / 🔶 Some / ❌ No
- Tap to select and auto-advance

**Step 2: Summary**
- "What happened?"
- Single-line text input, placeholder: "One sentence summary..."
- "Next" button

**Step 3: Next Step**
- "What's the next step?"
- Single-line text input, placeholder: "The next concrete action..."
- This becomes the goal's new `currentNextStep`
- "Next" button

**Step 4: Reminder**
- "Reminder for next time?"
- Single-line text input, placeholder: "e.g., Start with the outline first..."
- "Skip" and "Save" buttons — this is optional
- This becomes the goal's `reminder` field

**Step 5: Note**
- "Save a note to this goal?"
- Multi-line text input
- "Skip" and "Save" buttons — this is optional
- If saved, appends to the goal's notes list

**On completion:** Navigates back to Home. Shows a brief success toast: "Session logged ✓"

---

### Screen 8: Reflections Log

**Purpose:** Review past session reflections. Understand trajectory and patterns over time.

**Top bar:** "Reflections" title

**Filter tabs:** All | By Goal | By Week

**"All" view:**
- Chronological list (newest first) of all session reflections
- Each entry is a pill card showing:
  - Date + time ago
  - Goal name (green text for active goals)
  - Duration (e.g., "20 min")
  - Progress rating (emoji: ✅ / 🔶 / ❌)
  - One-line summary
  - Next step that was set
- Tapping expands the card to show reminder and note if they exist

**"By Goal" view:**
- Grouped by goal, each group collapsible
- Goal name as section header (color-coded)
- Sessions listed within each group

**"By Week" view:**
- Grouped by calendar week
- Week header shows date range + session count
- Sessions listed within each week

**Empty state:** "Complete a focus session to see reflections here."

---

### Screen 9: Archive & Trash

**Purpose:** Utility screen for completed/retired goals and deleted items.

**Top bar:** "Archive & Trash" title

**Two tabs:** "Archive" | "Trash"

**Archive tab:**
- Completed active goals and retired passive goals
- Each card: title, category, completion/retirement date, total sessions logged, color-coded (green/blue)
- Tapping opens a read-only Goal Detail view (full history, reflections, notes — not editable)
- This is the "trophy case" — proof of past work

**Trash tab:**
- Deleted inbox items and deleted goals
- Each card: title, when deleted, countdown ("Auto-deletes in 1 day")
- Swipe right to restore
- Items auto-delete permanently after 3 days
- "Clear All" option at top for manual cleanup

---

### Screen 10: Settings

**Purpose:** App configuration and data management.

**Top bar:** "Settings" title

**Grouped pill card sections:**

**Appearance:**
- Theme toggle: System / Light / Dark (three-way selector)

**Focus Sessions:**
- Default session length: Number input or stepper (default: 20 min, min: 5, max: 60)
- Timer completion sound: Toggle on/off

**Data:**
- "Export Data" — generates a `.startable` JSON file containing all app data
- "Import Data" — accepts a `.startable` file, merges or replaces local data (with user choice)
- "Clear All Data" — destructive action, red text, requires confirmation dialog ("This cannot be undone")

**About:**
- App version number
- "Built by Revant"

---

## User Flows

### Flow 1: Idea Capture → Goal Creation
```
Inbox (+) → Type title → Save
  → Idea appears in Inbox list
  → Swipe right to accept
  → "Active or Passive?" selection
  → Fill goal form
  → Goal created in Draft (active) or Active (passive) status
```

### Flow 2: Goal Activation (Active Goals Only)
```
Goals → Tap Draft goal → Goal Detail
  → Tap "Activate — Start 20 min session"
  → Focus Screen (timer locked at 20 min, "Activation Session" label)
  → Complete session
  → Reflection flow
  → Goal status changes Draft → Active
```

### Flow 3: Weekly Focus Session
```
Home → Tap "Start Session"
  → Focus Screen (focused active goal loaded)
  → Adjust timer via draggable wheel (or keep default)
  → Tap "Start"
  → Work for session duration
  → Timer completes → Reflection flow
  → Return to Home (updated recent activity)
```

### Flow 4: Passive Daily Focus
```
Home → Tap passive focus card (or Goals → Passive tab → Focused goal)
  → Goal Detail (Passive)
  → Tap a sub-focus to set as today's focus
  → Later: tap today's sub-focus again
  → Check-in flow: Good / Okay / Missed + optional note
  → Check-in logged
```

### Flow 5: Weekly Focus Selection
```
Goals → Active tab → Tap goal → Overflow menu → "Set as weekly focus"
  → Goal gets Focused status, pinned to top of list
  → Appears on Home screen in green focus card
  (Same flow for passive goals on Passive tab, blue-accented)
```

### Flow 6: Export/Import Sync
```
Settings → Export Data → .startable file generated → Share via AirDrop
  → Other device: Settings → Import Data → Select .startable file
  → Choose "Merge" or "Replace" → Data synced
```

---

## Data Model (Dexie.js / IndexedDB)

### InboxItem
```typescript
interface InboxItem {
  id?: number;              // Auto-incremented primary key
  title: string;
  description?: string;
  createdAt: string;        // ISO timestamp
  status: 'active' | 'deleted';
  deletedAt?: string;       // ISO timestamp, set when deleted (3-day auto-purge)
}
```

### Goal
```typescript
interface Goal {
  id?: number;
  type: 'active' | 'passive';
  title: string;
  description?: string;
  category?: string;
  timeHorizon?: 'short' | 'mid' | 'long';  // Active goals only
  whyItMatters?: string;
  currentNextStep?: string;                  // Active goals only
  reminder?: string;
  status: 'draft' | 'active' | 'focused' | 'completed' | 'archived' | 'deleted';
  isWeeklyFocus: boolean;
  createdAt: string;
  updatedAt: string;
  lastWorkedAt?: string;
  deletedAt?: string;
}
```

### GoalNote
```typescript
interface GoalNote {
  id?: number;
  goalId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

### GoalSession
```typescript
interface GoalSession {
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
  noteAdded?: string;       // Content of note added during reflection (also saved to GoalNote)
}
```

### PassiveSubFocus
```typescript
interface PassiveSubFocus {
  id?: number;
  goalId: number;
  label: string;
  createdAt: string;
}
```

### PassiveCheckIn
```typescript
interface PassiveCheckIn {
  id?: number;
  goalId: number;
  subFocusId: number;
  date: string;             // YYYY-MM-DD format
  result: 'good' | 'okay' | 'missed';
  note?: string;
  createdAt: string;
}
```

### AppSettings
```typescript
interface AppSettings {
  id?: number;              // Always 1 (singleton)
  theme: 'system' | 'light' | 'dark';
  defaultSessionMinutes: number;
  timerSoundEnabled: boolean;
}
```

### QuickTask
```typescript
interface QuickTask {
  id?: number;
  title: string;
  dueDate?: string;         // YYYY-MM-DD format, optional
  completed: boolean;
  completedAt?: string;     // ISO timestamp, set when completed
  sortOrder: number;        // Integer for drag-to-reorder positioning
  createdAt: string;        // ISO timestamp
}
```

Quick Tasks are a lightweight task system that complements Goals. Goals are for structured, ongoing objectives; Quick Tasks are for simple "just get this done" items. Quick Tasks live on the Home screen as a drag-to-reorder list. Inbox items can be accepted as either a Goal or a Quick Task.

### Dexie Database Definition
```typescript
const db = new Dexie('StartableDB');

db.version(1).stores({
  inboxItems: '++id, status, createdAt, deletedAt',
  goals: '++id, type, status, isWeeklyFocus, category, createdAt, updatedAt, lastWorkedAt',
  goalNotes: '++id, goalId, createdAt',
  goalSessions: '++id, goalId, startedAt',
  passiveSubFocuses: '++id, goalId',
  passiveCheckIns: '++id, goalId, subFocusId, date',
  appSettings: '++id'
});

db.version(2).stores({
  quickTasks: '++id, completed, sortOrder, dueDate, createdAt'
});
```

---

## Phased Build Plan

### Phase 1: Project Scaffold + Core Navigation (Session 1)
- Vite + React + TypeScript + PWA setup
- React Router with all routes defined
- Bottom navigation component (5 tabs)
- Placeholder pages for all 10 screens
- Dexie.js database initialization with all tables
- CSS variables and theme system (dark mode first)
- Basic responsive layout structure
- `CLAUDE.md` created

**Deliverable:** App shell that navigates between all screens with proper routing and bottom nav.

### Phase 2: Inbox + Goal Creation (Sessions 2–3)
- Inbox list view with pill cards
- Quick-capture modal (title + description)
- Swipe actions (accept / delete)
- Inbox item editing
- Goal creation flow (Active and Passive forms)
- Data persistence for InboxItem and Goal tables
- Trash behavior (3-day auto-delete logic)
- Empty states for Inbox

**Deliverable:** Full Inbox → Goal pipeline working with persistent storage.

### Phase 3: Goals Screen + Goal Detail Pages (Sessions 3–4)
- Goals screen with Active/Passive tab switching
- Goal list rendering with proper color coding
- Focused goal pinned to top
- Goal Detail — Active (full layout with all sections)
- Goal Detail — Passive (sub-focuses, check-in flow)
- Notes CRUD on both goal types
- Reminder editing
- Weekly focus selection (set/remove via overflow menu)
- Goal status management (Draft, Active, Focused, etc.)

**Deliverable:** Complete goal management with detail views, notes, and weekly focus.

### Phase 4: Focus Screen + Timer Wheel (Sessions 5–6)
- Focus Screen layout (zen mode, no bottom nav)
- Draggable circular timer wheel implementation
  - SVG or Canvas-based circle
  - Touch + mouse drag handling
  - Visual arc fill with violet glow
  - Center time display (MM:SS)
  - 5-minute snap increments during drag
  - Smooth countdown animation when running
- Timer states (pre-start, running, paused, completed)
- Activation session logic (locked 20-min for Draft goals, status change on completion)
- Quick note overlay
- Session-end transition to Reflection flow
- Framer Motion animations throughout

**Deliverable:** Fully functional Focus screen with draggable timer wheel and session management.

### Phase 5: Reflection Flow + Reflections Log (Sessions 6–7)
- Post-session reflection modal (5-step flow)
- GoalSession data persistence
- Auto-update goal's currentNextStep and reminder from reflection
- Reflections Log screen with All / By Goal / By Week views
- Reflection card rendering with expand/collapse
- Session history in Goal Detail pages (pulling from GoalSession data)

**Deliverable:** Complete reflection system — capture, storage, and review.

### Phase 6: Home Screen + Passive Check-ins (Sessions 7–8)
- Home screen with weekly focus cards (green/blue)
- Start Session shortcut from Home
- Recent activity feed (sessions + reflections)
- Inbox count badge
- Passive goal daily sub-focus selection
- Passive check-in flow (Good / Okay / Missed + note)
- PassiveCheckIn data persistence
- Check-in history on Passive Goal Detail

**Deliverable:** Home screen as functional launchpad + complete passive goal tracking.

### Phase 7: Archive, Trash, Settings, Polish (Sessions 8–9)
- Archive & Trash screen with tab switching
- Archive: read-only goal detail views
- Trash: restore + auto-delete countdown display
- Auto-purge logic (background check on app open)
- Settings screen (theme toggle, session defaults, timer sound)
- Export data to `.startable` JSON file
- Import data from `.startable` file (merge/replace)
- System theme detection and adaptive switching
- Light mode styling pass
- Animation polish across all screens
- PWA manifest + icons + "Add to Home Screen" readiness
- Final responsive testing (iPhone + Mac)

**Deliverable:** Complete v1 of Startable — fully functional, polished, and syncable.

---

## Estimated Timeline
- **7 phases across ~9–11 coding sessions**
- Each session ~1–2 hours
- Total estimated build time: ~15–20 hours of coding
- Assumes one session per sitting (some phases may span two sessions)

---

## Non-Negotiable Rules (from product spec)

1. Ideas begin in Inbox
2. Deleted Inbox items stay in Trash for 3 days
3. Goals are split into Active and Passive — always visually distinct
4. Only one Active goal can be the weekly focus
5. Only one Passive goal can be the weekly focus
6. Other goals can still be worked on (focus ≠ lock)
7. Active goals must have one visible current next step
8. All goals have a notes section
9. All goals can have a short reminder
10. The reminder is shown on the Focus screen before starting
11. Active goals start in Draft — must complete a 20-min activation session to become Active
12. Post-session reflections must be quick (under 60 seconds)
13. Passive goals are tracked through daily sub-focus behaviors, not timed sessions
14. All data is local-only — no cloud, no AI
15. Sync is manual export/import via `.startable` file

---

## File/Folder Structure (Expected)
```
startable/
├── public/
│   ├── manifest.json
│   ├── icons/
│   └── sw.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── db/
│   │   └── database.ts          # Dexie setup + all table definitions
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx
│   │   │   └── PageWrapper.tsx
│   │   ├── inbox/
│   │   │   ├── InboxList.tsx
│   │   │   ├── InboxCard.tsx
│   │   │   └── QuickCaptureModal.tsx
│   │   ├── goals/
│   │   │   ├── GoalList.tsx
│   │   │   ├── GoalCard.tsx
│   │   │   ├── GoalDetailActive.tsx
│   │   │   ├── GoalDetailPassive.tsx
│   │   │   ├── GoalCreationFlow.tsx
│   │   │   └── SubFocusList.tsx
│   │   ├── focus/
│   │   │   ├── FocusScreen.tsx
│   │   │   ├── TimerWheel.tsx    # Draggable circular timer
│   │   │   └── QuickNoteOverlay.tsx
│   │   ├── reflections/
│   │   │   ├── ReflectionFlow.tsx
│   │   │   ├── ReflectionCard.tsx
│   │   │   └── ReflectionsList.tsx
│   │   ├── home/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── WeeklyFocusCards.tsx
│   │   │   └── RecentActivity.tsx
│   │   ├── archive/
│   │   │   ├── ArchiveList.tsx
│   │   │   └── TrashList.tsx
│   │   └── settings/
│   │       ├── SettingsScreen.tsx
│   │       ├── ExportImport.tsx
│   │       └── ThemeToggle.tsx
│   ├── hooks/
│   │   ├── useGoals.ts
│   │   ├── useInbox.ts
│   │   ├── useSessions.ts
│   │   ├── useTimer.ts
│   │   ├── useTheme.ts
│   │   └── useExportImport.ts
│   ├── utils/
│   │   ├── dateHelpers.ts
│   │   └── trashCleanup.ts
│   ├── types/
│   │   └── index.ts             # All TypeScript interfaces
│   └── styles/
│       └── globals.css          # CSS variables, theme definitions, base styles
├── CLAUDE.md
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

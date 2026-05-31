# Items Data Models

This document defines the domain models needed for the Items feature.

These models use the current project conventions: item contracts belong under `src/domain`, user-visible item names use `title`, categories retain `name`, and lifecycle is expressed as `lifecycleStatus`.

## Design principle

Do not store derived habit stats as the main source of truth.

The source of truth should be:

```txt
Habit definition + scheduleRule + goalConfig + completion logs
```

From those, calculate:

- Last 7 days state.
- Calendar day states.
- Completion percentage.
- Total completions.
- Current streak.
- Best streak.
- Weekly/monthly/yearly chart data.

You can add cached snapshots later for performance, but the cache must not become the truth.

---

## Shared primitive types

```ts
export type ItemLifecycleStatus = "active" | "archived";

export type HabitPriority = "low" | "medium" | "high" | "essential";

export type TaskPriority = "low" | "medium" | "high";

export type ItemType = "habit" | "task" | "recurrent_task";
```

---

## Category

Categories are customizable labels for any user-defined grouping.

Do not add a category `type` field.

```ts
export interface Category {
  id: string;
  userId: string;

  name: string;
  iconName: string;
  colorToken: string;

  order: number;

  lifecycleStatus: ItemLifecycleStatus;

  createdAt: string;
  updatedAt: string;
}
```

---

## Scheduling and goals

Keep the existing codebase separation:

- `scheduleRule` decides which dates are expected.
- `goalConfig` decides what completing the habit means.

```ts
export type HabitScheduleRule =
  | { kind: "daily" }
  | { kind: "specificDaysOfWeek"; daysOfWeek: number[] }
  | { kind: "everyXDays"; intervalDays: number }
  | { kind: "everyXWeeks"; intervalWeeks: number; daysOfWeek: number[] }
  | { kind: "everyXMonths"; intervalMonths: number; dayOfMonth: number }
  | { kind: "firstWeekdayOfMonth"; weekday: number }
  | { kind: "flexiblePeriod" };
```

`flexiblePeriod` is only valid with an existing period-based `goalConfig`. It does not assign missed state to individual empty dates.

Frequency-summary utilities should return translation-ready message descriptors; display strings are added with the Items UI.

---

## Habit

```ts
export interface Habit {
  id: string;
  userId: string;

  title: string;
  description?: string;
  notes?: string;

  categoryId?: string;

  priority: HabitPriority;
  lifecycleStatus: ItemLifecycleStatus;

  scheduleRule: HabitScheduleRule;
  goalConfig: HabitGoalConfig;

  startsOn: string; // YYYY-MM-DD
  endsOn?: string;  // YYYY-MM-DD

  order: number;

  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  inactivityPeriods: HabitInactivityPeriod[];
}
```

```ts
export interface HabitInactivityPeriod {
  reason: "archived" | "paused";
  startsOn: string;  // YYYY-MM-DD, inclusive
  resumesOn?: string; // YYYY-MM-DD, exclusive
}
```

Archive uses `reason = "archived"` in MVP. `paused` is reserved for a future habit pause feature with gentler emotional framing. A same-day archive/reactivation interval is empty.

### Habit completion level

Completion levels for MVP are limited to minimum and standard.
Standard completion always exists. Minimum completion is optional and is only valid when configured for that habit.
For binary habits, the configured minimum is an optional text definition on the binary goal config.
For numeric habits, the configured minimum is the relevant numeric minimum target and must be lower than the standard target.

```ts
export type HabitCompletionLevel = "minimum" | "standard";
```

### Habit completion log

Store completed and skipped dates.

Do not store missed dates for habits. Missed days are derived from the schedule.

```ts
export type HabitLogStatus = "completed" | "skipped";

export interface HabitCompletionLog {
  id: string;
  habitId: string;
  userId: string;

  date: string; // YYYY-MM-DD

  status: HabitLogStatus;

  level?: HabitCompletionLevel;

  amount?: number;
  unit?: HabitTargetUnit;
  customUnit?: string;

  createdAt: string;
  updatedAt: string;
}
```

Persist raw user-entered facts only. Do not persist missed logs, derived minimum/standard period results, or stats snapshots as the source of truth.

### Habit day state

Habit day states are derived for the calendar and last-7-days UI.

```ts
export type HabitDayState =
  | "completed_minimum"
  | "completed_standard"
  | "progress_logged"
  | "today_pending"
  | "missed"
  | "skipped"
  | "not_scheduled"
  | "inactive"
  | "future";
```

Meanings:

- `completed_minimum`: user did enough to keep the habit alive.
- `completed_standard`: user reached the normal target.
- `progress_logged`: user logged quantity/time progress, but not enough to count as a valid completion.
- `today_pending`: scheduled for today and not completed yet.
- `missed`: scheduled in the past and not completed.
- `skipped`: manually skipped and should not punish stats.
- `not_scheduled`: the habit was not expected on that day.
- `inactive`: the habit was archived, or future-paused, on that day and the date is excluded from stats.
- `future`: the date has not happened yet.

---

## Habit stats calculations

### Completion score

For binary habits:

```txt
standard completion = 1.0
minimum completion = 0.5
missed = 0
skipped = excluded from denominator
```

For session-based time/quantity habits:

```txt
if minimum exists:
  amount < minimum = progress_logged, score 0
  minimum <= amount < standard = completed_minimum, score 0.5
  amount >= standard = completed_standard, score 1

if minimum does not exist:
  amount < standard = progress_logged, score 0
  amount >= standard = completed_standard, score 1
```

For period-based time/quantity habits:

```txt
score once per period using the period total.
Logged days in that period use progress_logged, completed_minimum, or completed_standard according to the period result.
Days without logged progress do not become completed just because the period target was reached.
```

If no minimum target exists, never produce `completed_minimum`.

### Completion percentage

For explicit schedules such as daily, specific days, interval, or monthly pattern:

```txt
completion percentage = total completion score / total expected score
```

Where:

- Expected scheduled day = 1 expected point.
- Skipped scheduled day = excluded from denominator.
- Missed scheduled day = 0 points.
- Inactive scheduled day = excluded from the denominator and streak evaluation.

For flexible period schedules:

```txt
completion percentage for period = valid period score / 1
```

If any inactive date overlaps a flexible weekly, monthly, or custom period, omit that period from scoring rather than prorating its target.

Example:

```txt
Habit: 100 reps per week.
Minimum = 50.
Logged 30 = raw progress 30, valid score 0, progress_logged.
Logged 50 = raw progress 50, valid score 0.5, completed_minimum on logged days.
Logged 100 = raw progress 100, valid score 1, completed_standard on logged days.
```

### Total completions

Use two separate ideas:

```ts
export interface HabitStats {
  completionEvents: number; // number of valid completions
  completionScore: number;  // sum of valid completion scores
  expectedScore: number;    // denominator after skipped exclusions
  completionPercentage: number;
  currentStreak: number;
  bestStreak: number;
}
```

For the UI text “completions this week/month/year/total”, use `completionEvents`.

For percentages, use `completionScore / expectedScore`.

### Streak

Suggested MVP streak behavior:

- `completed_minimum` and `completed_standard` count for streak.
- `missed` breaks streak.
- `skipped` does not increment streak, but also does not break it.
- `not_scheduled` does not affect streak.
- `future` does not affect streak.
- For today, if the habit is scheduled but pending, current streak should usually be calculated up to yesterday to avoid punishing the user during the day.

---

## Task

Tasks have no checkbox in the Items list.

```ts
export interface Task {
  id: string;
  userId: string;

  title: string;
  description?: string;
  notes?: string;

  categoryId?: string;

  priority: TaskPriority;
  order: number; // retained for storage compatibility; Items task UI groups by date.
  lifecycleStatus: ItemLifecycleStatus;

  dueDate?: string; // YYYY-MM-DD

  // If true, an undone task remains visible in Today after the date passes.
  carryForward: boolean;

  completedAt?: string;

  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}
```

Completed tasks are not the same as archived tasks:

- Completed means the user did the task.
- Archived means the user wants to hide/keep the task without marking it as done.
- Deleted means real deletion after confirmation.

---

## Recurrent task

```ts
export interface RecurrentTask {
  id: string;
  userId: string;

  title: string;
  description?: string;
  notes?: string;

  categoryId?: string;

  priority: TaskPriority;
  lifecycleStatus: ItemLifecycleStatus;

  recurrenceRule: RecurrenceRule;

  startsOn: string; // YYYY-MM-DD
  endsOn?: string;  // YYYY-MM-DD

  carryForward: boolean;

  order: number;

  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}
```

### Recurrent task occurrence

Recurrent tasks need occurrence logs.

```ts
export type RecurrentTaskOccurrenceStatus =
  | "pending"
  | "completed"
  | "skipped"
  | "missed";

export interface RecurrentTaskOccurrence {
  id: string;
  recurrentTaskId: string;
  userId: string;

  scheduledForDate: string; // YYYY-MM-DD

  status: RecurrentTaskOccurrenceStatus;

  completedAt?: string;
  skippedAt?: string;
  missedAt?: string;

  createdAt: string;
  updatedAt: string;
}
```

### Carry-forward behavior for recurrent tasks

If `carryForward = true`:

- An undone occurrence remains `pending` after its scheduled date.
- The UI can display it as overdue.
- It does not automatically become missed.

If `carryForward = false`:

- An undone occurrence becomes `missed` after its scheduled date passes.
- The next occurrence can be generated normally.

Skipped is always manual.

---

## Optional future cache

Only add this if performance becomes an issue.

```ts
export interface HabitStatsSnapshot {
  habitId: string;

  totalScheduled: number;
  totalCompletionEvents: number;
  totalCompletionScore: number;

  completionPercentage: number;

  currentStreak: number;
  bestStreak: number;

  updatedAt: string;
}
```

This is a cache, not the source of truth.

# Items Data Models

This document defines the domain models needed for the Items feature.

These models are TypeScript-oriented and can be adapted to the current project architecture.

## Design principle

Do not store derived habit stats as the main source of truth.

The source of truth should be:

```txt
Habit definition + frequency rule + completion logs
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
export type ItemStatus = "active" | "archived";

export type HabitPriority = "low" | "medium" | "high" | "essential";

export type TaskPriority = "low" | "medium" | "high";

export type ItemType = "habit" | "task" | "recurrent_task";
```

---

## Category

Categories are customizable and can represent roles, values, areas of life, or any user-defined grouping.

Do not add a category `type` field.

```ts
export interface Category {
  id: string;
  userId: string;

  name: string;
  icon?: string;
  color?: string;

  order: number;

  createdAt: string;
  updatedAt: string;
}
```

---

## Frequency

The frequency model should be flexible enough for the MVP and future growth without using a full recurring-rule system immediately.

```ts
export type FrequencyPeriod = "day" | "week" | "month" | "year";

export type FrequencyMode =
  | "daily"
  | "specific_days"
  | "times_per_period"
  | "interval"
  | "monthly_pattern"
  | "custom";

export type HabitTargetKind = "binary" | "quantity" | "time";

export type HabitTargetUnit =
  | "minutes"
  | "hours"
  | "pages"
  | "reps"
  | "custom";

export interface HabitTarget {
  kind: HabitTargetKind;

  minimumAmount?: number;
  standardAmount?: number;

  unit?: HabitTargetUnit;
  customUnit?: string;
}

export interface FrequencyRule {
  mode: FrequencyMode;

  // Every 2 days, every 3 weeks, every 1 month, etc.
  interval?: number;
  intervalUnit?: "day" | "week" | "month";

  // Monday, Wednesday, Friday, etc.
  // Recommended convention: 0 = Sunday, 1 = Monday, ... 6 = Saturday.
  daysOfWeek?: number[];

  // 3 times per week, 10 times per month, etc.
  times?: number;
  period?: FrequencyPeriod;

  // First Monday of the month, last Friday, etc.
  monthlyPattern?: {
    weekOfMonth: 1 | 2 | 3 | 4 | -1;
    dayOfWeek: number;
  };

  target?: HabitTarget;
}
```

### Supported examples

```ts
const dailyHabit: FrequencyRule = {
  mode: "daily",
  target: { kind: "binary" },
};

const threeTimesPerWeek: FrequencyRule = {
  mode: "times_per_period",
  times: 3,
  period: "week",
  target: { kind: "binary" },
};

const mondayWednesdayFriday: FrequencyRule = {
  mode: "specific_days",
  daysOfWeek: [1, 3, 5],
  target: { kind: "binary" },
};

const everyTwoDays: FrequencyRule = {
  mode: "interval",
  interval: 2,
  intervalUnit: "day",
  target: { kind: "binary" },
};

const englishThirtyMinutes: FrequencyRule = {
  mode: "times_per_period",
  times: 3,
  period: "week",
  target: {
    kind: "time",
    minimumAmount: 5,
    standardAmount: 30,
    unit: "minutes",
  },
};
```

---

## Habit

```ts
export interface Habit {
  id: string;
  userId: string;

  name: string;
  description?: string;
  notes?: string;

  categoryId?: string;

  priority: HabitPriority;
  status: ItemStatus;

  frequency: FrequencyRule;

  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD

  order: number;

  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}
```

### Habit completion level

Remove `deep` for MVP.

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

  // 0 to 1. Used for completion percentage.
  score: number;

  // Whether this log keeps the streak alive.
  countsForStreak: boolean;

  createdAt: string;
  updatedAt: string;
}
```

### Habit day state

Habit day states are derived for the calendar and last-7-days UI.

```ts
export type HabitDayState =
  | "completed_minimum"
  | "completed_standard"
  | "today_pending"
  | "missed"
  | "skipped"
  | "not_scheduled"
  | "future";
```

Meanings:

- `completed_minimum`: user did enough to keep the habit alive.
- `completed_standard`: user reached the normal target.
- `today_pending`: scheduled for today and not completed yet.
- `missed`: scheduled in the past and not completed.
- `skipped`: manually skipped and should not punish stats.
- `not_scheduled`: the habit was not expected on that day.
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

For time/quantity habits:

```txt
score = min(amount / standardAmount, 1)
```

A time/quantity log counts for streak when:

```txt
amount >= minimumAmount
```

If no minimum target exists, use the standard target as the threshold for streak.

### Completion percentage

For explicit schedules such as daily, specific days, interval, or monthly pattern:

```txt
completion percentage = total completion score / total expected score
```

Where:

- Expected scheduled day = 1 expected point.
- Skipped scheduled day = excluded from denominator.
- Missed scheduled day = 0 points.

For flexible `times_per_period` schedules:

```txt
completion percentage for period = min(total score in period / expected times in period, 1)
```

Example:

```txt
Habit: 3 times per week.
Completed standard twice and minimum once.
Score = 1 + 1 + 0.5 = 2.5
Expected = 3
Percentage = 83.3%
```

### Total completions

Use two separate ideas:

```ts
export interface HabitStats {
  completionEvents: number; // number of completed logs
  completionScore: number;  // sum of scores
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

  name: string;
  description?: string;
  notes?: string;

  categoryId?: string;

  priority: TaskPriority;
  status: ItemStatus;

  dueDate?: string; // YYYY-MM-DD

  // If true, an undone task remains visible in Today after the date passes.
  carryForward: boolean;

  completedAt?: string;

  order: number;

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

  name: string;
  description?: string;
  notes?: string;

  categoryId?: string;

  priority: TaskPriority;
  status: ItemStatus;

  frequency: FrequencyRule;

  startDate: string; // YYYY-MM-DD
  endDate?: string;  // YYYY-MM-DD

  carryForward: boolean;

  nextDueDate?: string;
  lastCompletedAt?: string;

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

  scheduledDate: string; // YYYY-MM-DD

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

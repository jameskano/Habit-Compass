import type { HabitDayState } from '@/domain/habits'
import type { HabitPriority } from '@/shared/types'

export const projectColorPalette = {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  border: 'hsl(var(--border))',
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  card: 'hsl(var(--card))',
  cardForeground: 'hsl(var(--card-foreground))',
  primary: 'hsl(var(--primary))',
  primaryForeground: 'hsl(var(--primary-foreground))',
  ring: 'hsl(var(--ring))',
} as const

export const priorityColorPalette: Record<HabitPriority, string> = {
  low: 'bg-slate-400 border-slate-500 text-slate-700',
  medium: 'bg-blue-400 border-blue-500 text-blue-700',
  high: 'bg-orange-400 border-orange-500 text-orange-700',
  essential: 'bg-violet-400 border-violet-500 text-violet-700',
}

export const completionColorPalette: Record<HabitDayState, string> = {
  completed_standard:
    'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950',
  completed_minimum:
    'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/75 dark:text-emerald-100',
  progress_logged:
    'border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-900 dark:bg-sky-950/65 dark:text-sky-200',
  today_pending: 'border-border bg-background text-foreground ring-1 ring-border/70',
  missed:
    'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200',
  skipped:
    'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  future: 'border-transparent bg-muted/25 text-muted-foreground/40',
  not_scheduled: 'border-transparent bg-muted/35 text-muted-foreground/55',
  inactive:
    'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-950/45 dark:text-slate-500',
}

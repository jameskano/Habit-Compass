import { BookOpen, Heart, Tag, type LucideIcon } from 'lucide-react'

import { completionColorPalette, priorityColorPalette } from './colors'

export const priorityVisualClasses = priorityColorPalette

export const categoryVisualClasses: Record<string, string> = {
  emerald:
    'border-emerald-200 bg-emerald-100/75 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  sky: 'border-sky-200 bg-sky-100/75 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
}

export const habitDayStateClasses = completionColorPalette

const categoryIcons: Record<string, LucideIcon> = {
  heart: Heart,
  'book-open': BookOpen,
}

export function getCategoryVisualClasses(colorToken: string) {
  return categoryVisualClasses[colorToken] ?? 'border-border bg-muted/70 text-foreground'
}

export function getCategoryIcon(iconName: string) {
  return categoryIcons[iconName] ?? Tag
}

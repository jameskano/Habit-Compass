import { categoryColorTokens } from '@/domain/categories'
import { getCategoryIconComponent } from '@/features/categories/categoryIconRegistry'

import { completionColorPalette, priorityColorPalette } from './colors'

export const priorityVisualClasses = priorityColorPalette

export const categoryVisualClasses: Record<(typeof categoryColorTokens)[number], string> = {
  tomato:
    'border-red-200 bg-red-100/75 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  coral:
    'border-orange-200 bg-orange-100/75 text-orange-800 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200',
  amber:
    'border-amber-200 bg-amber-100/75 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
  gold: 'border-yellow-200 bg-yellow-100/75 text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200',
  lime: 'border-lime-200 bg-lime-100/75 text-lime-800 dark:border-lime-900 dark:bg-lime-950 dark:text-lime-200',
  grass:
    'border-green-200 bg-green-100/75 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200',
  emerald:
    'border-emerald-200 bg-emerald-100/75 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  mint: 'border-teal-200 bg-teal-100/75 text-teal-800 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-200',
  teal: 'border-teal-200 bg-teal-100/75 text-teal-800 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-200',
  cyan: 'border-cyan-200 bg-cyan-100/75 text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200',
  sky: 'border-sky-200 bg-sky-100/75 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
  blue: 'border-blue-200 bg-blue-100/75 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200',
  indigo:
    'border-indigo-200 bg-indigo-100/75 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200',
  violet:
    'border-violet-200 bg-violet-100/75 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200',
  purple:
    'border-purple-200 bg-purple-100/75 text-purple-800 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-200',
  plum: 'border-fuchsia-200 bg-fuchsia-100/75 text-fuchsia-800 dark:border-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-200',
  fuchsia:
    'border-fuchsia-200 bg-fuchsia-100/75 text-fuchsia-800 dark:border-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-200',
  pink: 'border-pink-200 bg-pink-100/75 text-pink-800 dark:border-pink-900 dark:bg-pink-950 dark:text-pink-200',
  rose: 'border-rose-200 bg-rose-100/75 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200',
  ruby: 'border-red-200 bg-red-100/75 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  slate:
    'border-slate-200 bg-slate-100/75 text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200',
  olive:
    'border-lime-200 bg-lime-100/75 text-lime-900 dark:border-lime-900 dark:bg-lime-950 dark:text-lime-200',
  clay: 'border-stone-200 bg-stone-100/75 text-stone-800 dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200',
  graphite:
    'border-zinc-200 bg-zinc-100/75 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200',
}

export const habitDayStateClasses = completionColorPalette

export const getCategoryVisualClasses = (colorToken: string) => {
  return (
    categoryVisualClasses[colorToken as keyof typeof categoryVisualClasses] ??
    'border-border bg-muted/70 text-foreground'
  )
}

export const getCategoryIcon = (iconName: string) => {
  return getCategoryIconComponent(iconName)
}

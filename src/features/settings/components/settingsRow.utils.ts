import { cn } from '@/shared/utils/cn'

type RowClassNameOptions = {
  disabled: boolean
  interactive: boolean
}

export const getSettingsRowClassName = ({ disabled, interactive }: RowClassNameOptions) =>
  cn(
    'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
    interactive
      ? 'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      : '',
    disabled ? 'cursor-not-allowed opacity-60 hover:bg-transparent' : '',
  )

export const getSettingsRowIconClassName = (destructive: boolean) =>
  cn(
    'grid size-10 shrink-0 place-items-center rounded-lg',
    destructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
  )

export const getSettingsRowLabelClassName = (destructive: boolean) =>
  cn('block font-medium', destructive ? 'text-destructive' : null)

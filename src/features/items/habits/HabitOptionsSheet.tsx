import { Archive, BarChart3, CalendarDays, PencilLine, RotateCcw, Trash2, X } from 'lucide-react'
import { type ComponentType, useEffect } from 'react'
import { useIntl } from 'react-intl'

import type { Habit } from '@/domain/habits'
import { Button } from '@/shared/ui/button'

import type { HabitDangerAction } from './HabitConfirmationDialog'
import type { HabitDetailTab } from './HabitDetail'

type HabitOptionsSheetProps = {
  habit: Habit | null
  archived: boolean
  onClose: () => void
  onOpenDetail: (habit: Habit, tab: HabitDetailTab, dangerAction?: HabitDangerAction) => void
  onArchive: (habit: Habit) => void
}

type MenuItem = {
  id: string
  icon: ComponentType<{ 'aria-hidden'?: boolean; size?: number }>
  action: 'calendar' | 'stats' | 'edit' | 'archive' | 'reset' | 'delete'
  destructive?: boolean
}

const menuItems: MenuItem[] = [
  { id: 'page.items.habit.menu.calendar', icon: CalendarDays, action: 'calendar' },
  { id: 'page.items.habit.menu.stats', icon: BarChart3, action: 'stats' },
  { id: 'page.items.habit.menu.edit', icon: PencilLine, action: 'edit' },
  { id: 'page.items.habit.menu.archive', icon: Archive, action: 'archive' },
  { id: 'page.items.habit.menu.reset', icon: RotateCcw, action: 'reset' },
  { id: 'page.items.habit.menu.delete', icon: Trash2, action: 'delete', destructive: true },
]

export function HabitOptionsSheet({
  habit,
  archived,
  onClose,
  onOpenDetail,
  onArchive,
}: HabitOptionsSheetProps) {
  const intl = useIntl()

  useEffect(() => {
    if (!habit) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [habit, onClose])

  if (!habit) {
    return null
  }

  const handleItem = (action: MenuItem['action']) => {
    if (action === 'calendar') {
      onOpenDetail(habit, 'calendar')
    } else if (action === 'stats' || action === 'edit') {
      onOpenDetail(habit, action)
    } else if (action === 'archive' && !archived) {
      onArchive(habit)
    } else if (action === 'reset' || action === 'delete') {
      onOpenDetail(habit, 'edit', action)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-foreground/35 backdrop-blur-sm" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={intl.formatMessage({ id: 'page.items.habit.menu.title' }, { habit: habit.title })}
        className="w-full rounded-t-[2rem] border border-border/70 bg-background p-5 shadow-2xl md:mx-auto md:mb-8 md:max-w-lg md:rounded-[2rem]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {intl.formatMessage({ id: 'page.items.habit.menu.eyebrow' })}
            </p>
            <h2 className="text-xl font-semibold">{habit.title}</h2>
          </div>
          <Button
            variant="ghost"
            className="h-10 w-10 rounded-full border border-border/70 p-0"
            aria-label={intl.formatMessage({ id: 'action.close' })}
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </div>
        <div role="menu" className="space-y-2">
          {menuItems.map(({ id, icon: Icon, action, destructive }) => {
            const disabled = action === 'archive' && archived
            return (
              <Button
                key={id}
                role="menuitem"
                variant="ghost"
                disabled={disabled}
                onClick={() => handleItem(action)}
                className={`w-full justify-between rounded-xl border border-transparent px-3 ${
                  destructive ? 'text-amber-800 dark:text-amber-200' : ''
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon aria-hidden={true} size={17} />
                  {intl.formatMessage({ id })}
                </span>
                {disabled ? (
                  <span className="text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">
                    {intl.formatMessage({ id: 'page.items.habit.menu.later' })}
                  </span>
                ) : null}
              </Button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

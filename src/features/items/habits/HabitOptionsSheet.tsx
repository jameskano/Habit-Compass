import {
  Archive,
  ArchiveRestore,
  BarChart3,
  CalendarDays,
  PencilLine,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { Fragment, type ComponentType } from 'react'
import { useIntl } from 'react-intl'

import type { Habit } from '@/domain/habits'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'

import type { HabitDangerAction } from './HabitConfirmationDialog'
import type { HabitDetailTab } from './HabitDetail'

type HabitOptionsSheetProps = {
  habit: Habit | null
  archived: boolean
  onClose: () => void
  onOpenDetail: (habit: Habit, tab: HabitDetailTab, dangerAction?: HabitDangerAction) => void
  onArchive: (habit: Habit) => void
  onReactivate: (habit: Habit) => void
}

type MenuItem = {
  id: string
  icon: ComponentType<{ 'aria-hidden'?: boolean; size?: number }>
  action: 'calendar' | 'stats' | 'edit' | 'archive' | 'reactivate' | 'reset' | 'delete'
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

const archivedMenuItems: MenuItem[] = [
  { id: 'page.items.habit.menu.calendar', icon: CalendarDays, action: 'calendar' },
  { id: 'page.items.habit.menu.stats', icon: BarChart3, action: 'stats' },
  { id: 'page.items.habit.menu.reactivate', icon: ArchiveRestore, action: 'reactivate' },
  { id: 'page.items.habit.menu.delete', icon: Trash2, action: 'delete', destructive: true },
]

export const HabitOptionsSheet = ({
  habit,
  archived,
  onClose,
  onOpenDetail,
  onArchive,
  onReactivate,
}: HabitOptionsSheetProps) => {
  const intl = useIntl()

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
    } else if (action === 'reactivate' && archived) {
      onReactivate(habit)
    } else if (action === 'reset' || action === 'delete') {
      onOpenDetail(habit, archived ? 'calendar' : 'edit', action)
    }
  }

  return (
    <Sheet
      open={Boolean(habit)}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <SheetContent
        aria-label={intl.formatMessage(
          { id: 'page.items.habit.menu.title' },
          { habit: habit.title },
        )}
        aria-describedby={undefined}
        className="animate-[habit-sheet-in_300ms_ease-out] w-full rounded-t-[2rem] border border-border/70 bg-background p-5 shadow-2xl motion-reduce:animate-none md:mx-auto md:mb-8 md:max-w-lg md:rounded-[2rem]"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <SheetTitle className="sr-only">
            {intl.formatMessage({ id: 'page.items.habit.menu.title' }, { habit: habit.title })}
          </SheetTitle>
          <h2 className="text-xl font-semibold">{habit.title}</h2>
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
          {(archived ? archivedMenuItems : menuItems).map(
            ({ id, icon: Icon, action, destructive }, index) => {
              return (
                <Fragment key={id}>
                  {index === (archived ? 2 : 3) ? (
                    <hr className="my-3 border-border/70" aria-hidden="true" />
                  ) : null}
                  <Button
                    role="menuitem"
                    variant="ghost"
                    onClick={() => handleItem(action)}
                    className={`w-full justify-between rounded-xl border border-transparent px-3 ${
                      destructive ? 'text-amber-800 dark:text-amber-200' : ''
                    }`}
                  >
                    <span className="inline-flex items-center gap-3">
                      <Icon aria-hidden={true} size={17} />
                      {intl.formatMessage({ id })}
                    </span>
                  </Button>
                </Fragment>
              )
            },
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

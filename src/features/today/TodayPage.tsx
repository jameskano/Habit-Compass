import { formatISO, parseISO } from 'date-fns'
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eraser,
  RotateCcw,
  Search,
  SkipForward,
  Undo2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useIntl } from 'react-intl'

import {
  evaluateHabitCompletionForLogs,
  getHabitAmountInputMetadata,
  getHabitFrequencySummary,
  getHabitLogAmount,
  getHabitMinimumTargetValue,
  type Habit,
  type HabitDayOfWeek,
  type HabitLog,
} from '@/domain/habits'
import {
  buildTodayItems,
  filterTodayItems,
  getSourceItemId,
  getTodayDateMode,
  isMeasurableHabit,
  mergeTodayManualOrder,
  type HabitTodayState,
  type TodayFilterState,
  type TodayItem,
} from '@/domain/today'
import {
  getRecurrentFrequencySummary,
  type DayOfWeek,
  type RecurrentTask,
} from '@/domain/recurrent-tasks'
import type { Task } from '@/domain/tasks'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import {
  useRemoveHabitLogMutation,
  useUpsertHabitLogMutation,
} from '@/features/habits/hooks/useHabitLogMutations'
import { useTodayHabitsQuery } from '@/features/habits/hooks/useTodayHabitsQuery'
import { HabitAmountInputSheet } from '@/features/items/habits/HabitAmountInputSheet'
import { HabitDetail, type HabitDetailTab } from '@/features/items/habits/HabitDetail'
import type { HabitDangerAction } from '@/features/items/habits/HabitConfirmationDialog'
import {
  calendarDateToISODate,
  isoDateToCalendarDate,
} from '@/features/items/components/datePickerUtils'
import { RecurrentTaskEdit } from '@/features/items/recurrent-tasks/RecurrentTaskEdit'
import { TaskEdit } from '@/features/items/tasks/TaskEdit'
import { useCompleteRecurrentOccurrenceMutation } from '@/features/recurrent-tasks/hooks/useRecurrentTaskMutations'
import { useTodayRecurrentTasksQuery } from '@/features/recurrent-tasks/hooks/useTodayRecurrentTasksQuery'
import { useCompleteTaskMutation } from '@/features/tasks/hooks/useTaskMutations'
import { useTodayTasksQuery } from '@/features/tasks/hooks/useTodayTasksQuery'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { HabitPriority, ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Calendar } from '@/shared/ui/calendar'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Input } from '@/shared/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { cn } from '@/shared/utils/cn'

import { SortableItemsList } from '../items/components/SortableItemsList'
import { TodayActionSheet, type TodayMenuAction } from './TodayActionSheet'
import { TodayItemCard } from './TodayItemCard'
import { useTodayOrderStore } from './todayOrderStore'

type Intl = ReturnType<typeof useIntl>

type DetailSelection = {
  habitId: string
  tab: HabitDetailTab
  dangerAction?: HabitDangerAction
}

const todayTypeFilters: { type: TodayFilterState['type']; labelId: string }[] = [
  { type: 'all', labelId: 'page.today.filter.all' },
  { type: 'habit', labelId: 'page.today.filter.habits' },
  { type: 'task', labelId: 'page.today.filter.tasks' },
]

const allCategoriesValue = '__all__'
const allPrioritiesValue = '__all__'
const priorities: HabitPriority[] = ['essential', 'high', 'medium', 'low']
const emptyTodayOrder: string[] = []
const emptyHabitLogs: HabitLog[] = []

function todayAsISODate() {
  return formatISO(new Date(), { representation: 'date' }) as ISODateString
}

function shiftISODate(date: ISODateString, amount: number) {
  const current = isoDateToCalendarDate(date)
  if (!current) {
    return date
  }
  current.setDate(current.getDate() + amount)
  return calendarDateToISODate(current) as ISODateString
}

function formatWeekdays(intl: Intl, days: readonly HabitDayOfWeek[] | readonly DayOfWeek[]) {
  return intl.formatList(
    days.map((day) => intl.formatMessage({ id: `page.items.weekday.short.${day}` })),
  )
}

function formatHabitFrequency(intl: Intl, habit: Habit) {
  const descriptor = getHabitFrequencySummary(habit.scheduleRule)

  if (
    habit.scheduleRule.kind === 'flexiblePeriod' &&
    habit.goalConfig.trackingType === 'timesPerPeriod'
  ) {
    return intl.formatMessage(
      { id: 'items.frequency.timesPerPeriod' },
      {
        count: habit.goalConfig.targetCount,
        period: intl.formatMessage({ id: `items.period.${habit.goalConfig.period}` }),
      },
    )
  }

  if (habit.scheduleRule.kind === 'specificDaysOfWeek') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { days: formatWeekdays(intl, habit.scheduleRule.daysOfWeek) },
    )
  }

  if (habit.scheduleRule.kind === 'everyXWeeks') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      {
        count: habit.scheduleRule.intervalWeeks,
        days: formatWeekdays(intl, habit.scheduleRule.daysOfWeek),
      },
    )
  }

  if (habit.scheduleRule.kind === 'firstWeekdayOfMonth') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      {
        weekday: intl.formatMessage({
          id: `page.items.weekday.long.${habit.scheduleRule.weekday}`,
        }),
      },
    )
  }

  return intl.formatMessage({ id: descriptor.messageId }, descriptor.values)
}

function formatRecurrentFrequency(intl: Intl, task: RecurrentTask) {
  const descriptor = getRecurrentFrequencySummary(task.recurrenceRule)
  const rule = task.recurrenceRule

  if (rule.kind === 'specificDaysOfWeek') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { days: formatWeekdays(intl, rule.daysOfWeek) },
    )
  }
  if (rule.kind === 'everyXWeeks') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { count: rule.intervalWeeks, days: formatWeekdays(intl, rule.daysOfWeek) },
    )
  }
  if (rule.kind === 'firstWeekdayOfMonth') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { weekday: intl.formatMessage({ id: `page.items.weekday.long.${rule.weekday}` }) },
    )
  }

  return intl.formatMessage({ id: descriptor.messageId }, descriptor.values)
}

function formatTaskMeta(intl: Intl, task: Task, selectedDate: ISODateString) {
  if (task.dueDate && task.dueDate < selectedDate && task.completionStatus === 'pending') {
    const formattedDate = intl.formatDate(parseISO(task.dueDate), {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
    return intl.formatMessage({ id: 'page.today.item.task.overdue' }, { date: formattedDate })
  }

  return intl.formatMessage({ id: 'page.today.item.task.today' })
}

function shortUnitLabel(intl: Intl, habit: Habit) {
  const metadata = getHabitAmountInputMetadata(habit)
  if (!metadata) {
    return ''
  }
  if (metadata.unit === 'minutes') {
    return intl.formatMessage({ id: 'page.today.amount.unit.minutes.short' })
  }
  if (metadata.unit === 'repetitions') {
    return intl.formatMessage({ id: 'page.today.amount.unit.repetitions.short' })
  }
  return metadata.quantityUnitLabel ?? ''
}

function amountText(intl: Intl, item: TodayItem) {
  if (item.type !== 'habit' || !item.amount || item.amount <= 0) {
    return null
  }
  const unit = shortUnitLabel(intl, item.habit)
  return unit ? `${item.amount} ${unit}` : `${item.amount}`
}

function amountHelperLines(
  intl: Intl,
  habit: Habit,
  logs: HabitLog[],
  selectedDate: ISODateString,
) {
  const completion = evaluateHabitCompletionForLogs({ habit, logs, date: selectedDate })
  const labelId =
    'period' in habit.goalConfig && habit.goalConfig.period !== 'day'
      ? `page.today.amount.period.${habit.goalConfig.period}`
      : 'page.today.amount.period.day'
  const unit = shortUnitLabel(intl, habit)
  const value = unit
    ? `${completion.rawProgressValue} / ${completion.standardTargetValue} ${unit}`
    : `${completion.rawProgressValue} / ${completion.standardTargetValue}`
  const lines = [
    intl.formatMessage(
      { id: 'page.today.amount.progress' },
      {
        period: intl.formatMessage({ id: labelId }),
        value,
      },
    ),
  ]
  const minimum = getHabitMinimumTargetValue(habit)
  if (minimum !== null) {
    lines.push(
      intl.formatMessage(
        { id: 'page.today.amount.minimum' },
        { value: unit ? `${minimum} ${unit}` : `${minimum}` },
      ),
    )
  }
  return lines
}

function selectedDateLabel(intl: Intl, date: ISODateString) {
  return intl.formatDate(parseISO(date), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function canModify(dateMode: ReturnType<typeof getTodayDateMode>) {
  return dateMode === 'today' || dateMode === 'past'
}

export function TodayPage() {
  const intl = useIntl()
  const appToast = useAppToast()
  const actualToday = todayAsISODate()
  const [selectedDate, setSelectedDate] = useState<ISODateString>(actualToday)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filters, setFilters] = useState<TodayFilterState>({
    type: 'all',
    categoryId: '',
    priority: '',
    searchText: '',
  })
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string | null>(null)
  const [detailSelection, setDetailSelection] = useState<DetailSelection | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedRecurrentTaskId, setSelectedRecurrentTaskId] = useState<string | null>(null)
  const [amountHabitId, setAmountHabitId] = useState<string | null>(null)
  const orderForDate = useTodayOrderStore(
    (state) => state.ordersByDate[selectedDate] ?? emptyTodayOrder,
  )
  const setOrderForDate = useTodayOrderStore((state) => state.setOrderForDate)
  const pruneOrderForDate = useTodayOrderStore((state) => state.pruneOrderForDate)
  const categoriesQuery = useCategoriesQuery()
  const habitsQuery = useTodayHabitsQuery(undefined, selectedDate)
  const tasksQuery = useTodayTasksQuery(undefined, selectedDate)
  const recurrentQuery = useTodayRecurrentTasksQuery(undefined, selectedDate)
  const upsertHabitLogMutation = useUpsertHabitLogMutation()
  const removeHabitLogMutation = useRemoveHabitLogMutation()
  const completeTaskMutation = useCompleteTaskMutation()
  const completeRecurrentMutation = useCompleteRecurrentOccurrenceMutation()
  const dateMode = getTodayDateMode(selectedDate, actualToday)
  const completionEnabled = canModify(dateMode)
  const habitLogs = habitsQuery.data?.logs ?? emptyHabitLogs

  const rawItems = useMemo(
    () =>
      buildTodayItems({
        habits: habitsQuery.data?.habits ?? [],
        habitLogs,
        tasks: tasksQuery.data?.tasks ?? [],
        recurrentTasks: recurrentQuery.data?.tasks ?? [],
        recurrentOccurrences: recurrentQuery.data?.occurrences ?? [],
        selectedDate,
        today: actualToday,
      }),
    [
      actualToday,
      habitLogs,
      habitsQuery.data?.habits,
      recurrentQuery.data?.occurrences,
      recurrentQuery.data?.tasks,
      selectedDate,
      tasksQuery.data?.tasks,
    ],
  )
  const orderedItems = useMemo(
    () => mergeTodayManualOrder(rawItems, orderForDate),
    [orderForDate, rawItems],
  )
  const visibleItems = useMemo(
    () => filterTodayItems(orderedItems, filters),
    [filters, orderedItems],
  )
  const categoriesById = new Map(
    (categoriesQuery.data ?? []).map((category) => [category.id, category]),
  )
  const selectedMenuItem = orderedItems.find((item) => item.id === selectedMenuItemId) ?? null
  const selectedHabitForAmount =
    (habitsQuery.data?.habits ?? []).find((habit) => habit.id === amountHabitId) ?? null
  const selectedTask =
    (tasksQuery.data?.tasks ?? []).find((task) => task.id === selectedTaskId) ?? null
  const selectedRecurrentTask =
    (recurrentQuery.data?.tasks ?? []).find((task) => task.id === selectedRecurrentTaskId) ?? null
  const detailHabit =
    (habitsQuery.data?.habits ?? []).find((habit) => habit.id === detailSelection?.habitId) ?? null
  const activeCategories = (categoriesQuery.data ?? []).filter(
    (category) => category.lifecycleStatus === 'active',
  )
  const isLoading =
    habitsQuery.isLoading ||
    tasksQuery.isLoading ||
    recurrentQuery.isLoading ||
    categoriesQuery.isLoading
  const isError =
    habitsQuery.isError || tasksQuery.isError || recurrentQuery.isError || categoriesQuery.isError
  const hasFilters =
    filters.type !== 'all' ||
    filters.categoryId.length > 0 ||
    filters.priority.length > 0 ||
    filters.searchText.trim().length > 0

  useEffect(() => {
    pruneOrderForDate(
      selectedDate,
      rawItems.map((item) => item.id),
    )
  }, [pruneOrderForDate, rawItems, selectedDate])

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus()
    }
  }, [searchOpen])

  const closeMenu = () => setSelectedMenuItemId(null)
  const closeSearch = () => {
    setFilters((current) => ({ ...current, searchText: '' }))
    setSearchOpen(false)
  }

  const upsertHabitCompleted = (habit: Habit, completionLevel?: 'minimum' | 'standard') => {
    upsertHabitLogMutation.mutate({
      habitId: habit.id,
      logDate: selectedDate,
      status: 'completed',
      completionLevel,
    })
  }

  const skipHabit = (habit: Habit) => {
    upsertHabitLogMutation.mutate({
      habitId: habit.id,
      logDate: selectedDate,
      status: 'skipped',
    })
  }

  const clearHabitLog = (habit: Habit) => {
    removeHabitLogMutation.mutate({ habitId: habit.id, logDate: selectedDate })
  }

  const toggleTask = (task: Task) => {
    const nextStatus = task.completionStatus === 'completed' ? 'pending' : 'completed'
    completeTaskMutation.mutate(
      { taskId: task.id, status: nextStatus },
      {
        onSuccess: () => {
          appToast.success({
            id:
              nextStatus === 'completed'
                ? 'page.today.toast.task.completed'
                : 'page.today.toast.task.pending',
            values: { task: task.title },
          })
        },
      },
    )
  }

  const toggleRecurrentTask = (item: Extract<TodayItem, { type: 'recurrentTask' }>) => {
    const nextStatus = item.occurrence.status === 'completed' ? 'pending' : 'completed'
    completeRecurrentMutation.mutate(
      {
        recurrentTaskId: item.task.id,
        occurrenceDate: selectedDate,
        status: nextStatus,
      },
      {
        onSuccess: () => {
          appToast.success({
            id:
              nextStatus === 'completed'
                ? 'page.today.toast.recurrent.completed'
                : 'page.today.toast.recurrent.pending',
          })
        },
      },
    )
  }

  const runPrimaryAction = (item: TodayItem) => {
    if (!completionEnabled) {
      return
    }

    if (item.type === 'habit') {
      if (isMeasurableHabit(item.habit)) {
        setAmountHabitId(item.habit.id)
        return
      }

      if (item.log?.status === 'completed') {
        clearHabitLog(item.habit)
      } else {
        upsertHabitCompleted(item.habit, 'standard')
      }
      return
    }

    if (item.type === 'task') {
      toggleTask(item.task)
      return
    }

    toggleRecurrentTask(item)
  }

  const openHabitDetail = (habit: Habit, tab: HabitDetailTab, dangerAction?: HabitDangerAction) => {
    closeMenu()
    setDetailSelection({ habitId: habit.id, tab, dangerAction })
  }

  const menuActionsForItem = (item: TodayItem | null): TodayMenuAction[] => {
    if (!item) {
      return []
    }

    const run = (action: () => void) => () => {
      closeMenu()
      action()
    }

    if (item.type === 'habit') {
      const habit = item.habit
      const isFuture = dateMode === 'future'
      const minimumEnabled = habit.enabledCompletionLevels.includes('minimum')
      const nonCompletionActions: TodayMenuAction[] = [
        {
          labelId: 'page.items.habit.menu.stats',
          icon: BarChart3,
          dividerBefore: !isFuture,
          onSelect: () => openHabitDetail(habit, 'stats'),
        },
        {
          labelId: 'page.items.habit.menu.edit',
          icon: Edit3,
          onSelect: () => openHabitDetail(habit, 'edit'),
        },
        {
          labelId: 'page.items.habit.menu.reset',
          icon: RotateCcw,
          onSelect: () => openHabitDetail(habit, 'edit', 'reset'),
        },
      ]

      if (isFuture) {
        return nonCompletionActions
      }

      const state = item.state as HabitTodayState
      if (isMeasurableHabit(habit)) {
        const completionActions =
          state === 'skipped'
            ? [
                {
                  labelId: 'page.today.menu.habit.enterAmount',
                  icon: Check,
                  onSelect: run(() => setAmountHabitId(habit.id)),
                },
                {
                  labelId: 'page.today.menu.habit.undoSkip',
                  icon: Undo2,
                  onSelect: run(() => clearHabitLog(habit)),
                },
              ]
            : state === 'undone'
              ? [
                  {
                    labelId: 'page.today.menu.habit.enterAmount',
                    icon: Check,
                    onSelect: run(() => setAmountHabitId(habit.id)),
                  },
                  {
                    labelId: 'page.today.menu.habit.skip',
                    icon: SkipForward,
                    onSelect: run(() => skipHabit(habit)),
                  },
                ]
              : [
                  {
                    labelId: 'page.today.menu.habit.editAmount',
                    icon: Edit3,
                    onSelect: run(() => setAmountHabitId(habit.id)),
                  },
                  {
                    labelId: 'page.today.menu.habit.clearAmount',
                    icon: Eraser,
                    onSelect: run(() => clearHabitLog(habit)),
                  },
                  {
                    labelId: 'page.today.menu.habit.skip',
                    icon: SkipForward,
                    onSelect: run(() => skipHabit(habit)),
                  },
                ]

        return [...completionActions, ...nonCompletionActions]
      }

      const completeStandard = {
        labelId:
          state === 'minimumCompleted'
            ? 'page.today.menu.habit.completeStandard'
            : 'page.today.menu.habit.complete',
        icon: Check,
        onSelect: run(() => upsertHabitCompleted(habit, 'standard')),
      }
      const completeMinimum = {
        labelId: 'page.today.menu.habit.completeMinimum',
        icon: Check,
        onSelect: run(() => upsertHabitCompleted(habit, 'minimum')),
      }
      const undoCompletion = {
        labelId: 'page.today.menu.habit.undoCompletion',
        icon: Undo2,
        onSelect: run(() => clearHabitLog(habit)),
      }
      const skip = {
        labelId: 'page.today.menu.habit.skip',
        icon: SkipForward,
        onSelect: run(() => skipHabit(habit)),
      }
      const undoSkip = {
        labelId: 'page.today.menu.habit.undoSkip',
        icon: Undo2,
        onSelect: run(() => clearHabitLog(habit)),
      }

      if (state === 'standardCompleted') {
        return [
          undoCompletion,
          ...(minimumEnabled ? [completeMinimum] : []),
          skip,
          ...nonCompletionActions,
        ]
      }
      if (state === 'minimumCompleted') {
        return [completeStandard, undoCompletion, skip, ...nonCompletionActions]
      }
      if (state === 'skipped') {
        return [
          completeStandard,
          ...(minimumEnabled ? [completeMinimum] : []),
          undoSkip,
          ...nonCompletionActions,
        ]
      }
      return [
        completeStandard,
        ...(minimumEnabled ? [completeMinimum] : []),
        skip,
        ...nonCompletionActions,
      ]
    }

    const isDone =
      item.type === 'task'
        ? item.task.completionStatus === 'completed'
        : item.occurrence.status === 'completed'
    const editAction = {
      labelId: 'page.today.menu.item.edit',
      icon: Edit3,
      dividerBefore: dateMode !== 'future',
      onSelect: run(() => {
        if (item.type === 'task') {
          setSelectedTaskId(item.task.id)
        } else {
          setSelectedRecurrentTaskId(item.task.id)
        }
      }),
    }

    if (dateMode === 'future') {
      return [editAction]
    }

    return [
      {
        labelId: isDone ? 'page.today.menu.item.markPending' : 'page.today.menu.item.markDone',
        icon: isDone ? Undo2 : Check,
        onSelect: run(() => {
          if (item.type === 'task') {
            toggleTask(item.task)
          } else {
            toggleRecurrentTask(item)
          }
        }),
      },
      editAction,
    ]
  }

  const reorderTodayItems = (visibleOrderedIds: string[]) => {
    const visibleIds = new Set(visibleOrderedIds)
    let visibleIndex = 0
    const nextOrder = orderedItems.map((item) =>
      visibleIds.has(item.id) ? visibleOrderedIds[visibleIndex++] : item.id,
    )
    setOrderForDate(selectedDate, nextOrder)
  }

  if (isLoading) {
    return (
      <section className="space-y-6">
        <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
      </section>
    )
  }

  if (isError) {
    return (
      <section className="space-y-6">
        <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[1.35rem] border border-border/70 bg-card/65 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full min-w-0 items-center gap-2 sm:flex-1">
          <Button
            type="button"
            variant="ghost"
            className="size-10 shrink-0 rounded-full border border-border/70 p-0 text-muted-foreground"
            aria-label={intl.formatMessage({ id: 'page.today.action.previousDay' })}
            onClick={() => setSelectedDate((current) => shiftISODate(current, -1))}
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </Button>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-auto min-w-0 flex-1 justify-start rounded-2xl border border-transparent px-3 py-2 text-left hover:border-border/70 hover:bg-background/60"
              >
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-snug">
                    {selectedDateLabel(intl, selectedDate)}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {intl.formatMessage({ id: `page.today.dateMode.${dateMode}` })}
                  </span>
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto">
              <Calendar
                mode="single"
                selected={isoDateToCalendarDate(selectedDate)}
                defaultMonth={isoDateToCalendarDate(selectedDate)}
                onSelect={(date) => {
                  if (!date) {
                    return
                  }
                  setSelectedDate(calendarDateToISODate(date) as ISODateString)
                  setDatePickerOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="ghost"
            className="size-10 shrink-0 rounded-full border border-border/70 p-0 text-muted-foreground"
            aria-label={intl.formatMessage({ id: 'page.today.action.nextDay' })}
            onClick={() => setSelectedDate((current) => shiftISODate(current, 1))}
          >
            <ChevronRight aria-hidden="true" size={18} />
          </Button>
        </div>
        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
          {selectedDate !== actualToday ? (
            <Button
              type="button"
              variant="ghost"
              className="size-10 rounded-full border border-border/70 p-0 text-muted-foreground"
              aria-label={intl.formatMessage({ id: 'page.today.action.today' })}
              onClick={() => setSelectedDate(actualToday)}
            >
              <CalendarCheck aria-hidden="true" size={18} />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className={cn(
              'size-10 rounded-full border border-border/70 p-0 text-muted-foreground',
              datePickerOpen && 'border-primary bg-primary/15 text-primary',
            )}
            aria-label={intl.formatMessage({ id: 'page.today.action.chooseDate' })}
            onClick={() => setDatePickerOpen(true)}
          >
            <CalendarDays aria-hidden="true" size={18} />
          </Button>
        </div>
      </div>

      <section
        className="space-y-3 rounded-[1.35rem] border border-border/70 bg-card/65 p-3"
        aria-label={intl.formatMessage({ id: 'page.today.filters.aria' })}
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {todayTypeFilters.map((filter) => (
            <Button
              key={filter.type}
              type="button"
              variant="ghost"
              className={cn(
                'h-9 shrink-0 rounded-full border border-border/70 px-3 text-sm text-muted-foreground',
                filters.type === filter.type &&
                  'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
              )}
              aria-pressed={filters.type === filter.type}
              onClick={() => setFilters((current) => ({ ...current, type: filter.type }))}
            >
              {intl.formatMessage({ id: filter.labelId })}
            </Button>
          ))}
          <div
            className={cn(
              'shrink-0 transition-[width] duration-200 ease-out motion-reduce:transition-none',
              searchOpen ? 'w-[min(13rem,48vw)]' : 'w-9',
            )}
          >
            {searchOpen ? (
              <div className="relative flex h-9 items-center rounded-full border border-border/70 bg-background">
                <Search
                  aria-hidden="true"
                  size={16}
                  className="absolute left-3 text-muted-foreground"
                />
                <Input
                  ref={searchInputRef}
                  value={filters.searchText}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, searchText: event.target.value }))
                  }
                  aria-label={intl.formatMessage({ id: 'page.today.filter.search' })}
                  placeholder={intl.formatMessage({ id: 'page.today.filter.searchPlaceholder' })}
                  className="h-full min-w-0 flex-1 rounded-full border-0 bg-transparent py-2 pl-9 pr-9 shadow-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute right-1.5 h-7 min-h-7 w-7 rounded-full p-0 text-muted-foreground"
                  aria-label={intl.formatMessage({ id: 'action.close' })}
                  onClick={closeSearch}
                >
                  <X aria-hidden="true" size={15} />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-9 rounded-full border border-border/70 p-0 text-muted-foreground"
                aria-label={intl.formatMessage({ id: 'page.today.action.search' })}
                onClick={() => setSearchOpen(true)}
              >
                <Search aria-hidden="true" size={18} />
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Select
            value={filters.categoryId || allCategoriesValue}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                categoryId: value === allCategoriesValue ? '' : value,
              }))
            }
          >
            <SelectTrigger
              aria-label={intl.formatMessage({ id: 'page.today.filter.category' })}
              className="rounded-xl border-border/75"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allCategoriesValue}>
                {intl.formatMessage({ id: 'page.today.filter.allCategories' })}
              </SelectItem>
              {activeCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.priority || allPrioritiesValue}
            onValueChange={(value) =>
              setFilters((current) => ({
                ...current,
                priority: value === allPrioritiesValue ? '' : (value as HabitPriority),
              }))
            }
          >
            <SelectTrigger
              aria-label={intl.formatMessage({ id: 'page.today.filter.priority' })}
              className="rounded-xl border-border/75"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={allPrioritiesValue}>
                {intl.formatMessage({ id: 'page.today.filter.allPriorities' })}
              </SelectItem>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {intl.formatMessage({ id: `page.items.priority.${priority}` })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {visibleItems.length === 0 ? (
        <EmptyState
          titleId={
            filters.searchText.trim().length > 0
              ? 'page.today.empty.search.title'
              : selectedDate === actualToday
                ? 'page.today.empty.today.title'
                : 'page.today.empty.date.title'
          }
          descriptionId={
            filters.searchText.trim().length > 0
              ? 'page.today.empty.search.description'
              : selectedDate === actualToday
                ? 'page.today.empty.today.description'
                : 'page.today.empty.date.description'
          }
        />
      ) : (
        <SortableItemsList
          items={visibleItems}
          group={`today-${selectedDate}`}
          reorderLabelId="page.today.action.reorder"
          onReorder={reorderTodayItems}
          revealCards={false}
        >
          {(item) => {
            const sourceId = getSourceItemId(item)
            const category = item.categoryId ? categoriesById.get(item.categoryId) : undefined
            const fallbackCategoryLabel = intl.formatMessage({
              id:
                item.type === 'habit'
                  ? 'page.items.habit.category.none'
                  : item.type === 'task'
                    ? 'page.items.task.category.none'
                    : 'page.items.recurrent.category.none',
            })
            const meta =
              item.type === 'habit'
                ? formatHabitFrequency(intl, item.habit)
                : item.type === 'task'
                  ? formatTaskMeta(intl, item.task, selectedDate)
                  : formatRecurrentFrequency(intl, item.task)

            return (
              <TodayItemCard
                type={item.type}
                title={item.title}
                amountText={amountText(intl, item)}
                meta={meta}
                category={category}
                fallbackCategoryLabel={fallbackCategoryLabel}
                priority={item.priority}
                priorityLabel={`${intl.formatMessage({ id: 'page.today.item.priority' })}: ${intl.formatMessage({ id: `page.items.priority.${item.priority}` })}`}
                state={item.state}
                disabled={!completionEnabled}
                onPrimaryAction={() => runPrimaryAction(item)}
                onOpenMenu={() => setSelectedMenuItemId(item.id)}
                key={`${item.type}:${sourceId}`}
              />
            )
          }}
        </SortableItemsList>
      )}

      <TodayActionSheet
        title={selectedMenuItem?.title ?? ''}
        open={Boolean(selectedMenuItem)}
        actions={menuActionsForItem(selectedMenuItem)}
        onClose={closeMenu}
      />

      {selectedHabitForAmount ? (
        <HabitAmountInputSheet
          habit={selectedHabitForAmount}
          date={amountHabitId ? selectedDate : null}
          initialAmount={getHabitLogAmount(
            selectedHabitForAmount,
            habitLogs.find(
              (log) =>
                log.habitId === selectedHabitForAmount.id && log.loggedForDate === selectedDate,
            ),
          )}
          metadata={getHabitAmountInputMetadata(selectedHabitForAmount)!}
          helperLines={amountHelperLines(intl, selectedHabitForAmount, habitLogs, selectedDate)}
          pending={upsertHabitLogMutation.isPending || removeHabitLogMutation.isPending}
          onClose={() => setAmountHabitId(null)}
          onSave={(amount) => {
            const metadata = getHabitAmountInputMetadata(selectedHabitForAmount)
            if (!metadata) {
              return
            }
            if (amount <= 0) {
              removeHabitLogMutation.mutate(
                { habitId: selectedHabitForAmount.id, logDate: selectedDate },
                { onSuccess: () => setAmountHabitId(null) },
              )
              return
            }
            upsertHabitLogMutation.mutate(
              {
                habitId: selectedHabitForAmount.id,
                logDate: selectedDate,
                status: 'completed',
                value: amount,
                unit: metadata.unit,
              },
              { onSuccess: () => setAmountHabitId(null) },
            )
          }}
        />
      ) : null}

      {detailHabit && detailSelection ? (
        <HabitDetail
          key={`${detailHabit.id}:${detailSelection.tab}:${detailSelection.dangerAction ?? ''}`}
          habit={detailHabit}
          categories={categoriesQuery.data ?? []}
          initialTab={detailSelection.tab}
          initialDangerAction={detailSelection.dangerAction}
          today={actualToday}
          onClose={() => setDetailSelection(null)}
          onArchived={(habit) => {
            setDetailSelection(null)
            appToast.success({ id: 'page.items.habit.archived', values: { habit: habit.title } })
          }}
          onDeleted={(habit) => {
            setDetailSelection(null)
            appToast.success({ id: 'page.items.habit.deleted', values: { habit: habit.title } })
          }}
        />
      ) : null}

      {selectedTask ? (
        <TaskEdit
          task={selectedTask}
          categories={categoriesQuery.data ?? []}
          onClose={() => setSelectedTaskId(null)}
          onArchived={(task) => {
            setSelectedTaskId(null)
            appToast.success({ id: 'page.items.task.archived', values: { task: task.title } })
          }}
          onDeleted={(task) => {
            setSelectedTaskId(null)
            appToast.success({ id: 'page.items.task.deleted', values: { task: task.title } })
          }}
        />
      ) : null}

      {selectedRecurrentTask ? (
        <RecurrentTaskEdit
          task={selectedRecurrentTask}
          categories={categoriesQuery.data ?? []}
          today={actualToday}
          onClose={() => setSelectedRecurrentTaskId(null)}
          onArchived={(task) => {
            setSelectedRecurrentTaskId(null)
            appToast.success({ id: 'page.items.recurrent.archived', values: { task: task.title } })
          }}
          onDeleted={(task) => {
            setSelectedRecurrentTaskId(null)
            appToast.success({ id: 'page.items.recurrent.deleted', values: { task: task.title } })
          }}
        />
      ) : null}

      {hasFilters ? (
        <span className="sr-only">{intl.formatMessage({ id: 'page.today.filters.active' })}</span>
      ) : null}
    </section>
  )
}

import { useState } from 'react'
import { useIntl } from 'react-intl'

import { getHabitAmountInputMetadata, getHabitLogAmount } from '@/domain/habits'
import { getTodayDateMode, type TodayFilterState } from '@/domain/today'
import { HabitAmountInputSheet } from '@/features/items/habits/HabitAmountInputSheet'
import { HabitDetail } from '@/features/items/habits/HabitDetail'
import { RecurrentTaskEdit } from '@/features/items/recurrent-tasks/RecurrentTaskEdit'
import { TaskEdit } from '@/features/items/tasks/TaskEdit'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { ISODateString } from '@/shared/types'
import { EmptyState } from '@/shared/ui/EmptyState'

import { TodayActionSheet } from './TodayActionSheet'
import { TodayDateNavigator } from './TodayDateNavigator'
import { TodayFilters } from './TodayFilters'
import { TodayItemsList } from './TodayItemsList'
import type { DetailSelection, TodayOpenHabitDetail } from './today.types'
import {
  amountHelperLines,
  buildVisibleTodayOrder,
  canModifyTodayDate,
  getTodayEmptyStateMessageIds,
  todayAsISODate,
} from './today.utils'
import { useTodayCompletionActions } from './useTodayCompletionActions'
import { useTodayMenuActions } from './useTodayMenuActions'
import { useTodayPageData } from './useTodayPageData'
import { useTodayShellActions } from './useTodayShellActions'

export function TodayPage() {
  const intl = useIntl()
  const appToast = useAppToast()
  const actualToday = todayAsISODate()
  const [selectedDate, setSelectedDate] = useState<ISODateString>(actualToday)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
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
  const dateMode = getTodayDateMode(selectedDate, actualToday)
  const completionEnabled = canModifyTodayDate(dateMode)

  useTodayShellActions({
    actualToday,
    selectedDate,
    datePickerOpen,
    setDatePickerOpen,
    setSelectedDate,
  })

  const todayData = useTodayPageData({
    selectedDate,
    today: actualToday,
    filters,
    selectedMenuItemId,
    amountHabitId,
    detailSelection,
    selectedTaskId,
    selectedRecurrentTaskId,
  })

  const completionActions = useTodayCompletionActions({
    selectedDate,
    completionEnabled,
    openAmountInput: setAmountHabitId,
  })

  const closeMenu = () => setSelectedMenuItemId(null)
  const openHabitDetail: TodayOpenHabitDetail = (habit, tab, dangerAction) => {
    closeMenu()
    setDetailSelection({ habitId: habit.id, tab, dangerAction })
  }
  const { menuActionsForItem } = useTodayMenuActions({
    dateMode,
    closeMenu,
    completionActions,
    openAmountInput: setAmountHabitId,
    openHabitDetail,
    openTaskEdit: setSelectedTaskId,
    openRecurrentTaskEdit: setSelectedRecurrentTaskId,
  })
  const emptyState = getTodayEmptyStateMessageIds({
    searchText: filters.searchText,
    selectedDate,
    today: actualToday,
  })
  const reorderTodayItems = (visibleOrderedIds: string[]) => {
    todayData.setOrderForDate(
      selectedDate,
      buildVisibleTodayOrder(todayData.orderedItems, visibleOrderedIds),
    )
  }

  if (todayData.isLoading) {
    return (
      <section className="space-y-6">
        <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
      </section>
    )
  }

  if (todayData.isError) {
    return (
      <section className="space-y-6">
        <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <TodayDateNavigator
        selectedDate={selectedDate}
        dateMode={dateMode}
        onDateChange={setSelectedDate}
        onOpenDatePicker={() => setDatePickerOpen(true)}
      />

      <TodayFilters
        filters={filters}
        activeCategories={todayData.activeCategories}
        onFiltersChange={setFilters}
      />

      {todayData.visibleItems.length === 0 ? (
        <EmptyState titleId={emptyState.titleId} descriptionId={emptyState.descriptionId} />
      ) : (
        <TodayItemsList
          items={todayData.visibleItems}
          categoriesById={todayData.categoriesById}
          selectedDate={selectedDate}
          completionEnabled={completionEnabled}
          revealCards={todayData.revealCards}
          onReorder={reorderTodayItems}
          onPrimaryAction={completionActions.runPrimaryAction}
          onOpenMenu={setSelectedMenuItemId}
        />
      )}

      <TodayActionSheet
        title={todayData.selectedMenuItem?.title ?? ''}
        open={Boolean(todayData.selectedMenuItem)}
        actions={menuActionsForItem(todayData.selectedMenuItem)}
        onClose={closeMenu}
      />

      {todayData.selectedHabitForAmount ? (
        <HabitAmountInputSheet
          habit={todayData.selectedHabitForAmount}
          date={amountHabitId ? selectedDate : null}
          initialAmount={getHabitLogAmount(
            todayData.selectedHabitForAmount,
            todayData.habitLogs.find(
              (log) =>
                log.habitId === todayData.selectedHabitForAmount?.id &&
                log.loggedForDate === selectedDate,
            ),
          )}
          metadata={getHabitAmountInputMetadata(todayData.selectedHabitForAmount)!}
          helperLines={amountHelperLines(
            intl,
            todayData.selectedHabitForAmount,
            todayData.habitLogs,
            selectedDate,
          )}
          pending={completionActions.isHabitAmountPending}
          onClose={() => setAmountHabitId(null)}
          onSave={(amount) =>
            completionActions.saveHabitAmount(todayData.selectedHabitForAmount!, amount, () =>
              setAmountHabitId(null),
            )
          }
        />
      ) : null}

      {todayData.detailHabit && detailSelection ? (
        <HabitDetail
          key={`${todayData.detailHabit.id}:${detailSelection.tab}:${detailSelection.dangerAction ?? ''}`}
          habit={todayData.detailHabit}
          categories={todayData.categories}
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

      {todayData.selectedTask ? (
        <TaskEdit
          task={todayData.selectedTask}
          categories={todayData.categories}
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

      {todayData.selectedRecurrentTask ? (
        <RecurrentTaskEdit
          task={todayData.selectedRecurrentTask}
          categories={todayData.categories}
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

      {todayData.hasFilters ? (
        <span className="sr-only">{intl.formatMessage({ id: 'page.today.filters.active' })}</span>
      ) : null}
    </section>
  )
}

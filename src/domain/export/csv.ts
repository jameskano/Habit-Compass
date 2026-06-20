import type { HabitCompassExportData } from './types'

type CsvValue = string | number | boolean | null | undefined | object

type CsvColumn<T> = {
  header: string
  value: (row: T) => CsvValue
}

export const csvValueToCell = (value: CsvValue) => {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue =
    typeof value === 'object'
      ? JSON.stringify(value)
      : typeof value === 'boolean'
        ? value
          ? 'true'
          : 'false'
        : String(value)

  return /[",\r\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue
}

const buildCsv = <T>(rows: T[], columns: CsvColumn<T>[]) => {
  const header = columns.map((column) => csvValueToCell(column.header)).join(',')
  const body = rows.map((row) =>
    columns.map((column) => csvValueToCell(column.value(row))).join(','),
  )

  return [header, ...body].join('\n')
}

export const buildCsvExportFiles = (data: HabitCompassExportData) => ({
  'categories.csv': buildCsv(data.categories, [
    { header: 'id', value: (row) => row.id },
    { header: 'name', value: (row) => row.name },
    { header: 'description', value: (row) => row.description },
    { header: 'icon', value: (row) => row.iconName },
    { header: 'color', value: (row) => row.colorToken },
    { header: 'sort_order', value: (row) => row.order },
    { header: 'is_default', value: (row) => row.isDefault },
    { header: 'default_key', value: (row) => row.defaultKey },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'habits.csv': buildCsv(data.habits, [
    { header: 'id', value: (row) => row.id },
    { header: 'category_id', value: (row) => row.categoryId },
    { header: 'title', value: (row) => row.title },
    { header: 'description', value: (row) => row.description },
    { header: 'notes', value: (row) => row.notes },
    { header: 'priority', value: (row) => row.priority },
    { header: 'sort_order', value: (row) => row.order },
    { header: 'starts_on', value: (row) => row.startsOn },
    { header: 'ends_on', value: (row) => row.endsOn },
    { header: 'schedule_rule_json', value: (row) => row.scheduleRule },
    { header: 'goal_config_json', value: (row) => row.goalConfig },
    {
      header: 'completion_levels_json',
      value: (row) => ({
        usesCompletionLevels: row.usesCompletionLevels,
        enabledCompletionLevels: row.enabledCompletionLevels,
        defaultCompletionLevel: row.defaultCompletionLevel ?? null,
      }),
    },
    { header: 'archived_at', value: (row) => row.archivedAt },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'habit_inactivity_periods.csv': buildCsv(data.habitInactivityPeriods, [
    { header: 'id', value: (row) => row.id },
    { header: 'habit_id', value: (row) => row.habitId },
    { header: 'reason', value: (row) => row.reason },
    { header: 'starts_on', value: (row) => row.startsOn },
    { header: 'resumes_on', value: (row) => row.resumesOn },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'tasks.csv': buildCsv(data.tasks, [
    { header: 'id', value: (row) => row.id },
    { header: 'category_id', value: (row) => row.categoryId },
    { header: 'title', value: (row) => row.title },
    { header: 'description', value: (row) => row.description },
    { header: 'notes', value: (row) => row.notes },
    { header: 'priority', value: (row) => row.priority },
    { header: 'due_date', value: (row) => row.dueDate },
    { header: 'status', value: (row) => row.completionStatus },
    { header: 'carry_forward', value: (row) => row.carryForward },
    { header: 'sort_order', value: (row) => row.order },
    { header: 'completed_at', value: (row) => row.completedAt },
    { header: 'archived_at', value: (row) => row.archivedAt },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'recurrent_tasks.csv': buildCsv(data.recurrentTasks, [
    { header: 'id', value: (row) => row.id },
    { header: 'category_id', value: (row) => row.categoryId },
    { header: 'title', value: (row) => row.title },
    { header: 'description', value: (row) => row.description },
    { header: 'notes', value: (row) => row.notes },
    { header: 'priority', value: (row) => row.priority },
    { header: 'starts_on', value: (row) => row.startsOn },
    { header: 'ends_on', value: (row) => row.endsOn },
    { header: 'recurrence_config_json', value: (row) => row.recurrenceRule },
    { header: 'carry_forward', value: (row) => row.carryForward },
    { header: 'sort_order', value: (row) => row.order },
    { header: 'archived_at', value: (row) => row.archivedAt },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'recurrent_task_logs.csv': buildCsv(data.recurrentTaskLogs, [
    { header: 'id', value: (row) => row.id },
    { header: 'recurrent_task_id', value: (row) => row.recurrentTaskId },
    { header: 'occurrence_date', value: (row) => row.scheduledForDate },
    { header: 'status', value: (row) => row.status },
    { header: 'completed_at', value: (row) => row.completedAt },
    { header: 'note', value: (row) => row.note },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'completion_logs.csv': buildCsv(data.habitLogs, [
    { header: 'id', value: (row) => row.id },
    { header: 'habit_id', value: (row) => row.habitId },
    { header: 'log_date', value: (row) => row.loggedForDate },
    { header: 'logged_at', value: (row) => row.loggedAt },
    { header: 'status', value: (row) => row.status },
    { header: 'completion_level', value: (row) => row.completionLevel },
    { header: 'duration_minutes', value: (row) => row.durationMinutes },
    { header: 'repetitions', value: (row) => row.repetitions },
    { header: 'quantity', value: (row) => row.quantity },
    { header: 'quantity_unit_label', value: (row) => row.quantityUnitLabel },
    { header: 'note', value: (row) => row.notes },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'mood_logs.csv': buildCsv(data.moodLogs, [
    { header: 'id', value: (row) => row.id },
    { header: 'log_date', value: (row) => row.loggedForDate },
    { header: 'mood', value: (row) => row.mood },
    { header: 'energy', value: (row) => row.energy },
    { header: 'stress', value: (row) => row.stress },
    { header: 'note', value: (row) => row.note },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'reflections.csv': buildCsv(data.reflections, [
    { header: 'id', value: (row) => row.id },
    { header: 'kind', value: (row) => row.kind },
    { header: 'recorded_for_date', value: (row) => row.recordedForDate },
    { header: 'week_start_date', value: (row) => row.weekStartDate },
    { header: 'mood_log_id', value: (row) => row.moodLogId },
    { header: 'prompt_key', value: (row) => row.promptKey },
    { header: 'content', value: (row) => row.content },
    { header: 'archived_at', value: (row) => row.archivedAt },
    { header: 'deleted_at', value: (row) => row.deletedAt },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'weekly_records.csv': buildCsv(data.weeklyRecords, [
    { header: 'id', value: (row) => row.id },
    { header: 'week_start', value: (row) => row.weekStartDate },
    { header: 'focus_text', value: (row) => row.focusText },
    { header: 'review_overall_feeling', value: (row) => row.reviewOverallFeeling },
    { header: 'review_went_well', value: (row) => row.reviewWentWell },
    { header: 'review_got_in_way', value: (row) => row.reviewGotInWay },
    { header: 'review_adjust_next_week', value: (row) => row.reviewAdjustNextWeek },
    { header: 'review_reflections', value: (row) => row.reviewReflections },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
  'weekly_big_rocks.csv': buildCsv(data.weeklyBigRocks, [
    { header: 'id', value: (row) => row.id },
    { header: 'weekly_plan_id', value: (row) => row.weeklyPlanId },
    { header: 'habit_id', value: (row) => row.habitId },
    { header: 'sort_order', value: (row) => row.sortOrder },
    { header: 'archived_at', value: (row) => row.archivedAt },
    { header: 'deleted_at', value: (row) => row.deletedAt },
    { header: 'created_at', value: (row) => row.createdAt },
    { header: 'updated_at', value: (row) => row.updatedAt },
  ]),
})

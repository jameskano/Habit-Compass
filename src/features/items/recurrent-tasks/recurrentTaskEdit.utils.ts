import type { Category } from '@/domain/categories'
import type {
  DayOfWeek,
  RecurrenceRule,
  RecurrentTask,
  UpdateRecurrentTaskInput,
} from '@/domain/recurrent-tasks'

import { parseDaysOfMonthInput, parseDaysOfYearInput } from '../components/scheduleInputParsers'
import type { RecurrentTaskEditValues } from './recurrentTaskEdit.schema'

export const valuesForRecurrentTask = (task: RecurrentTask): RecurrentTaskEditValues => {
  const rule = task.recurrenceRule

  return {
    title: task.title,
    recurrenceKind: rule.kind,
    daysOfWeek:
      rule.kind === 'specificDaysOfWeek' || rule.kind === 'everyXWeeks' ? [...rule.daysOfWeek] : [],
    daysOfMonth: rule.kind === 'specificDaysOfMonth' ? rule.daysOfMonth.join(', ') : '1',
    daysOfYear:
      rule.kind === 'specificDaysOfYear'
        ? rule.daysOfYear.map(({ month, day }) => `${month}-${day}`).join(', ')
        : '1-1',
    intervalDays: rule.kind === 'everyXDays' ? rule.intervalDays : 2,
    intervalWeeks: rule.kind === 'everyXWeeks' ? rule.intervalWeeks : 1,
    intervalMonths: rule.kind === 'everyXMonths' ? rule.intervalMonths : 1,
    dayOfMonth: rule.kind === 'everyXMonths' ? rule.dayOfMonth : 1,
    weekday: rule.kind === 'firstWeekdayOfMonth' ? rule.weekday : 1,
    customDescription: rule.kind === 'customFutureRule' ? rule.description : '',
    categoryId: task.categoryId ?? '',
    priority: task.priority,
    carryForward: task.carryForward,
    description: task.description ?? '',
    notes: task.notes ?? '',
    startsOn: task.startsOn,
    endsOn: task.endsOn ?? '',
  }
}

export const buildRecurrentTaskRule = (values: RecurrentTaskEditValues): RecurrenceRule => {
  switch (values.recurrenceKind) {
    case 'daily':
      return { kind: 'daily' }
    case 'specificDaysOfWeek':
      return { kind: 'specificDaysOfWeek', daysOfWeek: values.daysOfWeek as DayOfWeek[] }
    case 'specificDaysOfMonth':
      return {
        kind: 'specificDaysOfMonth',
        daysOfMonth: parseDaysOfMonthInput(values.daysOfMonth),
      }
    case 'specificDaysOfYear':
      return {
        kind: 'specificDaysOfYear',
        daysOfYear: parseDaysOfYearInput(values.daysOfYear),
      }
    case 'everyXDays':
      return { kind: 'everyXDays', intervalDays: values.intervalDays }
    case 'everyXWeeks':
      return {
        kind: 'everyXWeeks',
        intervalWeeks: values.intervalWeeks,
        daysOfWeek: values.daysOfWeek as DayOfWeek[],
      }
    case 'everyXMonths':
      return {
        kind: 'everyXMonths',
        intervalMonths: values.intervalMonths,
        dayOfMonth: values.dayOfMonth,
      }
    case 'firstWeekdayOfMonth':
      return { kind: 'firstWeekdayOfMonth', weekday: values.weekday as DayOfWeek }
    case 'customFutureRule':
      return { kind: 'customFutureRule', description: values.customDescription.trim() }
  }
}

export const buildRecurrentTaskUpdateInput = (
  taskId: RecurrentTask['id'],
  values: RecurrentTaskEditValues,
  selectedCategoryId: string,
): UpdateRecurrentTaskInput => {
  return {
    id: taskId,
    title: values.title.trim(),
    recurrenceRule: buildRecurrentTaskRule(values),
    categoryId: selectedCategoryId || null,
    priority: values.priority,
    carryForward: values.carryForward,
    description: values.description.trim() || null,
    notes: values.notes.trim() || null,
    startsOn: values.startsOn,
    endsOn: values.endsOn || null,
  }
}

export const getRecurrentTaskCategoryOptions = (
  categories: readonly Category[],
  createdCategorySelection: Category | null,
) => {
  return createdCategorySelection &&
    !categories.some((category) => category.id === createdCategorySelection.id)
    ? [...categories, createdCategorySelection]
    : categories
}

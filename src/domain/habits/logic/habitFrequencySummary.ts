import type { HabitScheduleRule } from '../types'

export type FrequencySummaryDescriptor = {
  messageId: string
  values?: Record<string, number | string>
}

export function getHabitFrequencySummary(rule: HabitScheduleRule): FrequencySummaryDescriptor {
  switch (rule.kind) {
    case 'daily':
      return { messageId: 'items.frequency.daily' }
    case 'specificDaysOfWeek':
      return { messageId: 'items.frequency.specificDays', values: { days: rule.daysOfWeek.join(',') } }
    case 'everyXDays':
      return { messageId: 'items.frequency.everyXDays', values: { count: rule.intervalDays } }
    case 'everyXWeeks':
      return {
        messageId: 'items.frequency.everyXWeeks',
        values: { count: rule.intervalWeeks, days: rule.daysOfWeek.join(',') },
      }
    case 'everyXMonths':
      return {
        messageId: 'items.frequency.everyXMonths',
        values: { count: rule.intervalMonths, day: rule.dayOfMonth },
      }
    case 'firstWeekdayOfMonth':
      return { messageId: 'items.frequency.firstWeekday', values: { weekday: rule.weekday } }
    case 'flexiblePeriod':
      return { messageId: 'items.frequency.flexiblePeriod' }
  }
}

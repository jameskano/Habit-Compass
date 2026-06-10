import type { RecurrenceRule } from '../types'

export type RecurrentFrequencySummaryDescriptor = {
  messageId: string
  values?: Record<string, number | string>
}

export const getRecurrentFrequencySummary = (
  rule: RecurrenceRule,
): RecurrentFrequencySummaryDescriptor => {
  switch (rule.kind) {
    case 'daily':
      return { messageId: 'items.frequency.daily' }
    case 'specificDaysOfWeek':
      return {
        messageId: 'items.frequency.specificDays',
        values: { days: rule.daysOfWeek.join(',') },
      }
    case 'specificDaysOfMonth':
      return {
        messageId: 'items.frequency.specificDaysOfMonth',
        values: { days: rule.daysOfMonth.join(', ') },
      }
    case 'specificDaysOfYear':
      return {
        messageId: 'items.frequency.specificDaysOfYear',
        values: { days: rule.daysOfYear.map(({ month, day }) => `${month}/${day}`).join(', ') },
      }
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
    case 'customFutureRule':
      return {
        messageId: 'items.frequency.customFuture',
        values: { description: rule.description },
      }
  }
}

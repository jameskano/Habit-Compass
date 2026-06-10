import { useQuery } from '@tanstack/react-query'

import { getHabitPeriodBounds } from '@/domain/habits'
import { habitsRepository } from '@/integrations/repositories'
import { mockData, MOCK_USER_ID } from '@/integrations/mock/mockData'
import { unwrapResult } from '@/shared/utils/result'

export const useTodayHabitsQuery = (userId = MOCK_USER_ID, date = mockData.today) => {
  return useQuery({
    queryKey: ['habits', 'today', userId, date],
    queryFn: async () => {
      const habits = unwrapResult(await habitsRepository.listForToday({ userId, date }))
      const from = habits.reduce((earliest, habit) => {
        const { periodStart } = getHabitPeriodBounds(habit, date)
        return periodStart < earliest ? periodStart : earliest
      }, date)
      const to = habits.reduce((latest, habit) => {
        const { periodEnd } = getHabitPeriodBounds(habit, date)
        return periodEnd > latest ? periodEnd : latest
      }, date)
      const logs = unwrapResult(await habitsRepository.listLogsForRange({ userId, from, to }))

      return {
        habits,
        logs,
        completedCount: habits.filter((habit) =>
          logs.some(
            (log) =>
              log.habitId === habit.id && log.loggedForDate === date && log.status === 'completed',
          ),
        ).length,
      }
    },
  })
}

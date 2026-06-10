import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ISODateString } from '@/shared/types'

type TodayOrderStore = {
  ordersByDate: Record<ISODateString, string[]>
  getOrderForDate: (date: ISODateString) => string[]
  setOrderForDate: (date: ISODateString, orderedIds: string[]) => void
  pruneOrderForDate: (date: ISODateString, availableIds: string[]) => void
}

export const useTodayOrderStore = create<TodayOrderStore>()(
  persist(
    (set, get) => ({
      ordersByDate: {},
      getOrderForDate: (date) => get().ordersByDate[date] ?? [],
      setOrderForDate: (date, orderedIds) =>
        set((state) => ({
          ordersByDate: {
            ...state.ordersByDate,
            [date]: [...orderedIds],
          },
        })),
      pruneOrderForDate: (date, availableIds) => {
        const available = new Set(availableIds)
        const current = get().ordersByDate[date] ?? []
        const nextOrder = current.filter((id) => available.has(id))

        if (nextOrder.length === current.length) {
          return
        }

        set((state) => ({
            ordersByDate: {
              ...state.ordersByDate,
              [date]: nextOrder,
            },
          }))
      },
    }),
    {
      name: 'habit-compass-today-order-v1',
      version: 1,
    },
  ),
)

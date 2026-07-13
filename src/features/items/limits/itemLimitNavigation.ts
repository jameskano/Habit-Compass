import type { LimitedItemKind } from '@/domain/subscriptions'

export type ItemLimitTab = 'habits' | 'tasks' | 'recurrent'

export const itemLimitTabByKind: Record<LimitedItemKind, ItemLimitTab> = {
  habit: 'habits',
  recurrentTask: 'recurrent',
  task: 'tasks',
}

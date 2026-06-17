import type { EntityId, UserId } from '@/shared/types'

import type { CategoryColorToken, CategoryDefaultKey, CategoryIconKey } from './constants'

export type Category = {
  id: EntityId
  userId: UserId
  createdAt: string
  updatedAt: string
  name: string
  description?: string | null
  colorToken: CategoryColorToken
  iconName: CategoryIconKey
  order: number
  isDefault: boolean
  defaultKey: CategoryDefaultKey | null
}

import type { BaseEntityFields, LifecycleStatus } from '@/shared/types'

import type { categoryOrientations } from './constants'

export type CategoryOrientation = (typeof categoryOrientations)[number]

export type Category = BaseEntityFields & {
  name: string
  description?: string | null
  colorToken?: string | null
  iconName?: string | null
  orientation: CategoryOrientation
  lifecycleStatus: LifecycleStatus
  isDefault: boolean
}

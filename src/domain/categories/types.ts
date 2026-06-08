import type { ItemEntityFields, LifecycleStatus } from '@/shared/types'

export type Category = ItemEntityFields & {
  name: string
  description?: string | null
  colorToken: string
  iconName: string
  order: number
  lifecycleStatus: LifecycleStatus
  isDefault: boolean
}

import type { ComponentPropsWithoutRef } from 'react'

import { cn } from '@/shared/utils/cn'

import { getCategoryIconComponent } from './categoryIconRegistry'

type CategoryIconProps = ComponentPropsWithoutRef<'svg'> & {
  iconName: string
}

export const CategoryIcon = ({ iconName, className, ...props }: CategoryIconProps) => {
  const Icon = getCategoryIconComponent(iconName)

  return <Icon aria-hidden="true" className={cn('shrink-0', className)} {...props} />
}

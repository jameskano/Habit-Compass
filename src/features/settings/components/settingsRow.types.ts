import { Link } from '@tanstack/react-router'
import type { ComponentProps, ComponentType } from 'react'

export type SettingsIcon = ComponentType<{
  className?: string
  size?: number
  'aria-hidden'?: boolean
}>

export type SettingsRowTo = ComponentProps<typeof Link>['to']

export type SettingsRowProps = {
  icon: SettingsIcon
  labelId: string
  ariaLabelId?: string
  descriptionId?: string
  valueId?: string
  badgeId?: string
  to?: SettingsRowTo
  onClick?: () => void
  disabled?: boolean
  destructive?: boolean
}

export type SettingsRowContentProps = Pick<
  SettingsRowProps,
  'badgeId' | 'descriptionId' | 'destructive' | 'icon' | 'labelId' | 'valueId'
> & {
  interactive: boolean
}

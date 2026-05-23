import { z } from 'zod'

export const lifecycleStatuses = ['active', 'archived', 'deleted'] as const
export const trackableStatuses = ['pending', 'completed', 'skipped', 'missed'] as const
export const allStatuses = [...lifecycleStatuses, ...trackableStatuses] as const

export type LifecycleStatus = (typeof lifecycleStatuses)[number]
export type TrackableStatus = (typeof trackableStatuses)[number]
export type EntityStatus = (typeof allStatuses)[number]

export const LifecycleStatusSchema = z.enum(lifecycleStatuses)
export const TrackableStatusSchema = z.enum(trackableStatuses)
export const EntityStatusSchema = z.enum(allStatuses)

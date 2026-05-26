import { z } from 'zod'

import { IsoDateTimeStringSchema } from './date'

export type EntityId = string
export type UserId = string

export type BaseEntityFields = {
  id: EntityId
  userId: UserId
  createdAt: string
  updatedAt: string
  archivedAt?: string | null
  deletedAt?: string | null
}

export type ItemEntityFields = Omit<BaseEntityFields, 'deletedAt'>

export const EntityIdSchema = z.string().min(1)
export const UserIdSchema = z.string().min(1)

export const BaseEntityFieldsSchema = z.object({
  id: EntityIdSchema,
  userId: UserIdSchema,
  createdAt: IsoDateTimeStringSchema,
  updatedAt: IsoDateTimeStringSchema,
  archivedAt: IsoDateTimeStringSchema.nullish(),
  deletedAt: IsoDateTimeStringSchema.nullish(),
})

export const ItemEntityFieldsSchema = BaseEntityFieldsSchema.omit({ deletedAt: true })

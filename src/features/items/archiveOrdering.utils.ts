import type { ItemEntityFields } from '@/shared/types'

export const sortArchivedItems = <T extends Pick<ItemEntityFields, 'archivedAt'>>(
  items: readonly T[],
) => {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftArchivedAt = left.item.archivedAt
      const rightArchivedAt = right.item.archivedAt

      if (leftArchivedAt && rightArchivedAt && leftArchivedAt !== rightArchivedAt) {
        return rightArchivedAt.localeCompare(leftArchivedAt)
      }
      if (leftArchivedAt && !rightArchivedAt) {
        return -1
      }
      if (!leftArchivedAt && rightArchivedAt) {
        return 1
      }

      return left.index - right.index
    })
    .map(({ item }) => item)
}

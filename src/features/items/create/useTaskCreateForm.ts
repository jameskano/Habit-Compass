import { useState } from 'react'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import type { LimitedItemKind } from '@/domain/subscriptions'
import type { CreateTaskInput } from '@/domain/tasks'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { getItemLimitKindFromError } from '@/features/items/limits/itemLimitErrors'
import { useItemLimitGate } from '@/features/items/limits/useItemLimitGate'
import { useCreateTaskMutation } from '@/features/tasks/hooks/useTaskMutations'
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQuery'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'

import { isTaskDetailsValid, todayAsISODate } from './createItem.utils'

export const useTaskCreateForm = (
  onClose: () => void,
  onLimitReached?: (kind: LimitedItemKind) => void,
) => {
  const intl = useIntl()
  const mutation = useCreateTaskMutation()
  const limitGate = useItemLimitGate()
  const tasks = useTasksQuery().data ?? []
  const categories = useCategoriesQuery().data ?? []
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState(todayAsISODate)
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<CreateTaskInput['priority']>('medium')
  const [description, setDescription] = useState('')
  const [carryForward, setCarryForward] = useState(true)
  const [error, setError] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const submit = () => {
    if (!isTaskDetailsValid({ title, dueDate })) {
      setError(intl.formatMessage({ id: 'page.items.create.error.details' }))
      return
    }
    if (!limitGate.canUse('task')) {
      onLimitReached?.('task')
      return
    }
    mutation.mutate(
      {
        userId: MOCK_USER_ID,
        title: title.trim(),
        dueDate,
        categoryId: categoryId || null,
        priority,
        description: description.trim() || null,
        notes: null,
        carryForward,
        order: tasks.length,
        lifecycleStatus: 'active',
        completionStatus: 'pending',
        completedAt: null,
      },
      {
        onError: (error) => {
          const limitKind = getItemLimitKindFromError(error)

          if (limitKind) {
            onLimitReached?.(limitKind)
          }
        },
        onSuccess: onClose,
      },
    )
  }

  const selectCreatedCategory = (createdCategory: Category) => {
    setCategoryId(createdCategory.id)
  }

  return {
    carryForward,
    categories,
    categoryId,
    creatingCategory,
    description,
    dueDate,
    error,
    isPending: mutation.isPending,
    priority,
    selectCreatedCategory,
    setCarryForward,
    setCategoryId,
    setCreatingCategory,
    setDescription,
    setDueDate,
    setPriority,
    setTitle,
    submit,
    title,
  }
}

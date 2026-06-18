import { useState } from 'react'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import type { CreateRecurrentTaskInput } from '@/domain/recurrent-tasks'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { useCreateRecurrentTaskMutation } from '@/features/recurrent-tasks/hooks/useRecurrentTaskMutations'
import { useRecurrentTasksQuery } from '@/features/recurrent-tasks/hooks/useRecurrentTasksQuery'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'

import {
  buildRecurrence,
  initialFrequency,
  isRecurrentTaskDetailsValid,
  todayAsISODate,
  validateFrequency,
} from './createItem.utils'

export const useRecurrentTaskCreateForm = (onClose: () => void) => {
  const intl = useIntl()
  const mutation = useCreateRecurrentTaskMutation()
  const tasks = useRecurrentTasksQuery().data ?? []
  const categories = useCategoriesQuery().data ?? []
  const [step, setStep] = useState(1)
  const [frequency, setFrequency] = useState(initialFrequency)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<CreateRecurrentTaskInput['priority']>('medium')
  const [description, setDescription] = useState('')
  const [startsOn, setStartsOn] = useState(todayAsISODate)
  const [endsOn, setEndsOn] = useState('')
  const [carryForward, setCarryForward] = useState(true)
  const [error, setError] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const continueFlow = () =>
    validateFrequency(frequency)
      ? setStep(2)
      : setError(intl.formatMessage({ id: 'page.items.create.error.frequency' }))

  const submit = () => {
    if (!isRecurrentTaskDetailsValid({ title, startsOn, endsOn })) {
      setError(intl.formatMessage({ id: 'page.items.create.error.details' }))
      return
    }
    mutation.mutate(
      {
        userId: MOCK_USER_ID,
        title: title.trim(),
        recurrenceRule: buildRecurrence(frequency),
        categoryId: categoryId || null,
        priority,
        carryForward,
        description: description.trim() || null,
        notes: null,
        startsOn,
        endsOn: endsOn || null,
        order: tasks.length,
        lifecycleStatus: 'active',
      },
      { onSuccess: onClose },
    )
  }

  const selectCreatedCategory = (createdCategory: Category) => {
    setCategoryId(createdCategory.id)
  }

  return {
    carryForward,
    categories,
    categoryId,
    continueFlow,
    creatingCategory,
    description,
    endsOn,
    error,
    frequency,
    isPending: mutation.isPending,
    priority,
    selectCreatedCategory,
    setCarryForward,
    setCategoryId,
    setCreatingCategory,
    setDescription,
    setEndsOn,
    setFrequency,
    setPriority,
    setStartsOn,
    setStep,
    setTitle,
    startsOn,
    step,
    submit,
    title,
  }
}

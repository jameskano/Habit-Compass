import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import type { Category } from '@/domain/categories'
import type { DayOfWeek } from '@/domain/recurrent-tasks'
import {
  useArchiveRecurrentTaskMutation,
  useDeleteRecurrentTaskMutation,
  useUpdateRecurrentTaskMutation,
} from '@/features/recurrent-tasks/hooks/useRecurrentTaskMutations'
import { useAppToast } from '@/shared/hooks/useAppToast'

import { NO_RECURRENT_TASK_CATEGORY_VALUE } from './recurrentTaskEdit.constants'
import {
  RecurrentTaskEditValuesSchema,
  type RecurrentTaskEditValues,
} from './recurrentTaskEdit.schema'
import type { RecurrentTaskEditProps } from './recurrentTaskEdit.types'
import {
  buildRecurrentTaskUpdateInput,
  getRecurrentTaskCategoryOptions,
  valuesForRecurrentTask,
} from './recurrentTaskEdit.utils'

export const useRecurrentTaskEditForm = ({
  task,
  categories,
  today,
  onArchived,
  onDeleted,
}: RecurrentTaskEditProps) => {
  const appToast = useAppToast()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [categorySelection, setCategorySelection] = useState<string | null>(null)
  const [createdCategorySelection, setCreatedCategorySelection] = useState<Category | null>(null)
  const updateMutation = useUpdateRecurrentTaskMutation()
  const archiveMutation = useArchiveRecurrentTaskMutation()
  const deleteMutation = useDeleteRecurrentTaskMutation()
  const pending = updateMutation.isPending || archiveMutation.isPending || deleteMutation.isPending
  const form = useForm<RecurrentTaskEditValues>({
    resolver: zodResolver(RecurrentTaskEditValuesSchema),
    defaultValues: valuesForRecurrentTask(task),
  })
  void form.formState.dirtyFields
  const previousTaskIdRef = useRef(task.id)
  const createCategoryRequestRef = useRef(false)
  const categoryCreatedFromSheetRef = useRef(false)
  const previousCategoryIdsRef = useRef(new Set(categories.map((category) => category.id)))
  const recurrenceKind = form.watch('recurrenceKind')
  const selectedDays = form.watch('daysOfWeek')
  const selectedPriority = form.watch('priority')
  const selectedWeekday = form.watch('weekday')
  const selectedStartsOn = form.watch('startsOn')
  const selectedEndsOn = form.watch('endsOn')
  const selectedCategoryId =
    createdCategorySelection?.id ?? categorySelection ?? form.watch('categoryId')
  const categoryOptions = getRecurrentTaskCategoryOptions(categories, createdCategorySelection)

  const selectCategoryForForm = useCallback(
    (createdCategory: Category) => {
      setCategorySelection(createdCategory.id)
      setCreatedCategorySelection(createdCategory)
      form.reset(
        { ...form.getValues(), categoryId: createdCategory.id },
        { keepDirty: true, keepDirtyValues: true },
      )
      form.setValue('categoryId', createdCategory.id, {
        shouldDirty: true,
        shouldValidate: true,
      })
    },
    [form],
  )

  useEffect(() => {
    form.register('categoryId')
  }, [form])

  useEffect(() => {
    const sameTask = previousTaskIdRef.current === task.id
    const nextValues = sameTask
      ? { ...valuesForRecurrentTask(task), ...form.getValues() }
      : valuesForRecurrentTask(task)

    if (!sameTask) {
      setCategorySelection(null)
      setCreatedCategorySelection(null)
    }
    form.reset(nextValues, sameTask ? { keepDirtyValues: true } : undefined)
    previousTaskIdRef.current = task.id
  }, [form, task])

  useEffect(() => {
    const previousCategoryIds = previousCategoryIdsRef.current
    const createdCategory = categories.find((category) => !previousCategoryIds.has(category.id))

    if (createCategoryRequestRef.current && !creatingCategory && createdCategory) {
      createCategoryRequestRef.current = false
      selectCategoryForForm(createdCategory)
    }

    previousCategoryIdsRef.current = new Set(categories.map((category) => category.id))
  }, [categories, creatingCategory, selectCategoryForForm])

  const submit = form.handleSubmit((values) => {
    const categoryId = createdCategorySelection?.id ?? categorySelection ?? values.categoryId
    const input = buildRecurrentTaskUpdateInput(task.id, values, categoryId)

    updateMutation.mutate(input, {
      onSuccess: () => {
        if (values.endsOn && values.endsOn < today) {
          archiveMutation.mutate(task.id, { onSuccess: () => onArchived(task) })
          return
        }
        appToast.success({ id: 'page.items.recurrent.edit.saved' })
      },
    })
  })

  const selectCreatedCategory = (createdCategory: Category) => {
    categoryCreatedFromSheetRef.current = true
    selectCategoryForForm(createdCategory)
  }

  const openCategoryCreation = () => {
    createCategoryRequestRef.current = true
    categoryCreatedFromSheetRef.current = false
    setCreatingCategory(true)
  }

  const handleCategorySheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      if (!categoryCreatedFromSheetRef.current) {
        createCategoryRequestRef.current = false
      }
      categoryCreatedFromSheetRef.current = false
    }
    setCreatingCategory(nextOpen)
  }

  const handleCategoryChange = (value: string) => {
    if (
      value === NO_RECURRENT_TASK_CATEGORY_VALUE &&
      createdCategorySelection &&
      selectedCategoryId === createdCategorySelection.id
    ) {
      return
    }
    const nextCategoryId = value === NO_RECURRENT_TASK_CATEGORY_VALUE ? '' : value
    setCategorySelection(nextCategoryId)
    if (nextCategoryId !== createdCategorySelection?.id) {
      setCreatedCategorySelection(null)
    }
    form.setValue('categoryId', nextCategoryId, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleRecurrenceKindChange = (value: string) => {
    form.setValue('recurrenceKind', value as RecurrentTaskEditValues['recurrenceKind'], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const toggleDay = (day: DayOfWeek) => {
    form.setValue(
      'daysOfWeek',
      selectedDays.includes(day)
        ? selectedDays.filter((entry) => entry !== day)
        : [...selectedDays, day].sort(),
      { shouldDirty: true, shouldValidate: true },
    )
  }

  const handleWeekdayChange = (value: string) => {
    form.setValue('weekday', Number(value) as RecurrentTaskEditValues['weekday'], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleEndDateChange = (value: string) => {
    form.setValue('endsOn', value, { shouldDirty: true, shouldValidate: true })
  }

  const handlePriorityChange = (value: string) => {
    form.setValue('priority', value as RecurrentTaskEditValues['priority'], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const archiveTask = () => {
    archiveMutation.mutate(task.id, { onSuccess: () => onArchived(task) })
  }

  const deleteTask = () => {
    deleteMutation.mutate(task.id, { onSuccess: () => onDeleted(task) })
  }

  return {
    archiveTask,
    categoryOptions,
    confirmingDelete,
    creatingCategory,
    deleteTask,
    form,
    handleCategoryChange,
    handleCategorySheetOpenChange,
    handleEndDateChange,
    handlePriorityChange,
    handleRecurrenceKindChange,
    handleWeekdayChange,
    openCategoryCreation,
    pending,
    recurrenceKind,
    selectCreatedCategory,
    selectedCategoryId,
    selectedDays,
    selectedEndsOn,
    selectedPriority,
    selectedStartsOn,
    selectedWeekday,
    setConfirmingDelete,
    submit,
    toggleDay,
  }
}

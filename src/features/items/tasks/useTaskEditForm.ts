import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import type { Category } from '@/domain/categories'
import {
  useArchiveTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
} from '@/features/tasks/hooks/useTaskMutations'
import { useAppToast } from '@/shared/hooks/useAppToast'

import { TaskEditValuesSchema, type TaskEditValues } from './taskEdit.schema'
import type { TaskEditProps } from './taskEdit.types'
import { buildTaskUpdateInput, getTaskCategoryOptions, valuesForTask } from './taskEdit.utils'

export const useTaskEditForm = ({ task, categories, onArchived, onDeleted }: TaskEditProps) => {
  const appToast = useAppToast()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [categorySelection, setCategorySelection] = useState<string | null>(null)
  const [createdCategorySelection, setCreatedCategorySelection] = useState<Category | null>(null)
  const updateMutation = useUpdateTaskMutation()
  const archiveMutation = useArchiveTaskMutation()
  const deleteMutation = useDeleteTaskMutation()
  const pending = updateMutation.isPending || archiveMutation.isPending || deleteMutation.isPending
  const form = useForm<TaskEditValues>({
    resolver: zodResolver(TaskEditValuesSchema),
    defaultValues: valuesForTask(task),
  })
  void form.formState.dirtyFields
  const previousTaskIdRef = useRef(task.id)
  const createCategoryRequestRef = useRef(false)
  const categoryCreatedFromSheetRef = useRef(false)
  const previousCategoryIdsRef = useRef(new Set(categories.map((category) => category.id)))
  const selectedPriority = form.watch('priority')
  const selectedDueDate = form.watch('dueDate')
  const selectedCategoryId =
    createdCategorySelection?.id ?? categorySelection ?? form.watch('categoryId')
  const categoryOptions = getTaskCategoryOptions(categories, createdCategorySelection)

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
      ? { ...valuesForTask(task), ...form.getValues() }
      : valuesForTask(task)

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
    const input = buildTaskUpdateInput(task.id, values, categoryId)

    updateMutation.mutate(input, {
      onSuccess: () => appToast.success({ id: 'page.items.task.edit.saved' }),
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

  const handleCategoryChange = (value: string, noCategoryValue: string) => {
    if (
      value === noCategoryValue &&
      createdCategorySelection &&
      selectedCategoryId === createdCategorySelection.id
    ) {
      return
    }
    const nextCategoryId = value === noCategoryValue ? '' : value
    setCategorySelection(nextCategoryId)
    if (nextCategoryId !== createdCategorySelection?.id) {
      setCreatedCategorySelection(null)
    }
    form.setValue('categoryId', nextCategoryId, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleDueDateChange = (value: string) => {
    form.setValue('dueDate', value, { shouldDirty: true, shouldValidate: true })
  }

  const handlePriorityChange = (value: string) => {
    form.setValue('priority', value as TaskEditValues['priority'], {
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
    handleDueDateChange,
    handlePriorityChange,
    openCategoryCreation,
    pending,
    selectCreatedCategory,
    selectedCategoryId,
    selectedDueDate,
    selectedPriority,
    setConfirmingDelete,
    submit,
  }
}

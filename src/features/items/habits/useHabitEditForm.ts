import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'

import type { Category } from '@/domain/categories'
import type { HabitDayOfWeek, HabitPeriod } from '@/domain/habits'

import { NO_HABIT_CATEGORY_VALUE } from './habitEdit.constants'
import { HabitEditValuesSchema, type HabitEditValues } from './habitEdit.schema'
import type { HabitEditTabProps } from './habitEdit.types'
import { buildHabitUpdateInput, getHabitCategoryOptions, valuesForHabit } from './habitEdit.utils'

export const useHabitEditForm = ({ habit, categories, today, onSave }: HabitEditTabProps) => {
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [categorySelection, setCategorySelection] = useState<string | null>(null)
  const [createdCategorySelection, setCreatedCategorySelection] = useState<Category | null>(null)
  const form = useForm<HabitEditValues>({
    resolver: zodResolver(HabitEditValuesSchema) as Resolver<HabitEditValues>,
    defaultValues: valuesForHabit(habit),
  })
  void form.formState.dirtyFields
  const previousHabitIdRef = useRef(habit.id)
  const createCategoryRequestRef = useRef(false)
  const categoryCreatedFromSheetRef = useRef(false)
  const previousCategoryIdsRef = useRef(new Set(categories.map((category) => category.id)))
  const selectedCategoryId =
    createdCategorySelection?.id ?? categorySelection ?? form.watch('categoryId')
  const categoryOptions = getHabitCategoryOptions(categories, createdCategorySelection)

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
    const sameHabit = previousHabitIdRef.current === habit.id
    if (!sameHabit) {
      setCategorySelection(null)
      setCreatedCategorySelection(null)
    }
    form.reset(
      sameHabit ? { ...valuesForHabit(habit), ...form.getValues() } : valuesForHabit(habit),
      sameHabit ? { keepDirtyValues: true } : undefined,
    )
    previousHabitIdRef.current = habit.id
  }, [form, habit])

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
    const input = buildHabitUpdateInput(habit.id, values, categoryId)

    onSave(input, { archiveAfterSave: Boolean(values.endsOn && values.endsOn < today) })
  })

  const selectCreatedCategory = useCallback(
    (createdCategory: Category) => {
      categoryCreatedFromSheetRef.current = true
      selectCategoryForForm(createdCategory)
    },
    [selectCategoryForForm],
  )

  const openCategoryCreation = useCallback(() => {
    createCategoryRequestRef.current = true
    categoryCreatedFromSheetRef.current = false
    setCreatingCategory(true)
  }, [])

  const handleCategorySheetOpenChange = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      if (!categoryCreatedFromSheetRef.current) {
        createCategoryRequestRef.current = false
      }
      categoryCreatedFromSheetRef.current = false
    }
    setCreatingCategory(nextOpen)
  }, [])

  const handleCategoryChange = useCallback(
    (value: string) => {
      if (
        value === NO_HABIT_CATEGORY_VALUE &&
        createdCategorySelection &&
        selectedCategoryId === createdCategorySelection.id
      ) {
        return
      }
      const nextCategoryId = value === NO_HABIT_CATEGORY_VALUE ? '' : value
      setCategorySelection(nextCategoryId)
      if (nextCategoryId !== createdCategorySelection?.id) {
        setCreatedCategorySelection(null)
      }
      form.setValue('categoryId', nextCategoryId, {
        shouldDirty: true,
        shouldValidate: true,
      })
    },
    [createdCategorySelection, form, selectedCategoryId],
  )

  const handleScheduleKindChange = useCallback(
    (value: string) => {
      form.setValue('scheduleKind', value as HabitEditValues['scheduleKind'], {
        shouldDirty: true,
        shouldValidate: true,
      })
    },
    [form],
  )

  const toggleDay = useCallback(
    (day: HabitDayOfWeek) => {
      const selectedDays = form.getValues('daysOfWeek')

      form.setValue(
        'daysOfWeek',
        selectedDays.includes(day)
          ? selectedDays.filter((value) => value !== day)
          : [...selectedDays, day].sort(),
        { shouldDirty: true, shouldValidate: true },
      )
    },
    [form],
  )

  const handleWeekdayChange = useCallback(
    (value: string) => {
      form.setValue('weekday', Number(value) as HabitEditValues['weekday'], {
        shouldDirty: true,
        shouldValidate: true,
      })
    },
    [form],
  )

  const handlePriorityChange = useCallback(
    (value: string) => {
      form.setValue('priority', value as HabitEditValues['priority'], {
        shouldDirty: true,
        shouldValidate: true,
      })
    },
    [form],
  )

  const handleTrackingTypeChange = useCallback(
    (value: string) => {
      form.setValue('trackingType', value as HabitEditValues['trackingType'], {
        shouldDirty: true,
        shouldValidate: true,
      })
    },
    [form],
  )

  const handlePeriodChange = useCallback(
    (value: string) => {
      form.setValue('period', value as HabitPeriod, {
        shouldDirty: true,
        shouldValidate: true,
      })
    },
    [form],
  )

  const handleEndDateChange = useCallback(
    (value: string) => {
      form.setValue('endsOn', value, { shouldDirty: true, shouldValidate: true })
    },
    [form],
  )

  return {
    categoryOptions,
    creatingCategory,
    form,
    handleCategoryChange,
    handleCategorySheetOpenChange,
    handleEndDateChange,
    handlePeriodChange,
    handlePriorityChange,
    handleScheduleKindChange,
    handleTrackingTypeChange,
    handleWeekdayChange,
    openCategoryCreation,
    selectCreatedCategory,
    selectedCategoryId,
    submit,
    toggleDay,
  }
}

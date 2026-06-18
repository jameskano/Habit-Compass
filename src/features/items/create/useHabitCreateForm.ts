import { useState } from 'react'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import type { CreateHabitInput } from '@/domain/habits'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { useCreateHabitMutation } from '@/features/habits/hooks/useHabitDetailMutations'
import { useHabitsQuery } from '@/features/habits/hooks/useHabitsQuery'
import { MOCK_USER_ID } from '@/integrations/mock/mockData'

import {
  buildHabitGoal,
  buildSchedule,
  initialFrequency,
  isHabitCompletionValid,
  isHabitDetailsValid,
  isHabitFrequencyStepValid,
  todayAsISODate,
} from './createItem.utils'
import type {
  HabitCompletionMode,
  HabitMeasurableKind,
  HabitMeasurementScope,
} from './createItem.types'

export const useHabitCreateForm = (onClose: () => void) => {
  const intl = useIntl()
  const mutation = useCreateHabitMutation()
  const habits = useHabitsQuery().data ?? []
  const categories = useCategoriesQuery().data ?? []
  const [step, setStep] = useState(1)
  const [completionMode, setCompletionMode] = useState<HabitCompletionMode>('binary')
  const [measurableKind, setMeasurableKind] = useState<HabitMeasurableKind>('quantity')
  const [scope, setScope] = useState<HabitMeasurementScope>('session')
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('week')
  const [standardText, setStandardText] = useState('')
  const [minimumText, setMinimumText] = useState('')
  const [standardAmount, setStandardAmount] = useState(1)
  const [minimumAmount, setMinimumAmount] = useState<number | ''>('')
  const [unitLabel, setUnitLabel] = useState('')
  const [frequency, setFrequency] = useState(initialFrequency)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<CreateHabitInput['priority']>('medium')
  const [startsOn, setStartsOn] = useState(todayAsISODate)
  const [endsOn, setEndsOn] = useState('')
  const [error, setError] = useState('')
  const [creatingCategory, setCreatingCategory] = useState(false)

  const getGoalDraft = () => ({
    completionMode,
    frequency,
    measurableKind,
    minimumAmount,
    minimumText,
    period,
    scope,
    standardAmount,
    standardText,
    unitLabel,
  })

  const continueFlow = () => {
    setError('')
    if (step === 1 && !isHabitCompletionValid(getGoalDraft())) {
      setError(intl.formatMessage({ id: 'page.items.create.error.completion' }))
      return
    }
    if (step === 2 && !isHabitFrequencyStepValid(scope, frequency)) {
      setError(intl.formatMessage({ id: 'page.items.create.error.frequency' }))
      return
    }
    setStep((current) => current + 1)
  }

  const submit = () => {
    if (!isHabitDetailsValid({ title, categoryId, startsOn, endsOn })) {
      setError(intl.formatMessage({ id: 'page.items.create.error.details' }))
      return
    }
    const goalConfig = buildHabitGoal(getGoalDraft())
    const minimumConfigured =
      goalConfig.trackingType === 'binary'
        ? Boolean(goalConfig.minimumDescription)
        : minimumAmount !== '' && minimumAmount > 0
    mutation.mutate(
      {
        userId: MOCK_USER_ID,
        title: title.trim(),
        description: description.trim() || null,
        notes: null,
        lifecycleStatus: 'active',
        categoryId,
        priority,
        startsOn,
        endsOn: endsOn || null,
        order: habits.length,
        scheduleRule:
          completionMode === 'measurable' && scope === 'period'
            ? { kind: 'flexiblePeriod' }
            : buildSchedule(frequency),
        trackingType: goalConfig.trackingType,
        goalConfig,
        usesCompletionLevels: minimumConfigured,
        enabledCompletionLevels: minimumConfigured ? ['minimum', 'standard'] : ['standard'],
        defaultCompletionLevel: minimumConfigured ? 'standard' : null,
        resetMode: 'soft',
      },
      { onSuccess: onClose },
    )
  }

  const selectCreatedCategory = (createdCategory: Category) => {
    setCategoryId(createdCategory.id)
  }

  return {
    categories,
    categoryId,
    completionMode,
    continueFlow,
    creatingCategory,
    description,
    endsOn,
    error,
    frequency,
    isPending: mutation.isPending,
    measurableKind,
    minimumAmount,
    minimumText,
    period,
    priority,
    scope,
    selectCreatedCategory,
    setCategoryId,
    setCompletionMode,
    setCreatingCategory,
    setDescription,
    setEndsOn,
    setFrequency,
    setMeasurableKind,
    setMinimumAmount,
    setMinimumText,
    setPeriod,
    setPriority,
    setScope,
    setStandardAmount,
    setStandardText,
    setStartsOn,
    setStep,
    setTitle,
    standardAmount,
    standardText,
    startsOn,
    step,
    submit,
    title,
    unitLabel,
    setUnitLabel,
  }
}

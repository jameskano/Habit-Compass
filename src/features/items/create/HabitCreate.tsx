import { ArrowLeft } from 'lucide-react'
import { useIntl } from 'react-intl'

import { CategoryFormSheet } from '@/features/categories/CategoryFormSheet'
import { Button } from '@/shared/ui/button'

import type { CreateDialogProps } from './createItem.types'
import { DialogFrame } from './DialogFrame'
import { ErrorText } from './ErrorText'
import { HabitCreateCompletionStep } from './HabitCreateCompletionStep'
import { HabitCreateDetailsStep } from './HabitCreateDetailsStep'
import { HabitCreateFrequencyStep } from './HabitCreateFrequencyStep'
import { useHabitCreateForm } from './useHabitCreateForm'

export const HabitCreate = ({ onClose }: CreateDialogProps) => {
  const intl = useIntl()
  const habitCreate = useHabitCreateForm(onClose)

  return (
    <DialogFrame
      title={intl.formatMessage({ id: 'page.items.create.habit.title' })}
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {intl.formatMessage(
            { id: 'page.items.create.step' },
            { step: habitCreate.step, total: 3 },
          )}
        </p>
        {habitCreate.step === 1 ? (
          <HabitCreateCompletionStep
            completionMode={habitCreate.completionMode}
            measurableKind={habitCreate.measurableKind}
            scope={habitCreate.scope}
            period={habitCreate.period}
            standardText={habitCreate.standardText}
            minimumText={habitCreate.minimumText}
            standardAmount={habitCreate.standardAmount}
            minimumAmount={habitCreate.minimumAmount}
            unitLabel={habitCreate.unitLabel}
            onCompletionModeChange={habitCreate.setCompletionMode}
            onMeasurableKindChange={habitCreate.setMeasurableKind}
            onScopeChange={habitCreate.setScope}
            onPeriodChange={habitCreate.setPeriod}
            onStandardTextChange={habitCreate.setStandardText}
            onMinimumTextChange={habitCreate.setMinimumText}
            onStandardAmountChange={habitCreate.setStandardAmount}
            onMinimumAmountChange={habitCreate.setMinimumAmount}
            onUnitLabelChange={habitCreate.setUnitLabel}
          />
        ) : null}
        {habitCreate.step === 2 ? (
          <HabitCreateFrequencyStep
            completionMode={habitCreate.completionMode}
            scope={habitCreate.scope}
            period={habitCreate.period}
            frequency={habitCreate.frequency}
            onFrequencyChange={habitCreate.setFrequency}
          />
        ) : null}
        {habitCreate.step === 3 ? (
          <HabitCreateDetailsStep
            title={habitCreate.title}
            description={habitCreate.description}
            categoryId={habitCreate.categoryId}
            priority={habitCreate.priority}
            startsOn={habitCreate.startsOn}
            endsOn={habitCreate.endsOn}
            onTitleChange={habitCreate.setTitle}
            onDescriptionChange={habitCreate.setDescription}
            onCategoryIdChange={habitCreate.setCategoryId}
            onPriorityChange={habitCreate.setPriority}
            onStartsOnChange={habitCreate.setStartsOn}
            onEndsOnChange={habitCreate.setEndsOn}
            onCreateCategory={() => habitCreate.setCreatingCategory(true)}
          />
        ) : null}
        {habitCreate.error ? <ErrorText>{habitCreate.error}</ErrorText> : null}
        <div className="flex gap-3">
          {habitCreate.step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => habitCreate.setStep((current) => current - 1)}
            >
              <ArrowLeft aria-hidden="true" size={16} className="mr-2" />
              {intl.formatMessage({ id: 'action.back' })}
            </Button>
          ) : null}
          <Button
            type="button"
            className="ml-auto"
            disabled={habitCreate.isPending}
            onClick={habitCreate.step === 3 ? habitCreate.submit : habitCreate.continueFlow}
          >
            {intl.formatMessage({
              id: habitCreate.step === 3 ? 'page.items.create.save' : 'page.items.create.continue',
            })}
          </Button>
        </div>
      </div>
      <CategoryFormSheet
        open={habitCreate.creatingCategory}
        mode="create"
        categories={habitCreate.categories}
        onCreated={habitCreate.selectCreatedCategory}
        onOpenChange={(nextOpen) => habitCreate.setCreatingCategory(nextOpen)}
      />
    </DialogFrame>
  )
}

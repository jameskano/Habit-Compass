import { ArrowLeft } from 'lucide-react'
import { useIntl } from 'react-intl'

import { CategoryFormSheet } from '@/features/categories/CategoryFormSheet'
import { Button } from '@/shared/ui/button'

import type { CreateDialogProps } from './createItem.types'
import { DialogFrame } from './DialogFrame'
import { ErrorText } from './ErrorText'
import { FrequencyFields } from './FrequencyFields'
import { RecurrentTaskCreateDetailsStep } from './RecurrentTaskCreateDetailsStep'
import { useRecurrentTaskCreateForm } from './useRecurrentTaskCreateForm'

export const RecurrentTaskCreate = ({ onClose }: CreateDialogProps) => {
  const intl = useIntl()
  const recurrentTaskCreate = useRecurrentTaskCreateForm(onClose)

  return (
    <DialogFrame
      title={intl.formatMessage({ id: 'page.items.create.recurrent.title' })}
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {intl.formatMessage(
            { id: 'page.items.create.step' },
            { step: recurrentTaskCreate.step, total: 2 },
          )}
        </p>
        {recurrentTaskCreate.step === 1 ? (
          <section className="rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
            <FrequencyFields
              value={recurrentTaskCreate.frequency}
              onChange={recurrentTaskCreate.setFrequency}
              includeTimesPerPeriod={false}
            />
          </section>
        ) : (
          <RecurrentTaskCreateDetailsStep
            title={recurrentTaskCreate.title}
            categoryId={recurrentTaskCreate.categoryId}
            priority={recurrentTaskCreate.priority}
            description={recurrentTaskCreate.description}
            startsOn={recurrentTaskCreate.startsOn}
            endsOn={recurrentTaskCreate.endsOn}
            carryForward={recurrentTaskCreate.carryForward}
            onTitleChange={recurrentTaskCreate.setTitle}
            onCategoryIdChange={recurrentTaskCreate.setCategoryId}
            onPriorityChange={recurrentTaskCreate.setPriority}
            onDescriptionChange={recurrentTaskCreate.setDescription}
            onStartsOnChange={recurrentTaskCreate.setStartsOn}
            onEndsOnChange={recurrentTaskCreate.setEndsOn}
            onCarryForwardChange={recurrentTaskCreate.setCarryForward}
            onCreateCategory={() => recurrentTaskCreate.setCreatingCategory(true)}
          />
        )}
        {recurrentTaskCreate.error ? <ErrorText>{recurrentTaskCreate.error}</ErrorText> : null}
        <div className="flex gap-3">
          {recurrentTaskCreate.step === 2 ? (
            <Button variant="secondary" onClick={() => recurrentTaskCreate.setStep(1)}>
              <ArrowLeft aria-hidden="true" size={16} className="mr-2" />
              {intl.formatMessage({ id: 'action.back' })}
            </Button>
          ) : null}
          <Button
            className="ml-auto"
            onClick={
              recurrentTaskCreate.step === 1
                ? recurrentTaskCreate.continueFlow
                : recurrentTaskCreate.submit
            }
            disabled={recurrentTaskCreate.isPending}
          >
            {intl.formatMessage({
              id:
                recurrentTaskCreate.step === 1
                  ? 'page.items.create.continue'
                  : 'page.items.create.save',
            })}
          </Button>
        </div>
      </div>
      <CategoryFormSheet
        open={recurrentTaskCreate.creatingCategory}
        mode="create"
        categories={recurrentTaskCreate.categories}
        onCreated={recurrentTaskCreate.selectCreatedCategory}
        onOpenChange={(nextOpen) => recurrentTaskCreate.setCreatingCategory(nextOpen)}
      />
    </DialogFrame>
  )
}

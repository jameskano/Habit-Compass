import { FormattedMessage } from 'react-intl'

import type { FeedbackType } from '@/domain/feedback'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/cn'

import { feedbackTypeOptions } from './supportFeedback.constants'

type FeedbackTypeSelectorProps = {
  selectedType: FeedbackType
  onSelect: (type: FeedbackType) => void
}

export const FeedbackTypeSelector = ({
  onSelect,
  selectedType,
}: FeedbackTypeSelectorProps) => (
  <fieldset className="space-y-2">
    <legend className="text-sm font-medium">
      <FormattedMessage id="settings.support.feedback.type.label" />
    </legend>
    <div className="grid grid-cols-3 gap-2">
      {feedbackTypeOptions.map((option) => {
        const selected = selectedType === option.value

        return (
          <Button
            key={option.value}
            type="button"
            variant="ghost"
            aria-pressed={selected}
            className={cn(
              'min-h-10 rounded-lg border border-border/70 px-2 text-sm',
              selected
                ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-background text-muted-foreground hover:bg-muted',
            )}
            onClick={() => onSelect(option.value)}
          >
            <FormattedMessage id={option.labelId} />
          </Button>
        )
      })}
    </div>
  </fieldset>
)

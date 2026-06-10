import { type ChangeEvent } from 'react'
import { FormattedMessage } from 'react-intl'

type FeatureToggleProps = {
  id: string
  labelId: string
  descriptionId: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export const FeatureToggle = ({
  id,
  labelId,
  descriptionId,
  checked,
  onChange,
}: FeatureToggleProps) => {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card/90 p-4"
    >
      <div className="space-y-1">
        <span className="block text-sm font-semibold">
          <FormattedMessage id={labelId} />
        </span>
        <span id={`${id}-description`} className="block text-sm leading-6 text-muted-foreground">
          <FormattedMessage id={descriptionId} />
        </span>
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)}
        aria-describedby={`${id}-description`}
        className="mt-1 h-5 w-5 rounded border-border accent-[hsl(var(--primary))]"
      />
    </label>
  )
}

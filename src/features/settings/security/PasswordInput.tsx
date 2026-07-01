import { Eye, EyeOff } from 'lucide-react'
import type { UseFormRegister } from 'react-hook-form'
import { FormattedMessage } from 'react-intl'

import type { ChangePasswordValues } from '@/domain/auth/securityForms'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

import { getPasswordErrorId, type PasswordFieldName } from './securityFormMessages'

type PasswordInputProps = {
  autoComplete: string
  errorMessage?: string
  fieldName: PasswordFieldName
  labelId: string
  register: UseFormRegister<ChangePasswordValues>
  reveal: boolean
  toggleReveal: () => void
  toggleRevealLabel: string
}

export const PasswordInput = ({
  autoComplete,
  errorMessage,
  fieldName,
  labelId,
  register,
  reveal,
  toggleReveal,
  toggleRevealLabel,
}: PasswordInputProps) => {
  const inputId = `security-${fieldName}`

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>
        <FormattedMessage id={labelId} />
      </Label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          type={reveal ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={Boolean(errorMessage)}
          className="rounded-xl border-border/75"
          {...register(fieldName)}
        />
        <Button
          type="button"
          variant="ghost"
          aria-pressed={reveal}
          aria-label={toggleRevealLabel}
          className="size-10 shrink-0 rounded-xl border border-border/70 p-0"
          onClick={toggleReveal}
        >
          {reveal ? <EyeOff aria-hidden size={17} /> : <Eye aria-hidden size={17} />}
        </Button>
      </div>
      {errorMessage ? (
        <p className="text-xs text-destructive">
          <FormattedMessage id={getPasswordErrorId(fieldName, errorMessage)} />
        </p>
      ) : null}
    </div>
  )
}

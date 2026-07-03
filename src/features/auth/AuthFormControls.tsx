import { Eye, EyeOff } from 'lucide-react'
import { type InputHTMLAttributes, type ReactNode, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { cn } from '@/shared/utils/cn'
import type { AuthErrorCode } from '@/domain/auth'

import { getAuthErrorMessageId } from './authMessages'

type FieldErrorProps = {
  id: string
  messageId?: string
}

export const FieldError = ({ id, messageId }: FieldErrorProps) =>
  messageId ? (
    <p className="text-sm text-destructive" id={id}>
      <FormattedMessage id={messageId} />
    </p>
  ) : null

export const AuthAlert = ({ errorCode, messageId }: { errorCode?: AuthErrorCode | null; messageId?: string }) => {
  if (!errorCode && !messageId) {
    return null
  }

  return (
    <div
      aria-live="polite"
      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      role="alert"
    >
      <FormattedMessage id={messageId ?? getAuthErrorMessageId(errorCode ?? 'UNKNOWN')} />
    </div>
  )
}

export const AuthStatus = ({ children }: { children: ReactNode }) => (
  <div aria-live="polite" className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
    {children}
  </div>
)

export const FormField = ({
  children,
  errorId,
  errorMessageId,
  labelId,
}: {
  children: ReactNode
  errorId: string
  errorMessageId?: string
  labelId: string
}) => (
  <div className="space-y-2">
    <Label htmlFor={errorId.replace('-error', '')}>
      <FormattedMessage id={labelId} />
    </Label>
    {children}
    <FieldError id={errorId} messageId={errorMessageId} />
  </div>
)

export const PasswordInput = ({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) => {
  const intl = useIntl()
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="relative">
      <Input
        autoComplete={props.autoComplete}
        className={cn('pr-11', className)}
        type={revealed ? 'text' : 'password'}
        {...props}
      />
      <Button
        aria-label={intl.formatMessage({
          id: revealed ? 'auth.password.hide' : 'auth.password.show',
        })}
        className="absolute right-1 top-1 h-8 min-h-8 w-8 px-0"
        onClick={() => setRevealed((current) => !current)}
        type="button"
        variant="ghost"
      >
        {revealed ? <EyeOff aria-hidden size={16} /> : <Eye aria-hidden size={16} />}
      </Button>
    </div>
  )
}

export const OAuthDivider = () => (
  <div className="flex items-center gap-3 text-xs uppercase text-muted-foreground">
    <span className="h-px flex-1 bg-border" />
    <FormattedMessage id="auth.common.or" />
    <span className="h-px flex-1 bg-border" />
  </div>
)

export const GoogleButton = ({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) => (
  <Button className="w-full" disabled={disabled} onClick={onClick} type="button" variant="outline">
    <FormattedMessage id="auth.google.continue" />
  </Button>
)

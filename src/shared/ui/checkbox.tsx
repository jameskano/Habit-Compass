import { type InputHTMLAttributes, forwardRef } from 'react'

import { cn } from '@/shared/utils/cn'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      className={cn(
        'h-4 w-4 rounded border-border accent-[hsl(var(--primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    />
  ),
)

Checkbox.displayName = 'Checkbox'

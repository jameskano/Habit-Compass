import { Plus } from 'lucide-react'
import { useIntl } from 'react-intl'

type FloatingAddButtonProps = {
  onClick: () => void
}

export const FloatingAddButton = ({ onClick }: FloatingAddButtonProps) => {
  const intl = useIntl()

  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label={intl.formatMessage({ id: 'action.addItem' })}
      className="fixed bottom-20 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(10,88,73,0.28)] transition-transform hover:scale-[1.02] md:bottom-8 md:right-8"
    >
      <Plus aria-hidden="true" size={24} />
    </button>
  )
}

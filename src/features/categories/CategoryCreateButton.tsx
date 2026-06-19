import { Plus } from 'lucide-react'
import { useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'

export const CategoryCreateButton = ({ onClick }: { onClick: () => void }) => {
  const intl = useIntl()

  return (
    <Button
      variant="ghost"
      className="mt-2 h-auto min-h-0 justify-start rounded-none px-0 py-0 text-sm font-medium text-primary hover:bg-transparent"
      onClick={onClick}
    >
      <Plus aria-hidden="true" className="size-4" />
      {intl.formatMessage({ id: 'category.form.createInline' })}
    </Button>
  )
}

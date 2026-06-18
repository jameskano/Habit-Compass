import { X } from 'lucide-react'
import { useIntl } from 'react-intl'

import { Button } from '@/shared/ui/button'
import { DialogHeader, DialogTitle } from '@/shared/ui/dialog'

type TaskEditHeaderProps = {
  taskTitle: string
  onClose: () => void
}

export const TaskEditHeader = ({ taskTitle, onClose }: TaskEditHeaderProps) => {
  const intl = useIntl()

  return (
    <DialogHeader>
      <div className="flex items-start justify-between gap-4">
        <DialogTitle className="sr-only">
          {intl.formatMessage({ id: 'page.items.task.edit.title' }, { task: taskTitle })}
        </DialogTitle>
        <h2 className="text-xl font-semibold tracking-tight">{taskTitle}</h2>
        <Button
          variant="ghost"
          className="h-10 w-10 rounded-full border border-border/70 p-0"
          aria-label={intl.formatMessage({ id: 'action.close' })}
          onClick={onClose}
        >
          <X aria-hidden="true" size={18} />
        </Button>
      </div>
    </DialogHeader>
  )
}

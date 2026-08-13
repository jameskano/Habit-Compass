import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { useIntl } from 'react-intl'

import { canReactivateTask, type Task } from '@/domain/tasks'
import { Button } from '@/shared/ui/button'

type TaskEditDangerSectionProps = {
  task: Task
  pending: boolean
  onArchive: () => void
  onDelete: () => void
  onReactivate: () => void
}

export const TaskEditDangerSection = ({
  task,
  pending,
  onArchive,
  onDelete,
  onReactivate,
}: TaskEditDangerSectionProps) => {
  const intl = useIntl()
  const archived = task.lifecycleStatus === 'archived'
  const canReactivate = canReactivateTask(task)

  return (
    <section className="mt-6 space-y-3 rounded-[1.4rem] border border-amber-200/75 bg-amber-50/55 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
      <h3 className="text-sm font-semibold">
        {intl.formatMessage({ id: 'page.items.task.edit.dangerTitle' })}
      </h3>
      {!archived || canReactivate ? (
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 border border-border/60 bg-card/75"
          disabled={pending}
          onClick={canReactivate ? onReactivate : onArchive}
        >
          {canReactivate ? (
            <ArchiveRestore aria-hidden="true" size={17} />
          ) : (
            <Archive aria-hidden="true" size={17} />
          )}
          {intl.formatMessage({
            id: canReactivate
              ? 'page.items.task.action.reactivate'
              : 'page.items.task.action.archive',
          })}
        </Button>
      ) : null}
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 border border-amber-200 bg-amber-100/55 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        disabled={pending}
        onClick={onDelete}
      >
        <Trash2 aria-hidden="true" size={17} />
        {intl.formatMessage({ id: 'page.items.task.action.delete' })}
      </Button>
    </section>
  )
}

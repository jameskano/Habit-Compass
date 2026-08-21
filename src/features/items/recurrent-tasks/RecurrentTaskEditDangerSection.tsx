import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { useIntl } from 'react-intl'

import type { RecurrentTask } from '@/domain/recurrent-tasks'
import { Button } from '@/shared/ui/button'

type RecurrentTaskEditDangerSectionProps = {
  task: RecurrentTask
  pending: boolean
  onArchive: () => void
  onDelete: () => void
  onReactivate: () => void
}

export const RecurrentTaskEditDangerSection = ({
  task,
  pending,
  onArchive,
  onDelete,
  onReactivate,
}: RecurrentTaskEditDangerSectionProps) => {
  const intl = useIntl()
  const archived = task.lifecycleStatus === 'archived'

  return (
    <section className="mt-6 space-y-3 rounded-[1.4rem] border border-amber-200/75 bg-amber-50/55 p-4 dark:border-amber-900/70 dark:bg-amber-950/20">
      <h3 className="text-sm font-semibold">
        {intl.formatMessage({ id: 'page.items.recurrent.edit.dangerTitle' })}
      </h3>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 border border-border/60 bg-card/75"
        disabled={pending}
        onClick={archived ? onReactivate : onArchive}
      >
        {archived ? (
          <ArchiveRestore aria-hidden="true" size={17} />
        ) : (
          <Archive aria-hidden="true" size={17} />
        )}
        {intl.formatMessage({
          id: archived
            ? 'page.items.recurrent.action.reactivate'
            : 'page.items.recurrent.action.archive',
        })}
      </Button>
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 border border-amber-200 bg-amber-100/55 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        disabled={pending}
        onClick={onDelete}
      >
        <Trash2 aria-hidden="true" size={17} />
        {intl.formatMessage({ id: 'page.items.recurrent.action.delete' })}
      </Button>
    </section>
  )
}

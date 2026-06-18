import { useIntl } from 'react-intl'

import { CategoryFormSheet } from '@/features/categories/CategoryFormSheet'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent } from '@/shared/ui/dialog'

import { RecurrentTaskConfirmationDialog } from './RecurrentTaskConfirmationDialog'
import { RecurrentTaskEditDangerSection } from './RecurrentTaskEditDangerSection'
import { RecurrentTaskEditHeader } from './RecurrentTaskEditHeader'
import { RecurrentTaskEditOptionalSection } from './RecurrentTaskEditOptionalSection'
import { RecurrentTaskEditScheduleSection } from './RecurrentTaskEditScheduleSection'
import type { RecurrentTaskEditProps } from './recurrentTaskEdit.types'
import { useRecurrentTaskEditForm } from './useRecurrentTaskEditForm'

export const RecurrentTaskEdit = (props: RecurrentTaskEditProps) => {
  const { task, categories, onClose } = props
  const intl = useIntl()
  const taskEdit = useRecurrentTaskEditForm(props)

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !taskEdit.confirmingDelete) {
          onClose()
        }
      }}
    >
      <DialogContent
        aria-label={intl.formatMessage(
          { id: 'page.items.recurrent.edit.title' },
          { task: task.title },
        )}
        aria-describedby={undefined}
        className="fixed inset-0 left-0 top-0 z-50 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-background p-0 shadow-2xl md:left-1/2 md:top-1/2 md:max-h-[min(92vh,52rem)] md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.7rem] md:border md:border-border/75"
      >
        <RecurrentTaskEditHeader taskTitle={task.title} onClose={onClose} />
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <form
            aria-label={intl.formatMessage({ id: 'page.items.recurrent.edit.form' })}
            onSubmit={taskEdit.submit}
            className="space-y-5"
          >
            <RecurrentTaskEditScheduleSection
              form={taskEdit.form}
              recurrenceKind={taskEdit.recurrenceKind}
              selectedDays={taskEdit.selectedDays}
              selectedWeekday={taskEdit.selectedWeekday}
              onRecurrenceKindChange={taskEdit.handleRecurrenceKindChange}
              onToggleDay={taskEdit.toggleDay}
              onWeekdayChange={taskEdit.handleWeekdayChange}
            />
            <RecurrentTaskEditOptionalSection
              form={taskEdit.form}
              categoryOptions={taskEdit.categoryOptions}
              selectedCategoryId={taskEdit.selectedCategoryId}
              selectedPriority={taskEdit.selectedPriority}
              selectedStartsOn={taskEdit.selectedStartsOn}
              selectedEndsOn={taskEdit.selectedEndsOn}
              onCategoryChange={taskEdit.handleCategoryChange}
              onCreateCategory={taskEdit.openCategoryCreation}
              onEndDateChange={taskEdit.handleEndDateChange}
              onPriorityChange={taskEdit.handlePriorityChange}
            />
            <Button type="submit" className="w-full rounded-xl" disabled={taskEdit.pending}>
              {intl.formatMessage({ id: 'page.items.recurrent.edit.save' })}
            </Button>
          </form>

          <RecurrentTaskEditDangerSection
            task={task}
            pending={taskEdit.pending}
            onArchive={taskEdit.archiveTask}
            onDelete={() => taskEdit.setConfirmingDelete(true)}
          />
        </div>
        <RecurrentTaskConfirmationDialog
          task={task}
          open={taskEdit.confirmingDelete}
          pending={taskEdit.pending}
          onCancel={() => taskEdit.setConfirmingDelete(false)}
          onConfirm={taskEdit.deleteTask}
        />
        <CategoryFormSheet
          open={taskEdit.creatingCategory}
          mode="create"
          categories={categories}
          onCreated={taskEdit.selectCreatedCategory}
          onOpenChange={taskEdit.handleCategorySheetOpenChange}
        />
      </DialogContent>
    </Dialog>
  )
}

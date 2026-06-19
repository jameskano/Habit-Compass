import { useIntl } from 'react-intl'

import { CategoryFormSheet } from '@/features/categories/CategoryFormSheet'
import { Button } from '@/shared/ui/button'

import { HabitEditDangerSection } from './HabitEditDangerSection'
import { HabitEditDetailsSection } from './HabitEditDetailsSection'
import { HabitEditScheduleSection } from './HabitEditScheduleSection'
import type { HabitEditTabProps } from './habitEdit.types'
import { useHabitEditForm } from './useHabitEditForm'

export const HabitEditTab = (props: HabitEditTabProps) => {
  const { categories, archived, pending, onArchive, onRequestDangerAction } = props
  const intl = useIntl()
  const habitEdit = useHabitEditForm(props)

  return (
    <div className="space-y-6">
      <form
        onSubmit={habitEdit.submit}
        noValidate
        className="space-y-5"
        aria-label={intl.formatMessage({ id: 'page.items.habit.edit.form' })}
      >
        <HabitEditScheduleSection
          form={habitEdit.form}
          onScheduleKindChange={habitEdit.handleScheduleKindChange}
          onToggleDay={habitEdit.toggleDay}
          onWeekdayChange={habitEdit.handleWeekdayChange}
        />

        <HabitEditDetailsSection
          form={habitEdit.form}
          categoryOptions={habitEdit.categoryOptions}
          selectedCategoryId={habitEdit.selectedCategoryId}
          onCategoryChange={habitEdit.handleCategoryChange}
          onCreateCategory={habitEdit.openCategoryCreation}
          onEndDateChange={habitEdit.handleEndDateChange}
          onPeriodChange={habitEdit.handlePeriodChange}
          onPriorityChange={habitEdit.handlePriorityChange}
          onTrackingTypeChange={habitEdit.handleTrackingTypeChange}
        />

        <Button type="submit" className="w-full rounded-xl" disabled={archived || pending}>
          {intl.formatMessage({ id: 'page.items.habit.edit.save' })}
        </Button>
      </form>

      <HabitEditDangerSection
        archived={archived}
        pending={pending}
        onArchive={onArchive}
        onRequestDangerAction={onRequestDangerAction}
      />
      {habitEdit.creatingCategory ? (
        <CategoryFormSheet
          open={habitEdit.creatingCategory}
          mode="create"
          categories={categories}
          onCreated={habitEdit.selectCreatedCategory}
          onOpenChange={habitEdit.handleCategorySheetOpenChange}
        />
      ) : null}
    </div>
  )
}

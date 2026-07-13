import { useNavigate } from '@tanstack/react-router'
import { useIntl } from 'react-intl'

import type { LimitedItemKind } from '@/domain/subscriptions'
import { FREE_PLAN_LIMITS } from '@/domain/subscriptions'
import { usePremiumSubscriptionActions } from '@/features/subscriptions/usePremiumSubscriptionActions'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

import type { ItemLimitAction } from './useItemLimitGate'
import { itemLimitTabByKind } from './itemLimitNavigation'

type ItemLimitDialogProps = {
  action: ItemLimitAction
  kind: LimitedItemKind
  onClose: () => void
}

export const ItemLimitDialog = ({ action, kind, onClose }: ItemLimitDialogProps) => {
  const intl = useIntl()
  const navigate = useNavigate()
  const premiumActions = usePremiumSubscriptionActions()
  const limit = FREE_PLAN_LIMITS[kind]
  const itemLabel = intl.formatMessage({ id: `limits.item.${kind}` })

  const manageItems = async () => {
    onClose()
    await navigate({
      to: '/items',
      search: { tab: itemLimitTabByKind[kind] },
    })
  }

  const unlockPremium = async () => {
    await premiumActions.presentPaywall()
    onClose()
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {intl.formatMessage(
              { id: `limits.dialog.${action}.title` },
              { item: itemLabel, limit },
            )}
          </DialogTitle>
          <DialogDescription>
            {intl.formatMessage(
              { id: `limits.dialog.${action}.description` },
              { item: itemLabel, limit },
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 px-4 pb-4 pt-3 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="secondary" onClick={manageItems}>
            {intl.formatMessage({ id: `limits.dialog.manage.${kind}` })}
          </Button>
          <Button type="button" onClick={unlockPremium} disabled={premiumActions.paywallPending}>
            {intl.formatMessage({ id: 'limits.dialog.unlockPremium' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

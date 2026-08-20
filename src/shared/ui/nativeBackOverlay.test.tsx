import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  clearNativeBackHandlersForTest,
  runNativeBackHandlers,
} from '@/shared/nativeBack/nativeBackRegistry'

import { Dialog, DialogContent, DialogTitle } from './dialog'
import { Popover } from './popover'
import { Sheet, SheetContent, SheetTitle } from './sheet'

describe('shared overlay native back handling', () => {
  afterEach(() => {
    clearNativeBackHandlersForTest()
  })

  it('closes an open sheet through its existing open-change callback', () => {
    const onOpenChange = vi.fn()

    render(
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent aria-describedby={undefined}>
          <SheetTitle>Options</SheetTitle>
        </SheetContent>
      </Sheet>,
    )

    expect(runNativeBackHandlers()).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes a nested dialog before its parent sheet', () => {
    const onSheetOpenChange = vi.fn()
    const onDialogOpenChange = vi.fn()

    render(
      <>
        <Sheet open onOpenChange={onSheetOpenChange}>
          <SheetContent aria-describedby={undefined}>
            <SheetTitle>Options</SheetTitle>
          </SheetContent>
        </Sheet>
        <Dialog open onOpenChange={onDialogOpenChange}>
          <DialogContent aria-describedby={undefined}>
            <DialogTitle>Confirm</DialogTitle>
          </DialogContent>
        </Dialog>
      </>,
    )

    expect(runNativeBackHandlers()).toBe(true)
    expect(onDialogOpenChange).toHaveBeenCalledWith(false)
    expect(onSheetOpenChange).not.toHaveBeenCalled()
  })

  it('closes an open popover before route behavior', () => {
    const onOpenChange = vi.fn()

    render(
      <Popover open onOpenChange={onOpenChange}>
        <div />
      </Popover>,
    )

    expect(runNativeBackHandlers()).toBe(true)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('closes an open popover before its parent dialog', () => {
    const onDialogOpenChange = vi.fn()
    const onPopoverOpenChange = vi.fn()

    render(
      <Dialog open onOpenChange={onDialogOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Edit item</DialogTitle>
          <Popover open onOpenChange={onPopoverOpenChange}>
            <div />
          </Popover>
        </DialogContent>
      </Dialog>,
    )

    expect(runNativeBackHandlers()).toBe(true)
    expect(onPopoverOpenChange).toHaveBeenCalledWith(false)
    expect(onDialogOpenChange).not.toHaveBeenCalled()
  })
})

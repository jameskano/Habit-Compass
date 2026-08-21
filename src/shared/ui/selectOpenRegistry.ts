type SelectTriggerRegistration = {
  element: HTMLElement
  open: () => void
}

const openSelectClosers = new Set<() => void>()
const selectTriggers = new Set<SelectTriggerRegistration>()
let shouldPreventNextCloseAutoFocus = false

const registerOpenSelectCloser = (close: () => void) => {
  openSelectClosers.add(close)

  return () => {
    openSelectClosers.delete(close)
  }
}

const registerSelectTrigger = (registration: SelectTriggerRegistration) => {
  selectTriggers.add(registration)

  return () => {
    selectTriggers.delete(registration)
  }
}

const dismissOpenSelects = () => {
  const hadOpenSelect = openSelectClosers.size > 0

  openSelectClosers.forEach((close) => close())

  return hadOpenSelect
}

const containsPoint = (element: HTMLElement, clientX: number, clientY: number) => {
  const rect = element.getBoundingClientRect()

  return (
    clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
  )
}

const openSelectTriggerAtPoint = (
  clientX: number,
  clientY: number,
  currentTrigger: HTMLElement | null,
) => {
  const targetTrigger = [...selectTriggers].find(
    ({ element }) => element !== currentTrigger && containsPoint(element, clientX, clientY),
  )

  if (!targetTrigger) {
    return false
  }

  shouldPreventNextCloseAutoFocus = true
  dismissOpenSelects()

  window.requestAnimationFrame(() => {
    targetTrigger.element.focus({ preventScroll: true })
    targetTrigger.open()
  })

  return true
}

const consumeSelectCloseAutoFocusPrevention = () => {
  const shouldPrevent = shouldPreventNextCloseAutoFocus
  shouldPreventNextCloseAutoFocus = false

  return shouldPrevent
}

export {
  consumeSelectCloseAutoFocusPrevention,
  dismissOpenSelects,
  openSelectTriggerAtPoint,
  registerOpenSelectCloser,
  registerSelectTrigger,
}

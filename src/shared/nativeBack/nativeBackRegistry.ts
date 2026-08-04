type NativeBackHandler = () => boolean | void

type NativeBackHandlerEntry = {
  handler: NativeBackHandler
  id: number
  priority: number
}

const nativeBackHandlers = new Set<NativeBackHandlerEntry>()
let nextNativeBackHandlerId = 0

export const registerNativeBackHandler = (
  handler: NativeBackHandler,
  priority = 0,
): (() => void) => {
  const entry = {
    handler,
    id: nextNativeBackHandlerId,
    priority,
  }
  nextNativeBackHandlerId += 1
  nativeBackHandlers.add(entry)

  return () => {
    nativeBackHandlers.delete(entry)
  }
}

export const runNativeBackHandlers = () => {
  const handlers = [...nativeBackHandlers].sort(
    (first, second) => second.priority - first.priority || second.id - first.id,
  )

  for (const entry of handlers) {
    if (entry.handler() !== false) {
      return true
    }
  }

  return false
}

export const clearNativeBackHandlersForTest = () => {
  nativeBackHandlers.clear()
  nextNativeBackHandlerId = 0
}

import '@testing-library/jest-dom/vitest'

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

if (!window.ResizeObserver) {
  class ResizeObserverMock {
    observe() {
      return undefined
    }

    unobserve() {
      return undefined
    }

    disconnect() {
      return undefined
    }
  }

  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock,
  })
  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock,
  })
}

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => undefined,
})

if (!HTMLElement.prototype.hasPointerCapture) {
  Object.defineProperty(HTMLElement.prototype, 'hasPointerCapture', {
    writable: true,
    value: () => false,
  })
}

if (!HTMLElement.prototype.setPointerCapture) {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    writable: true,
    value: () => undefined,
  })
}

if (!HTMLElement.prototype.releasePointerCapture) {
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    writable: true,
    value: () => undefined,
  })
}

if (!Element.prototype.scrollIntoView) {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    writable: true,
    value: () => undefined,
  })
}

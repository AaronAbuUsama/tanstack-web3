let originalParent: typeof window.parent | undefined

/**
 * Mock the iframe environment by making window.parent !== window.
 */
export function mockIframeEnvironment(): void {
  if (typeof window === 'undefined') return
  originalParent = window.parent

  // Create a mock parent that is different from window
  Object.defineProperty(window, 'parent', {
    value: new Proxy(window, {
      get(target, prop) {
        if (prop === Symbol.toPrimitive || prop === 'valueOf') {
          return () => 'mock-parent'
        }
        return Reflect.get(target, prop)
      },
    }),
    writable: true,
    configurable: true,
  })
}

/**
 * Restore original window.parent.
 */
export function cleanupIframeMock(): void {
  if (typeof window === 'undefined') return
  if (originalParent !== undefined) {
    Object.defineProperty(window, 'parent', {
      value: originalParent,
      writable: true,
      configurable: true,
    })
    originalParent = undefined
  }
}

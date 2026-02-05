export type SafeMode = 'iframe' | 'standalone'

/**
 * Detect if the app is running inside a Safe App iframe.
 * Checks if window.parent !== window (we're in an iframe).
 */
export function detectSafeMode(): SafeMode {
  if (typeof window === 'undefined') return 'standalone'
  try {
    return window.parent !== window ? 'iframe' : 'standalone'
  } catch {
    // Cross-origin iframe access throws — means we're in an iframe
    return 'iframe'
  }
}

export function isSafeApp(): boolean {
  return detectSafeMode() === 'iframe'
}

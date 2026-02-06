import { describe, it, expect } from 'vitest'
import { detectSafeMode } from './detect'

describe('detectSafeMode', () => {
  it('returns standalone when window.parent === window', () => {
    // Default jsdom has window.parent === window
    expect(detectSafeMode()).toBe('standalone')
  })

  it('returns standalone in SSR (no window)', () => {
    const originalWindow = globalThis.window
    // @ts-ignore
    delete globalThis.window
    expect(detectSafeMode()).toBe('standalone')
    globalThis.window = originalWindow
  })
})

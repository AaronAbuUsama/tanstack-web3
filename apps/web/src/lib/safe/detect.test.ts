import { describe, it, expect } from 'vitest'
import { detectSafeMode, isSafeApp } from './detect'

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

describe('isSafeApp', () => {
  it('returns false in standalone mode', () => {
    expect(isSafeApp()).toBe(false)
  })
})

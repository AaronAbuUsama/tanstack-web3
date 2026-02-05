import { describe, it, expect } from 'vitest'
import { isRelayAvailable, getGelatoApiKey } from './relay'

describe('isRelayAvailable', () => {
  it('returns false without API key', () => {
    expect(isRelayAvailable()).toBe(false)
  })
})

describe('getGelatoApiKey', () => {
  it('returns null without API key', () => {
    expect(getGelatoApiKey()).toBeNull()
  })
})

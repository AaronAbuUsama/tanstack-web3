import { describe, expect, it } from 'vitest'
import { resolveRuntimePolicy } from './resolve-runtime-policy'

describe('resolveRuntimePolicy', () => {
  it('uses safe-app sdk path in iframe context', () => {
    const policy = resolveRuntimePolicy({
      appContext: 'safe-app-iframe',
      isConnected: true,
      connectorId: 'dev-wallet',
    })

    expect(policy).toEqual({
      appContext: 'safe-app-iframe',
      signerProvider: 'none',
      txSubmissionPath: 'safe-apps-sdk',
      canSign: false,
      canSubmit: true,
    })
  })

  it('resolves dev signer when standalone with dev connector', () => {
    const policy = resolveRuntimePolicy({
      appContext: 'standalone',
      isConnected: true,
      connectorId: 'dev-wallet',
    })

    expect(policy.signerProvider).toBe('dev-private-key')
    expect(policy.txSubmissionPath).toBe('protocol-kit-direct')
    expect(policy.canSign).toBe(true)
    expect(policy.canSubmit).toBe(true)
  })

  it('resolves injected signer when standalone with non-dev connector', () => {
    const policy = resolveRuntimePolicy({
      appContext: 'standalone',
      isConnected: true,
      connectorId: 'injected',
    })

    expect(policy.signerProvider).toBe('injected-eip1193')
    expect(policy.txSubmissionPath).toBe('protocol-kit-direct')
  })

  it('resolves read-only policy with no wallet connection', () => {
    const policy = resolveRuntimePolicy({
      appContext: 'standalone',
      isConnected: false,
    })

    expect(policy).toEqual({
      appContext: 'standalone',
      signerProvider: 'none',
      txSubmissionPath: 'none',
      canSign: false,
      canSubmit: false,
    })
  })

  it('uses transaction service when enabled on supported chain', () => {
    const policy = resolveRuntimePolicy({
      appContext: 'standalone',
      isConnected: true,
      connectorId: 'dev-wallet',
      txServiceEnabled: true,
      txServiceSupportedChain: true,
    })

    expect(policy.txSubmissionPath).toBe('transaction-service')
  })
})

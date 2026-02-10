import type { RuntimePolicy, RuntimePolicyInput, SignerProvider, TxSubmissionPath } from './types'

/**
 * Runtime policy decision engine.
 * Keep this logic as the single source of truth and document updates in docs/architecture/runtime-policy.md.
 */
export function resolveRuntimePolicy(input: RuntimePolicyInput): RuntimePolicy {
  const {
    appContext,
    isConnected,
    connectorId,
    txServiceEnabled = false,
    txServiceSupportedChain = false,
  } = input

  if (appContext === 'safe-app-iframe') {
    return {
      appContext,
      signerProvider: 'none',
      txSubmissionPath: 'safe-apps-sdk',
      canSign: false,
      canSubmit: true,
    }
  }

  let signerProvider: SignerProvider = 'none'
  if (isConnected) {
    signerProvider = connectorId === 'dev-wallet' ? 'dev-mnemonic-account' : 'injected-eip1193'
  }

  if (signerProvider === 'none') {
    return {
      appContext,
      signerProvider,
      txSubmissionPath: 'none',
      canSign: false,
      canSubmit: false,
    }
  }

  const txSubmissionPath: TxSubmissionPath =
    txServiceEnabled && txServiceSupportedChain ? 'transaction-service' : 'protocol-kit-direct'

  return {
    appContext,
    signerProvider,
    txSubmissionPath,
    canSign: true,
    canSubmit: true,
  }
}

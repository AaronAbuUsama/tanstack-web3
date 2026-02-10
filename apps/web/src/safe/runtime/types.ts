export type AppContext = 'standalone' | 'safe-app-iframe'

export type SignerProvider = 'dev-private-key' | 'injected-eip1193' | 'none'

export type TxSubmissionPath =
  | 'safe-apps-sdk'
  | 'protocol-kit-direct'
  | 'transaction-service'
  | 'none'

export interface RuntimePolicy {
  appContext: AppContext
  signerProvider: SignerProvider
  txSubmissionPath: TxSubmissionPath
  canSign: boolean
  canSubmit: boolean
}

export interface RuntimePolicyInput {
  appContext: AppContext
  isConnected: boolean
  connectorId?: string | null
  txServiceEnabled?: boolean
  txServiceSupportedChain?: boolean
}

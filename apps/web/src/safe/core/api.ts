import SafeApiKit from '@safe-global/api-kit'
import type { SafeMultisigTransactionResponse, SafeTransactionData } from '@safe-global/types-kit'

export const TX_SERVICE_URL_BY_CHAIN = {
  1: 'https://safe-transaction-mainnet.safe.global',
  100: 'https://safe-transaction-gnosis-chain.safe.global',
  10200: 'https://safe-transaction-chiado.safe.global',
  11155111: 'https://safe-transaction-sepolia.safe.global',
} as const

type SupportedTxServiceChainId = keyof typeof TX_SERVICE_URL_BY_CHAIN
type ApiKit = InstanceType<typeof SafeApiKit>

const apiKitCache = new Map<number, ApiKit>()

function asSupportedTxServiceChainId(chainId: number): SupportedTxServiceChainId | null {
  if (chainId in TX_SERVICE_URL_BY_CHAIN) {
    return chainId as SupportedTxServiceChainId
  }
  return null
}

export function isTxServiceSupportedChain(chainId: number): chainId is SupportedTxServiceChainId {
  return asSupportedTxServiceChainId(chainId) !== null
}

export function getTxServiceUrl(chainId: number): string | null {
  const supportedChainId = asSupportedTxServiceChainId(chainId)
  if (supportedChainId === null) return null
  return TX_SERVICE_URL_BY_CHAIN[supportedChainId]
}

function assertSupportedChain(chainId: number): SupportedTxServiceChainId {
  const supportedChainId = asSupportedTxServiceChainId(chainId)
  if (supportedChainId === null) {
    throw new Error(`Safe Transaction Service is not configured for chainId ${chainId}.`)
  }
  return supportedChainId
}

export function getApiKit(chainId: number): ApiKit {
  const supportedChainId = assertSupportedChain(chainId)
  const cached = apiKitCache.get(supportedChainId)
  if (cached) return cached

  const api = new SafeApiKit({
    chainId: BigInt(supportedChainId),
    txServiceUrl: TX_SERVICE_URL_BY_CHAIN[supportedChainId],
  })
  apiKitCache.set(supportedChainId, api)
  return api
}

interface ProposeTransactionParams {
  chainId: number
  safeAddress: string
  safeTransactionData: SafeTransactionData
  safeTxHash: string
  senderAddress: string
  senderSignature: string
  origin?: string
}

export async function proposeTransaction(params: ProposeTransactionParams) {
  const api = getApiKit(params.chainId)
  await api.proposeTransaction({
    safeAddress: params.safeAddress,
    safeTransactionData: params.safeTransactionData,
    safeTxHash: params.safeTxHash,
    senderAddress: params.senderAddress,
    senderSignature: params.senderSignature,
    origin: params.origin,
  })
}

interface GetTransactionParams {
  chainId: number
  safeTxHash: string
}

export async function getTransaction(params: GetTransactionParams): Promise<SafeMultisigTransactionResponse> {
  const api = getApiKit(params.chainId)
  return api.getTransaction(params.safeTxHash)
}

interface ConfirmTransactionParams {
  chainId: number
  safeTxHash: string
  signature: string
}

export async function confirmTransaction(params: ConfirmTransactionParams) {
  const api = getApiKit(params.chainId)
  await api.confirmTransaction(params.safeTxHash, params.signature)
}

interface GetPendingTransactionsParams {
  chainId: number
  safeAddress: string
}

export async function getPendingTransactions(
  params: GetPendingTransactionsParams,
): Promise<SafeMultisigTransactionResponse[]> {
  const api = getApiKit(params.chainId)
  const pending = await api.getPendingTransactions(params.safeAddress)
  return pending.results
}

export function clearApiKitCacheForTests() {
  apiKitCache.clear()
}

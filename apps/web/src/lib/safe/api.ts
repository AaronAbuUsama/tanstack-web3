import SafeApiKit from '@safe-global/api-kit'

const apiKitCache = new Map<bigint, SafeApiKit>()

/**
 * Create or retrieve a cached API Kit instance for a chain.
 */
export function createApiKit(chainId: bigint): SafeApiKit {
  const cached = apiKitCache.get(chainId)
  if (cached) return cached

  const apiKit = new SafeApiKit({ chainId })
  apiKitCache.set(chainId, apiKit)
  return apiKit
}

/**
 * Propose a transaction to the Transaction Service.
 */
export async function proposeTransaction(
  chainId: bigint,
  params: {
    safeAddress: string
    safeTransactionData: Parameters<SafeApiKit['proposeTransaction']>[0]['safeTransactionData']
    safeTxHash: string
    senderAddress: string
    senderSignature: string
  },
) {
  const apiKit = createApiKit(chainId)
  return apiKit.proposeTransaction(params)
}

/**
 * Get a specific transaction by its Safe transaction hash.
 */
export async function getTransaction(chainId: bigint, safeTxHash: string) {
  const apiKit = createApiKit(chainId)
  return apiKit.getTransaction(safeTxHash)
}

/**
 * Get pending transactions for a Safe address.
 */
export async function getPendingTransactions(
  chainId: bigint,
  safeAddress: string,
) {
  const apiKit = createApiKit(chainId)
  return apiKit.getPendingTransactions(safeAddress)
}

/**
 * Confirm (add signature to) a pending transaction.
 */
export async function confirmTransaction(
  chainId: bigint,
  safeTxHash: string,
  signature: string,
) {
  const apiKit = createApiKit(chainId)
  return apiKit.confirmTransaction(safeTxHash, signature)
}

/**
 * Get all Safes owned by an address.
 */
export async function getSafesByOwner(chainId: bigint, ownerAddress: string) {
  const apiKit = createApiKit(chainId)
  return apiKit.getSafesByOwner(ownerAddress)
}

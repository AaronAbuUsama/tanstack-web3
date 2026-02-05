import { createApiKit } from './api'
import type { MetaTransactionData } from './transactions'

export interface TransactionStatus {
  safeTxHash: string
  confirmations: number
  threshold: number
  isReady: boolean
  isExecuted: boolean
}

/**
 * Propose a new transaction: create, sign, and submit to Transaction Service.
 */
export async function proposeMultisigTransaction(
  safe: any,
  transactions: MetaTransactionData[],
  senderAddress: string,
) {
  const safeTransaction = await safe.createTransaction({ transactions })
  const safeTxHash = await safe.getTransactionHash(safeTransaction)
  const signature = await safe.signHash(safeTxHash)

  const chainId = await safe.getChainId()
  const safeAddress = await safe.getAddress()

  const apiKit = createApiKit(BigInt(chainId))
  await apiKit.proposeTransaction({
    safeAddress,
    safeTransactionData: safeTransaction.data,
    safeTxHash,
    senderAddress,
    senderSignature: signature.data,
  })

  return { safeTxHash, safeTransaction }
}

/**
 * Confirm (add signature to) a pending transaction.
 */
export async function confirmMultisigTransaction(
  safe: any,
  safeTxHash: string,
) {
  const signature = await safe.signHash(safeTxHash)
  const chainId = await safe.getChainId()

  const apiKit = createApiKit(BigInt(chainId))
  await apiKit.confirmTransaction(safeTxHash, signature.data)

  return signature
}

/**
 * Execute a fully confirmed transaction.
 */
export async function executeMultisigTransaction(
  safe: any,
  safeTxHash: string,
) {
  const chainId = await safe.getChainId()
  const apiKit = createApiKit(BigInt(chainId))
  const safeTransaction = await apiKit.getTransaction(safeTxHash)

  const response = await safe.executeTransaction(safeTransaction)
  return response
}

/**
 * Get the confirmation status of a transaction.
 */
export async function getTransactionStatus(
  chainId: bigint,
  safeTxHash: string,
  threshold: number,
): Promise<TransactionStatus> {
  const apiKit = createApiKit(chainId)
  const tx = await apiKit.getTransaction(safeTxHash)

  const confirmations = tx.confirmations?.length ?? 0
  return {
    safeTxHash,
    confirmations,
    threshold,
    isReady: confirmations >= threshold,
    isExecuted: tx.isExecuted,
  }
}

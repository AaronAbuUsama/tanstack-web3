import { parseEther, type Address } from 'viem'
import type { TransactionStatus, TxSourceMode } from '../core/types'

// Define OperationType locally to avoid ESM import issues with @safe-global/protocol-kit
export const OperationType = {
  Call: 0,
  DelegateCall: 1,
} as const

export interface MetaTransactionData {
  to: string
  value: string
  data: string
  operation?: number
}

export interface TransactionParams {
  to: Address
  value?: string // ETH value as string (e.g., "0.1")
  data?: `0x${string}` // Raw calldata
}

export interface BuildTransactionStatusParams {
  safeTxHash: string
  threshold: number
  confirmations?: number
  confirmedBy?: string[]
  isExecuted?: boolean
  source: TxSourceMode
}

/**
 * Build a Safe MetaTransactionData from simple parameters.
 */
export function buildTransaction(params: TransactionParams): MetaTransactionData {
  return {
    to: params.to,
    value: params.value ? parseEther(params.value).toString() : '0',
    data: params.data ?? '0x',
    operation: OperationType.Call,
  }
}

export function buildTransactionStatus(params: BuildTransactionStatusParams): TransactionStatus {
  const confirmedBy = (params.confirmedBy ?? []).map((address) => address.toLowerCase())
  const confirmationCount = Math.max(params.confirmations ?? 0, confirmedBy.length)
  const isExecuted = params.isExecuted ?? false
  const isReady = !isExecuted && confirmationCount >= params.threshold

  return {
    safeTxHash: params.safeTxHash,
    confirmations: confirmationCount,
    confirmedBy,
    threshold: params.threshold,
    isReady,
    isExecuted,
    source: params.source,
  }
}

export function hasSignerConfirmed(status: TransactionStatus, signerAddress?: string) {
  if (!signerAddress) return false
  return status.confirmedBy.some((confirmedSigner) => confirmedSigner === signerAddress.toLowerCase())
}

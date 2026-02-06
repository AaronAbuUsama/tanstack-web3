import { parseEther, type Address } from 'viem'

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


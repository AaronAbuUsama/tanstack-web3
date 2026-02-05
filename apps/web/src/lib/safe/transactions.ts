import { encodeFunctionData, parseEther, type Abi, type Address } from 'viem'

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

export interface ContractCallParams {
  to: Address
  value?: string
  abi: Abi
  functionName: string
  args?: unknown[]
}

export interface BatchTransactionParams {
  transactions: TransactionParams[]
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

/**
 * Build a transaction from a contract call (ABI-encoded).
 */
export function buildContractCall(params: ContractCallParams): MetaTransactionData {
  const data = encodeFunctionData({
    abi: params.abi,
    functionName: params.functionName,
    args: params.args ?? [],
  })

  return {
    to: params.to,
    value: params.value ? parseEther(params.value).toString() : '0',
    data,
    operation: OperationType.Call,
  }
}

/**
 * Build multiple transactions for a batch (MultiSend).
 * Pass the array directly to Safe's createTransaction which handles MultiSend internally.
 */
export function buildBatchTransactions(
  params: BatchTransactionParams,
): MetaTransactionData[] {
  return params.transactions.map(buildTransaction)
}

/**
 * Encode a function call for use as transaction data.
 */
export function encodeContractCall(
  abi: Abi,
  functionName: string,
  args: unknown[] = [],
): `0x${string}` {
  return encodeFunctionData({ abi, functionName, args })
}


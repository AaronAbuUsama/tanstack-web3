/**
 * Type bridge for Safe SDK types.
 *
 * Type-only imports are erased at compile time — zero runtime overhead,
 * no bundler issues with Node.js dependencies in protocol-kit.
 */
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'

export type SafeInstance = Safe
export type { SafeTransaction }

export interface TransactionStatus {
  safeTxHash: string
  confirmations: number
  threshold: number
  isReady: boolean
  isExecuted: boolean
}

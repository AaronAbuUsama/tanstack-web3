import Safe from '@safe-global/protocol-kit'
import {
  type MetaTransactionData,
  type SafeTransactionDataPartial,
  OperationType,
} from '@safe-global/protocol-kit'

export interface SafeConfig {
  provider: string
  signer?: string
  safeAddress?: string
}

export interface DeploySafeConfig {
  provider: string
  signer: string
  owners: string[]
  threshold: number
}

/**
 * Initialize a Safe Protocol Kit instance for an existing Safe.
 */
export async function createSafeInstance(config: SafeConfig): Promise<Safe> {
  const safe = await Safe.init({
    provider: config.provider,
    signer: config.signer,
    safeAddress: config.safeAddress,
  })
  return safe
}

/**
 * Deploy a new Safe with the given owners and threshold.
 */
export async function deploySafe(config: DeploySafeConfig): Promise<Safe> {
  const safe = await Safe.init({
    provider: config.provider,
    signer: config.signer,
    predictedSafe: {
      safeAccountConfig: {
        owners: config.owners,
        threshold: config.threshold,
      },
    },
  })
  return safe
}

/**
 * Get info about a Safe instance.
 */
export async function getSafeInfo(safe: Safe) {
  const [address, owners, threshold, nonce, chainId] = await Promise.all([
    safe.getAddress(),
    safe.getOwners(),
    safe.getThreshold(),
    safe.getNonce(),
    safe.getChainId(),
  ])
  return { address, owners, threshold, nonce, chainId }
}

/**
 * Create a Safe transaction from transaction data.
 */
export async function createTransaction(
  safe: Safe,
  transactions: MetaTransactionData[],
) {
  return safe.createTransaction({ transactions })
}

/**
 * Sign a Safe transaction.
 */
export async function signTransaction(
  safe: Safe,
  safeTransaction: Awaited<ReturnType<Safe['createTransaction']>>,
) {
  return safe.signTransaction(safeTransaction)
}

/**
 * Execute a Safe transaction (requires enough signatures).
 */
export async function executeTransaction(
  safe: Safe,
  safeTransaction: Awaited<ReturnType<Safe['createTransaction']>>,
) {
  return safe.executeTransaction(safeTransaction)
}

export { OperationType }
export type { MetaTransactionData, SafeTransactionDataPartial }

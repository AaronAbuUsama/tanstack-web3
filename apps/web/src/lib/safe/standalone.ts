/**
 * Protocol Kit integration for standalone Safe management.
 * Uses dynamic imports to avoid bundler issues with Node.js dependencies.
 */

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

export interface SafeInfo {
  address: string
  owners: string[]
  threshold: number
  nonce: number
  chainId: bigint
}

/**
 * Dynamically import Protocol Kit to avoid build-time ESM issues.
 */
async function getProtocolKit() {
  const mod = await import('@safe-global/protocol-kit')
  return mod.default ?? mod
}

/**
 * Initialize a Safe Protocol Kit instance for an existing Safe.
 */
export async function createSafeInstance(config: SafeConfig) {
  const Safe = await getProtocolKit()
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
export async function deploySafe(config: DeploySafeConfig) {
  const Safe = await getProtocolKit()
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
export async function getSafeInfo(safe: any): Promise<SafeInfo> {
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
  safe: any,
  transactions: Array<{ to: string; value: string; data: string; operation?: number }>,
) {
  return safe.createTransaction({ transactions })
}

/**
 * Sign a Safe transaction.
 */
export async function signTransaction(safe: any, safeTransaction: any) {
  return safe.signTransaction(safeTransaction)
}

/**
 * Execute a Safe transaction (requires enough signatures).
 */
export async function executeTransaction(safe: any, safeTransaction: any) {
  return safe.executeTransaction(safeTransaction)
}

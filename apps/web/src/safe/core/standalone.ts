/**
 * Protocol Kit integration for standalone Safe management.
 * Uses dynamic imports to avoid bundler issues with Node.js dependencies.
 */
import type { SafeInstance, SafeTransaction } from './types'

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
  modules: string[]
  balance: string
  guard: string
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
    safeAddress: config.safeAddress!,
  } as any)
  return safe
}

/**
 * Deploy a new Safe with the given owners and threshold.
 *
 * Flow: predict address → create deploy tx → send on-chain → re-init with deployed address.
 */
export async function deploySafe(config: DeploySafeConfig) {
  const Safe = await getProtocolKit()

  // Phase 1: Init with predictedSafe to compute the counterfactual address & deploy tx
  const predictedSafe = await Safe.init({
    provider: config.provider,
    signer: config.signer,
    predictedSafe: {
      safeAccountConfig: {
        owners: config.owners,
        threshold: config.threshold,
      },
      safeDeploymentConfig: {
        saltNonce: Date.now().toString(),
      },
    },
  })

  const safeAddress = await predictedSafe.getAddress()

  // Phase 2: Create and send the deployment transaction on-chain
  // If the Safe already exists at the predicted address, skip deployment
  try {
    const deployTx = await predictedSafe.createSafeDeploymentTransaction()

    const { createWalletClient, createPublicClient, http, defineChain } = await import('viem')
    const { privateKeyToAccount } = await import('viem/accounts')

    const transport = http(config.provider)
    const publicClient = createPublicClient({ transport })
    const chainId = await publicClient.getChainId()

    const chain = defineChain({
      id: chainId,
      name: `Chain ${chainId}`,
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { default: { http: [config.provider] } },
    })

    const account = privateKeyToAccount(config.signer as `0x${string}`)
    const walletClient = createWalletClient({
      account,
      chain,
      transport,
    })

    const txHash = await walletClient.sendTransaction({
      to: deployTx.to as `0x${string}`,
      data: deployTx.data as `0x${string}`,
      value: BigInt(deployTx.value),
    })
    await publicClient.waitForTransactionReceipt({ hash: txHash })
  } catch (err: any) {
    // "Safe already deployed" means the contract exists — just connect to it
    if (!err?.message?.includes('already deployed')) {
      throw err
    }
  }

  // Phase 3: Re-init pointing at the deployed Safe
  const deployedSafe = await Safe.init({
    provider: config.provider,
    signer: config.signer,
    safeAddress,
  } as any)

  return deployedSafe
}

/**
 * Get info about a Safe instance.
 */
export async function getSafeInfo(safe: SafeInstance, provider?: string): Promise<SafeInfo> {
  const [address, owners, threshold, nonce, chainId, modules] = await Promise.all([
    safe.getAddress(),
    safe.getOwners(),
    safe.getThreshold(),
    safe.getNonce(),
    safe.getChainId(),
    safe.getModules(),
  ])

  // Fetch guard (may fail if no guard is set)
  let guard = ''
  try {
    guard = await safe.getGuard()
    if (guard === '0x0000000000000000000000000000000000000000') guard = ''
  } catch {
    guard = ''
  }

  // Fetch native balance via viem
  let balance = '0'
  if (provider) {
    try {
      const { createPublicClient, http } = await import('viem')
      const publicClient = createPublicClient({ transport: http(provider) })
      const bal = await publicClient.getBalance({ address: address as `0x${string}` })
      balance = bal.toString()
    } catch {
      balance = '0'
    }
  }

  return { address, owners, threshold, nonce, chainId, modules, balance, guard }
}

/**
 * Create a Safe transaction from transaction data.
 */
export async function createTransaction(
  safe: SafeInstance,
  transactions: Array<{ to: string; value: string; data: string; operation?: number }>,
  options?: {
    safeTxGas?: string
    baseGas?: string
    gasPrice?: string
    gasToken?: string
    refundReceiver?: string
    nonce?: number
  },
) {
  return safe.createTransaction({ transactions, options })
}

/**
 * Sign a Safe transaction.
 */
export async function signTransaction(safe: SafeInstance, safeTransaction: SafeTransaction) {
  return safe.signTransaction(safeTransaction)
}

/**
 * Execute a Safe transaction (requires enough signatures).
 */
export async function executeTransaction(safe: SafeInstance, safeTransaction: SafeTransaction) {
  return safe.executeTransaction(safeTransaction)
}

/**
 * Create a transaction to add a new owner to the Safe.
 */
export async function createAddOwnerTx(
  safe: SafeInstance,
  ownerAddress: string,
  threshold?: number,
) {
  return safe.createAddOwnerTx({ ownerAddress, threshold })
}

/**
 * Create a transaction to remove an owner from the Safe.
 */
export async function createRemoveOwnerTx(
  safe: SafeInstance,
  ownerAddress: string,
  threshold?: number,
) {
  return safe.createRemoveOwnerTx({ ownerAddress, threshold })
}

/**
 * Create a transaction to change the Safe's threshold.
 */
export async function createChangeThresholdTx(
  safe: SafeInstance,
  newThreshold: number,
) {
  return safe.createChangeThresholdTx(newThreshold)
}

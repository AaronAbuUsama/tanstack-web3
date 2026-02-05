/**
 * ERC-4337 Account Abstraction integration via Safe modules.
 *
 * This module provides utilities for using Safe as an ERC-4337 smart account.
 * In production, this would integrate with:
 * - Safe 4337 Module (enables Safe as a 4337-compliant account)
 * - An ERC-4337 Bundler (e.g., Pimlico, Stackup, Alchemy)
 * - An ERC-4337 Paymaster (optional, for sponsored transactions)
 */

export interface UserOperation {
  sender: string
  nonce: bigint
  initCode: `0x${string}`
  callData: `0x${string}`
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymasterAndData: `0x${string}`
  signature: `0x${string}`
}

export interface BundlerConfig {
  url: string
  chainId: number
  entryPointAddress: string
}

export interface PaymasterConfig {
  url: string
  type: 'verifying' | 'erc20'
}

export interface AccountAbstractionConfig {
  bundler: BundlerConfig
  paymaster?: PaymasterConfig
  safe4337ModuleAddress?: string
}

/**
 * Check if Account Abstraction infrastructure is available.
 * Requires bundler URL to be configured.
 */
export function isAccountAbstractionAvailable(config?: AccountAbstractionConfig): boolean {
  return !!config?.bundler?.url
}

/**
 * Create a UserOperation for a Safe transaction.
 *
 * In production, this would:
 * 1. Encode the Safe transaction as callData for the 4337 module
 * 2. Estimate gas limits via the bundler
 * 3. Fetch current gas prices
 * 4. Optionally get paymaster data for sponsored transactions
 */
export async function createUserOperation(
  _config: AccountAbstractionConfig,
  params: {
    safeAddress: string
    to: string
    value: string
    data: `0x${string}`
    nonce?: bigint
  },
): Promise<UserOperation> {
  // Stub implementation — in production, this would:
  // 1. Call the bundler's eth_estimateUserOperationGas
  // 2. Encode callData via the Safe 4337 module
  // 3. Apply paymaster sponsorship if configured

  return {
    sender: params.safeAddress,
    nonce: params.nonce ?? 0n,
    initCode: '0x',
    callData: params.data,
    callGasLimit: 100000n,
    verificationGasLimit: 100000n,
    preVerificationGas: 50000n,
    maxFeePerGas: 1000000000n, // 1 gwei
    maxPriorityFeePerGas: 100000000n, // 0.1 gwei
    paymasterAndData: '0x',
    signature: '0x',
  }
}

/**
 * Send a UserOperation to the bundler.
 *
 * In production, this would call eth_sendUserOperation on the bundler.
 * Returns the UserOperation hash.
 */
export async function sendUserOperation(
  config: AccountAbstractionConfig,
  userOp: UserOperation,
): Promise<string> {
  if (!isAccountAbstractionAvailable(config)) {
    throw new Error('Account Abstraction not configured: bundler URL required')
  }

  // In production: POST to bundler's JSON-RPC endpoint
  // Method: eth_sendUserOperation
  const response = await fetch(config.bundler.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_sendUserOperation',
      params: [
        {
          sender: userOp.sender,
          nonce: `0x${userOp.nonce.toString(16)}`,
          initCode: userOp.initCode,
          callData: userOp.callData,
          callGasLimit: `0x${userOp.callGasLimit.toString(16)}`,
          verificationGasLimit: `0x${userOp.verificationGasLimit.toString(16)}`,
          preVerificationGas: `0x${userOp.preVerificationGas.toString(16)}`,
          maxFeePerGas: `0x${userOp.maxFeePerGas.toString(16)}`,
          maxPriorityFeePerGas: `0x${userOp.maxPriorityFeePerGas.toString(16)}`,
          paymasterAndData: userOp.paymasterAndData,
          signature: userOp.signature,
        },
        config.bundler.entryPointAddress,
      ],
    }),
  })

  const data = await response.json()
  if (data.error) {
    throw new Error(`Bundler error: ${data.error.message}`)
  }

  return data.result // UserOperation hash
}

/**
 * Check the status of a submitted UserOperation.
 *
 * In production: calls eth_getUserOperationReceipt on the bundler.
 */
export async function getUserOperationStatus(
  config: AccountAbstractionConfig,
  userOpHash: string,
): Promise<{
  success: boolean
  transactionHash?: string
  reason?: string
}> {
  if (!isAccountAbstractionAvailable(config)) {
    throw new Error('Account Abstraction not configured')
  }

  const response = await fetch(config.bundler.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getUserOperationReceipt',
      params: [userOpHash],
    }),
  })

  const data = await response.json()
  if (data.error) {
    return { success: false, reason: data.error.message }
  }

  if (!data.result) {
    return { success: false, reason: 'UserOperation not found (may still be pending)' }
  }

  return {
    success: data.result.success,
    transactionHash: data.result.receipt?.transactionHash,
  }
}

/**
 * Default ERC-4337 Entry Point addresses by chain.
 */
export const ENTRY_POINT_ADDRESSES: Record<number, string> = {
  1: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',      // Mainnet
  11155111: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789', // Sepolia
  100: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',      // Gnosis
  10200: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',    // Gnosis Chiado
}

/**
 * Relay Kit integration for gasless/sponsored transactions.
 * Requires VITE_GELATO_API_KEY environment variable.
 */

const GELATO_API_KEY = typeof import.meta !== 'undefined'
  ? (import.meta as any).env?.VITE_GELATO_API_KEY
  : undefined

/**
 * Check if relay is available (API key configured).
 */
export function isRelayAvailable(): boolean {
  return typeof GELATO_API_KEY === 'string' && GELATO_API_KEY.length > 0
}

/**
 * Get the Gelato API key.
 * Returns null if not configured.
 */
export function getGelatoApiKey(): string | null {
  return isRelayAvailable() ? GELATO_API_KEY : null
}

export interface RelayTransactionParams {
  chainId: bigint
  target: string
  encodedTransaction: string
}

export interface RelayResponse {
  taskId: string
}

/**
 * Relay a transaction via Gelato (gasless).
 * Requires VITE_GELATO_API_KEY to be set.
 * Returns null if relay is not configured.
 */
export async function relayTransaction(
  params: RelayTransactionParams,
): Promise<RelayResponse | null> {
  if (!isRelayAvailable()) {
    console.warn('Relay Kit: VITE_GELATO_API_KEY not configured. Gasless transactions unavailable.')
    return null
  }

  // Gelato Relay API endpoint
  const response = await fetch('https://relay.gelato.digital/relays/v2/sponsored-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chainId: params.chainId.toString(),
      target: params.target,
      data: params.encodedTransaction,
      sponsorApiKey: GELATO_API_KEY,
    }),
  })

  if (!response.ok) {
    throw new Error(`Relay failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return { taskId: data.taskId }
}

/**
 * Check the status of a relayed transaction.
 */
export async function getRelayStatus(taskId: string): Promise<{
  taskState: string
  transactionHash?: string
}> {
  const response = await fetch(
    `https://relay.gelato.digital/tasks/status/${taskId}`,
  )

  if (!response.ok) {
    throw new Error(`Failed to get relay status: ${response.status}`)
  }

  const data = await response.json()
  return {
    taskState: data.task?.taskState ?? 'unknown',
    transactionHash: data.task?.transactionHash,
  }
}

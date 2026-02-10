import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useAccount, useChainId } from 'wagmi'
import ConnectWallet from '../web3/ConnectWallet'
import { DEV_WALLET_PRIVATE_KEY } from '../web3/dev-wallet'
import { useSafe } from '../safe/core/use-safe'
import SetupView from '../safe/governance/SetupView'
import DashboardView from '../safe/transactions/DashboardView'
import { resolveRuntimePolicy } from '../safe/runtime'

/**
 * Map a wallet chainId to the correct RPC URL for Protocol Kit.
 * In dev mode, Chiado (10200) routes to the local Anvil fork.
 */
function getRpcUrl(chainId: number): string {
  switch (chainId) {
    case 10200:
      return import.meta.env.DEV ? 'http://127.0.0.1:8545' : 'https://rpc.chiadochain.net'
    case 100:
      return 'https://rpc.gnosischain.com'
    case 11155111:
      return 'https://rpc.sepolia.org'
    case 1:
      return 'https://eth.llamarpc.com'
    default:
      return 'https://rpc.chiadochain.net'
  }
}

export const Route = createFileRoute('/safe')({
  component: SafeDashboard,
})

function SafeDashboard() {
  const { isConnected, address, chain, connector } = useAccount()
  const chainId = useChainId()
  const safe = useSafe()
  const rpcUrl = getRpcUrl(chainId)
  const runtimePolicy = resolveRuntimePolicy({
    appContext: safe.mode === 'iframe' ? 'safe-app-iframe' : 'standalone',
    isConnected,
    connectorId: connector?.id ?? null,
  })

  // Track the chainId the Safe was connected on to detect chain switches
  const prevChainRef = useRef<number | null>(null)

  useEffect(() => {
    if (!safe.isInSafe || !safe.safeAddress || !chainId) {
      prevChainRef.current = null
      return
    }

    // First mount with Safe connected — just record the chain
    if (prevChainRef.current === null) {
      prevChainRef.current = chainId
      return
    }

    // Same chain — no action
    if (prevChainRef.current === chainId) return
    prevChainRef.current = chainId

    // Chain changed — try reconnecting Safe on new chain
    const newRpc = getRpcUrl(chainId)
    safe.connectSafe(safe.safeAddress, newRpc, DEV_WALLET_PRIVATE_KEY).catch(() => {
      safe.disconnectSafe()
    })
  }, [chainId, safe.isInSafe, safe.safeAddress])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Safe Dashboard</h1>
        <p className="text-gray-400 mb-8">
          Gnosis Safe multi-sig management
        </p>

        {!isConnected && (
          <div className="bg-gray-800 rounded-xl p-12 text-center mb-6">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">
              Connect a wallet to create or manage a Safe.
            </p>
            <ConnectWallet />
          </div>
        )}

        {safe.loading && !isConnected && (
          <div className="bg-gray-800 rounded-xl p-12 text-center mb-6">
            <div className="animate-pulse text-gray-400">Detecting Safe environment...</div>
          </div>
        )}

        {!safe.isInSafe && isConnected && (
          <SetupView
            address={address}
            safe={safe}
            rpcUrl={rpcUrl}
            runtimePolicy={runtimePolicy}
          />
        )}

        {safe.isInSafe && (
          <DashboardView address={address} chain={chain} safe={safe} rpcUrl={rpcUrl} />
        )}
      </div>
    </div>
  )
}

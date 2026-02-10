import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useAccount, useChainId } from 'wagmi'
import ConnectWallet from '../web3/ConnectWallet'
import { getDevWalletActiveSigner } from '../web3/dev-wallet'
import { useSafe } from '../safe/core/use-safe'
import SetupView from '../safe/governance/SetupView'
import DashboardView from '../safe/transactions/DashboardView'
import { resolveRuntimePolicy } from '../safe/runtime'
import { normalizeSafeScreenSearch } from '../safe/screens/screen-state'

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

function isLocalRpcUrl(rpcUrl: string) {
  return /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(rpcUrl)
}

function isTxServiceSupportedChain(chainId: number) {
  return chainId === 1 || chainId === 100 || chainId === 10200 || chainId === 11155111
}

export const Route = createFileRoute('/safe')({
  validateSearch: (search: Record<string, unknown>) => normalizeSafeScreenSearch(search),
  component: SafeDashboard,
})

function SafeDashboard() {
  const { screen } = Route.useSearch()
  const { isConnected, address, chain, connector } = useAccount()
  const chainId = useChainId()
  const safe = useSafe()
  const rpcUrl = getRpcUrl(chainId)
  const txServiceSupportedChain = isTxServiceSupportedChain(chainId)
  const txServiceEnabled = txServiceSupportedChain && !isLocalRpcUrl(rpcUrl)
  const runtimePolicy = resolveRuntimePolicy({
    appContext: safe.mode === 'iframe' ? 'safe-app-iframe' : 'standalone',
    isConnected,
    connectorId: connector?.id ?? null,
    txServiceEnabled,
    txServiceSupportedChain,
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
    const signer = runtimePolicy.signerProvider === 'dev-mnemonic-account'
      ? getDevWalletActiveSigner()
      : undefined
    safe.connectSafe(safe.safeAddress, newRpc, signer).catch(() => {
      safe.disconnectSafe()
    })
  }, [chainId, runtimePolicy.signerProvider, safe.isInSafe, safe.safeAddress])

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
          <DashboardView
            activeScreen={screen}
            address={address}
            chain={chain}
            safe={safe}
            rpcUrl={rpcUrl}
          />
        )}
      </div>
    </div>
  )
}

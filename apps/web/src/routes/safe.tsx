import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useAccount, useChainId, useDisconnect } from 'wagmi'
import { getDevWalletActiveSigner } from '../web3/dev-wallet'
import { useSafe } from '../safe/core/use-safe'
import SetupView from '../safe/governance/SetupView'
import DashboardView from '../safe/transactions/DashboardView'
import { resolveRuntimePolicy } from '../safe/runtime'
import { SafeStatusBarWalletControls } from '../safe/runtime/SafeStatusBarWalletControls'
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
  const { disconnect } = useDisconnect()
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
  const clearScreenSearch = () => {
    const url = new URL(window.location.href)
    if (!url.searchParams.has('screen')) return
    url.searchParams.delete('screen')
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  const handleDisconnect = () => {
    safe.disconnectSafe()
    clearScreenSearch()
    if (isConnected) {
      disconnect()
    }
  }

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
      clearScreenSearch()
    })
  }, [chainId, runtimePolicy.signerProvider, safe.isInSafe, safe.safeAddress])

  return (
    <>
      {!safe.isInSafe && (
        <SetupView
          activeScreen={screen}
          address={address}
          chainLabel={chain?.name}
          onDisconnect={handleDisconnect}
          safe={safe}
          rpcUrl={rpcUrl}
          runtimePolicy={runtimePolicy}
          statusBarWalletControls={<SafeStatusBarWalletControls onDisconnect={handleDisconnect} />}
        />
      )}

      {safe.isInSafe && (
        <DashboardView
          activeScreen={screen}
          address={address}
          chain={chain}
          onDisconnect={handleDisconnect}
          safe={safe}
          rpcUrl={rpcUrl}
          statusBarWalletControls={<SafeStatusBarWalletControls onDisconnect={handleDisconnect} />}
        />
      )}
    </>
  )
}

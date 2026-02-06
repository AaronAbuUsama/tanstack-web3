import { createFileRoute } from '@tanstack/react-router'
import { formatUnits, parseEther } from 'viem'
import { useState, useEffect, useRef } from 'react'
import { useAccount, useChainId } from 'wagmi'
import ConnectWallet from '../components/ConnectWallet'
import { useSafe } from '../lib/safe/hooks'
import { createAddOwnerTx, createRemoveOwnerTx, createChangeThresholdTx, createTransaction, signTransaction, executeTransaction } from '../lib/safe/standalone'
import Owners from '../components/safe/Owners'
import Threshold from '../components/safe/Threshold'
import GuardPanel from '../components/safe/GuardPanel'
import ModulePanel from '../components/safe/ModulePanel'
import AddressDisplay from '../components/web3/AddressDisplay'
import ChainBadge from '../components/web3/ChainBadge'
import TokenBalances from '../components/web3/TokenBalances'
import TxBuilder from '../components/safe/TxBuilder'
import TxQueue from '../components/safe/TxQueue'
import TxHistory from '../components/safe/TxHistory'
import TransactionFlow from '../components/safe/TransactionFlow'
import SafeOverview from '../components/safe/SafeOverview'
import { buildTransaction } from '../lib/safe/transactions'
import { sendTransactions as sendIframeTxs } from '../lib/safe/iframe'
import type { SafeTransaction } from '../lib/safe/types'

/** Dev wallet private key — same key used by the dev-wallet connector (Anvil account #0). */
const DEV_SIGNER =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

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

/* ── Transaction persistence helpers ── */

interface LocalTx {
  id: string
  to: string
  value: string
  data: string
  safeTransaction: SafeTransaction | null
  status: 'pending' | 'signed' | 'executed'
  txHash?: string
}

interface PersistedTx {
  id: string
  to: string
  value: string
  data: string
  status: 'pending' | 'signed' | 'executed'
  txHash?: string
}

function getTxStorageKey(safeAddress: string) {
  return `safe-txs-${safeAddress}`
}

function loadPersistedTxs(safeAddress: string): PersistedTx[] {
  try {
    const raw = localStorage.getItem(getTxStorageKey(safeAddress))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistTxs(safeAddress: string, txs: LocalTx[]) {
  try {
    const serializable: PersistedTx[] = txs.map(({ id, to, value, data, status, txHash }) => ({
      id, to, value, data, status, txHash,
    }))
    localStorage.setItem(getTxStorageKey(safeAddress), JSON.stringify(serializable))
  } catch {
    // localStorage may be full or unavailable
  }
}

export const Route = createFileRoute('/safe')({
  component: SafeDashboard,
})

function SafeDashboard() {
  const { isConnected, address, chain } = useAccount()
  const chainId = useChainId()
  const safe = useSafe()
  const rpcUrl = getRpcUrl(chainId)

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
    safe.connectSafe(safe.safeAddress, newRpc, DEV_SIGNER).catch(() => {
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
          <SetupView address={address} safe={safe} rpcUrl={rpcUrl} />
        )}

        {safe.isInSafe && (
          <DashboardView address={address} chain={chain} safe={safe} rpcUrl={rpcUrl} />
        )}
      </div>
    </div>
  )
}

function SetupView({
  address,
  safe,
  rpcUrl,
}: {
  address: string | undefined
  safe: ReturnType<typeof useSafe>
  rpcUrl: string
}) {
  const [owners, setOwners] = useState<string[]>([address ?? ''])
  const [threshold, setThreshold] = useState(1)
  const [deploying, setDeploying] = useState(false)

  const [connectAddress, setConnectAddress] = useState('')
  const [connecting, setConnecting] = useState(false)

  const handleDeploy = async () => {
    setDeploying(true)
    try {
      await safe.deploySafe({
        owners,
        threshold,
        provider: rpcUrl,
        signer: DEV_SIGNER,
      })
    } finally {
      setDeploying(false)
    }
  }

  const handleConnect = async () => {
    if (!connectAddress) return
    setConnecting(true)
    try {
      await safe.connectSafe(connectAddress, rpcUrl)
    } finally {
      setConnecting(false)
    }
  }

  const addOwner = () => {
    setOwners((prev) => [...prev, ''])
  }

  const removeOwner = (index: number) => {
    setOwners((prev) => prev.filter((_, i) => i !== index))
    setThreshold((prev) => Math.min(prev, owners.length - 1))
  }

  const updateOwner = (index: number, value: string) => {
    setOwners((prev) => prev.map((o, i) => (i === index ? value : o)))
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Create New Safe */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Safe</h2>

          <label className="block text-sm text-gray-400 mb-2">
            Owners
          </label>
          <div className="space-y-2 mb-3">
            {owners.map((owner, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => updateOwner(i, e.target.value)}
                  placeholder="0x..."
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-cyan-500 focus:outline-none font-mono"
                />
                {owners.length > 1 && (
                  <button
                    onClick={() => removeOwner(i)}
                    className="px-3 py-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addOwner}
            className="text-sm text-cyan-400 hover:text-cyan-300 mb-4 transition-colors"
          >
            + Add Owner
          </button>

          <label className="block text-sm text-gray-400 mb-2">
            Threshold ({threshold} of {owners.length})
          </label>
          <div className="flex gap-2 mb-6">
            {Array.from({ length: owners.length }, (_, i) => i + 1).map(
              (n) => (
                <button
                  key={n}
                  onClick={() => setThreshold(n)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    n === threshold
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {n}
                </button>
              ),
            )}
          </div>

          <button
            onClick={handleDeploy}
            disabled={deploying || owners.some((o) => !o)}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {deploying ? 'Deploying...' : 'Deploy Safe'}
          </button>
        </div>

        {/* Connect to Existing Safe */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">
            Connect to Existing Safe
          </h2>
          <label className="block text-sm text-gray-400 mb-2">
            Safe Address
          </label>
          <input
            type="text"
            value={connectAddress}
            onChange={(e) => setConnectAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-cyan-500 focus:outline-none font-mono mb-4"
          />
          <button
            onClick={handleConnect}
            disabled={connecting || !connectAddress}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </div>

      {safe.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          {safe.error}
        </div>
      )}
    </>
  )
}

function FundSafe({ safeAddress, rpcUrl, signer, onFunded }: {
  safeAddress: string
  rpcUrl: string
  signer: string
  onFunded: () => Promise<void>
}) {
  const [amount, setAmount] = useState('1')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const handleFund = async () => {
    setLoading(true)
    setStatus(null)
    try {
      const { createWalletClient, createPublicClient, http, defineChain } = await import('viem')
      const { privateKeyToAccount } = await import('viem/accounts')

      const transport = http(rpcUrl)
      const publicClient = createPublicClient({ transport })
      const chainId = await publicClient.getChainId()

      const chain = defineChain({
        id: chainId,
        name: `Chain ${chainId}`,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] } },
      })

      const account = privateKeyToAccount(signer as `0x${string}`)
      const walletClient = createWalletClient({ account, chain, transport })

      const hash = await walletClient.sendTransaction({
        to: safeAddress as `0x${string}`,
        value: parseEther(amount),
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setStatus(`Sent ${amount} ETH to Safe`)
      await onFunded()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to fund Safe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 mt-4">
      <h3 className="text-sm font-semibold text-amber-400 mb-2">Dev Faucet</h3>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.1"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-amber-500 focus:outline-none"
        />
        <button
          onClick={handleFund}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Sending...' : 'Fund Safe'}
        </button>
      </div>
      {status && <p className="text-xs text-gray-400 mt-2">{status}</p>}
    </div>
  )
}

function DashboardView({
  address,
  chain,
  safe,
  rpcUrl,
}: {
  address: string | undefined
  chain: { name: string; id: number } | undefined
  safe: ReturnType<typeof useSafe>
  rpcUrl: string
}) {
  const [operationLoading, setOperationLoading] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)

  // Transaction state
  const [transactions, setTransactions] = useState<LocalTx[]>([])
  const [txError, setTxError] = useState<string | null>(null)
  const [txBusy, setTxBusy] = useState(false)

  // Restore persisted transactions on mount
  useEffect(() => {
    if (safe.safeAddress) {
      const persisted = loadPersistedTxs(safe.safeAddress)
      if (persisted.length > 0) {
        setTransactions(persisted.map(p => ({
          ...p,
          safeTransaction: null,
        })))
      }
    }
  }, [safe.safeAddress])

  const updateTransactions = (updater: (prev: LocalTx[]) => LocalTx[]) => {
    setTransactions(prev => {
      const next = updater(prev)
      if (safe.safeAddress) persistTxs(safe.safeAddress, next)
      return next
    })
  }

  const handleAddOwner = async (ownerAddress: string) => {
    if (!safe.safeInstance || !safe.safeAddress) return
    setOperationLoading(true)
    setOperationError(null)
    try {
      const tx = await createAddOwnerTx(safe.safeInstance, ownerAddress)
      const signed = await signTransaction(safe.safeInstance, tx)
      await executeTransaction(safe.safeInstance, signed)
      await safe.connectSafe(safe.safeAddress, rpcUrl, DEV_SIGNER)
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Failed to add owner')
    } finally {
      setOperationLoading(false)
    }
  }

  const handleRemoveOwner = async (ownerAddress: string) => {
    if (!safe.safeInstance || !safe.safeAddress) return
    setOperationLoading(true)
    setOperationError(null)
    try {
      const newThreshold = Math.min(safe.threshold, safe.owners.length - 1)
      const tx = await createRemoveOwnerTx(safe.safeInstance, ownerAddress, newThreshold)
      const signed = await signTransaction(safe.safeInstance, tx)
      await executeTransaction(safe.safeInstance, signed)
      await safe.connectSafe(safe.safeAddress, rpcUrl, DEV_SIGNER)
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Failed to remove owner')
    } finally {
      setOperationLoading(false)
    }
  }

  const handleChangeThreshold = async (newThreshold: number) => {
    if (!safe.safeInstance || !safe.safeAddress) return
    setOperationLoading(true)
    setOperationError(null)
    try {
      const tx = await createChangeThresholdTx(safe.safeInstance, newThreshold)
      const signed = await signTransaction(safe.safeInstance, tx)
      await executeTransaction(safe.safeInstance, signed)
      await safe.connectSafe(safe.safeAddress, rpcUrl, DEV_SIGNER)
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Failed to change threshold')
    } finally {
      setOperationLoading(false)
    }
  }

  /* ── Transaction handlers ── */

  const handleBuild = async (tx: { to: string; value: string; data: string }) => {
    setTxError(null)
    setTxBusy(true)

    // Iframe mode: use Safe Apps SDK
    if (safe.mode === 'iframe') {
      try {
        const safeTxHash = await sendIframeTxs([{
          to: tx.to,
          value: parseEther(tx.value || '0').toString(),
          data: tx.data || '0x',
        }])
        const localTx: LocalTx = {
          id: safeTxHash,
          to: tx.to,
          value: tx.value || '0',
          data: tx.data || '0x',
          safeTransaction: null,
          status: 'executed',
          txHash: safeTxHash,
        }
        updateTransactions((prev) => [localTx, ...prev])
      } catch (err) {
        setTxError(err instanceof Error ? err.message : 'Failed to send iframe transaction')
      } finally {
        setTxBusy(false)
      }
      return
    }

    if (!safe.safeInstance) {
      setTxError('No Safe instance available. Connect to a Safe first.')
      setTxBusy(false)
      return
    }

    try {
      const txData = buildTransaction({
        to: tx.to as `0x${string}`,
        value: tx.value !== '0' ? tx.value : undefined,
        data: tx.data !== '0x' ? (tx.data as `0x${string}`) : undefined,
      })

      const safeTx = await createTransaction(safe.safeInstance, [txData])

      const localTx: LocalTx = {
        id: crypto.randomUUID(),
        to: tx.to,
        value: tx.value,
        data: tx.data,
        safeTransaction: safeTx,
        status: 'pending',
      }

      // For 1-of-1 threshold: auto-sign + auto-execute
      if (safe.threshold === 1) {
        const signed = await signTransaction(safe.safeInstance, safeTx)
        localTx.safeTransaction = signed
        localTx.status = 'signed'

        const result = await executeTransaction(safe.safeInstance, signed)
        localTx.status = 'executed'
        localTx.txHash = result.hash
      }

      updateTransactions((prev) => [localTx, ...prev])
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Failed to build transaction')
    } finally {
      setTxBusy(false)
    }
  }

  const handleConfirm = async (safeTxHash: string) => {
    setTxError(null)
    setTxBusy(true)

    if (!safe.safeInstance) {
      setTxError('No Safe instance available')
      setTxBusy(false)
      return
    }

    try {
      const tx = transactions.find((t) => t.id === safeTxHash)
      if (!tx) return

      let safeTx = tx.safeTransaction
      if (!safeTx && safe.safeInstance) {
        const txData = buildTransaction({
          to: tx.to as `0x${string}`,
          value: tx.value !== '0' ? tx.value : undefined,
          data: tx.data !== '0x' ? (tx.data as `0x${string}`) : undefined,
        })
        safeTx = await createTransaction(safe.safeInstance, [txData])
        updateTransactions(prev =>
          prev.map(t => t.id === tx.id ? { ...t, safeTransaction: safeTx } : t),
        )
      }
      if (!safeTx) {
        setTxError('Could not rebuild transaction. Connect to a Safe first.')
        setTxBusy(false)
        return
      }

      const signed = await signTransaction(safe.safeInstance, safeTx)

      updateTransactions((prev) =>
        prev.map((t) =>
          t.id === safeTxHash ? { ...t, safeTransaction: signed, status: 'signed' as const } : t,
        ),
      )
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Failed to sign transaction')
    } finally {
      setTxBusy(false)
    }
  }

  const handleExecute = async (safeTxHash: string) => {
    setTxError(null)
    setTxBusy(true)

    if (!safe.safeInstance) {
      setTxError('No Safe instance available')
      setTxBusy(false)
      return
    }

    try {
      const tx = transactions.find((t) => t.id === safeTxHash)
      if (!tx) return

      let safeTx = tx.safeTransaction
      if (!safeTx && safe.safeInstance) {
        const txData = buildTransaction({
          to: tx.to as `0x${string}`,
          value: tx.value !== '0' ? tx.value : undefined,
          data: tx.data !== '0x' ? (tx.data as `0x${string}`) : undefined,
        })
        safeTx = await createTransaction(safe.safeInstance, [txData])
        updateTransactions(prev =>
          prev.map(t => t.id === tx.id ? { ...t, safeTransaction: safeTx } : t),
        )
      }
      if (!safeTx) {
        setTxError('Could not rebuild transaction. Connect to a Safe first.')
        setTxBusy(false)
        return
      }

      const result = await executeTransaction(safe.safeInstance, safeTx)

      updateTransactions((prev) =>
        prev.map((t) =>
          t.id === safeTxHash
            ? { ...t, status: 'executed' as const, txHash: result.hash }
            : t,
        ),
      )
    } catch (err) {
      setTxError(err instanceof Error ? err.message : 'Failed to execute transaction')
    } finally {
      setTxBusy(false)
    }
  }

  const pendingTxs = transactions
    .filter((t) => t.status !== 'executed')
    .map((t) => ({
      safeTxHash: t.id,
      to: t.to,
      value: t.value,
      confirmations: t.status === 'signed' ? safe.threshold : 0,
      threshold: safe.threshold,
      restored: t.safeTransaction === null,
    }))

  const executedTxs = transactions
    .filter((t) => t.status === 'executed')
    .map((t) => ({
      safeTxHash: t.id,
      to: t.to,
      value: t.value,
      transactionHash: t.txHash || '',
    }))

  return (
    <>
      {/* Safe info header */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-4">
            {chain && (
              <ChainBadge
                chainName={chain.name}
                chainId={chain.id}
                isConnected
              />
            )}
            {safe.safeAddress && (
              <AddressDisplay address={safe.safeAddress} />
            )}
          </div>
          <button
            onClick={safe.disconnectSafe}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Disconnect
          </button>
        </div>
        {safe.safeAddress && (
          <div className="border-t border-gray-700 pt-3">
            <span className="text-xs text-gray-500 block mb-1">Safe Address</span>
            <code className="text-sm text-cyan-300 font-mono break-all select-all">{safe.safeAddress}</code>
          </div>
        )}
      </div>

      {safe.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm mb-6">
          {safe.error}
        </div>
      )}

      <SafeOverview
        owners={safe.owners}
        threshold={safe.threshold}
        guard={safe.guard}
        rpcUrl={rpcUrl}
        moduleCount={safe.modules.length}
      />

      {operationLoading && (
        <div className="bg-cyan-900/30 border border-cyan-700 rounded-xl p-4 mb-6">
          <p className="text-cyan-300 text-sm">Processing Safe operation...</p>
        </div>
      )}

      {operationError && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm mb-6">
          {operationError}
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Owners owners={safe.owners} currentAddress={address} onAddOwner={handleAddOwner} onRemoveOwner={handleRemoveOwner} />
        <Threshold
          threshold={safe.threshold}
          ownerCount={safe.owners.length}
          onChangeThreshold={handleChangeThreshold}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <TokenBalances
            tokens={safe.balance !== '0' ? [{
              name: 'xDAI',
              symbol: 'xDAI',
              balance: formatUnits(BigInt(safe.balance), 18),
            }] : []}
            loading={false}
          />
          {import.meta.env.DEV && (
            <FundSafe
              safeAddress={safe.safeAddress!}
              rpcUrl={rpcUrl}
              signer={DEV_SIGNER}
              onFunded={async () => { await safe.connectSafe(safe.safeAddress!, rpcUrl, DEV_SIGNER) }}
            />
          )}
        </div>
        <GuardPanel
          guard={safe.guard}
          safeAddress={safe.safeAddress!}
          safeInstance={safe.safeInstance!}
          rpcUrl={rpcUrl}
          signer={DEV_SIGNER}
          onRefresh={async () => { await safe.connectSafe(safe.safeAddress!, rpcUrl, DEV_SIGNER) }}
        />
      </div>

      <div className="mb-6">
        <ModulePanel
          modules={safe.modules}
          safeAddress={safe.safeAddress!}
          safeInstance={safe.safeInstance!}
          rpcUrl={rpcUrl}
          signer={DEV_SIGNER}
          onRefresh={async () => { await safe.connectSafe(safe.safeAddress!, rpcUrl, DEV_SIGNER) }}
        />
      </div>

      {/* Transaction Builder */}
      <div className="space-y-6 mb-6">
        <h2 className="text-xl font-semibold">Transactions</h2>

        {txError && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-4">
            <p className="text-red-300 text-sm">{txError}</p>
          </div>
        )}

        {txBusy && (
          <div className="bg-cyan-900/30 border border-cyan-700 rounded-xl p-4">
            <p className="text-cyan-300 text-sm">Processing transaction...</p>
          </div>
        )}

        {safe.threshold > 1 && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4">
            <p className="text-amber-300 text-sm">
              <strong>Multi-sig mode:</strong> This Safe requires {safe.threshold} of {safe.owners.length} confirmations.
            </p>
          </div>
        )}

        <TxBuilder onBuild={handleBuild} />

        {/* Latest pending tx detail */}
        {transactions.filter((t) => t.status !== 'executed').length > 0 && (() => {
          const latest = transactions.find((t) => t.status !== 'executed')!
          const isRestored = latest.safeTransaction === null
          return (
            <>
              {isRestored && (
                <p className="text-amber-400 text-xs mb-2">This transaction was restored from cache and will be rebuilt when confirmed.</p>
              )}
              <TransactionFlow
                transaction={{
                  safeTxHash: latest.id,
                  to: latest.to,
                  value: latest.value,
                  data: latest.data,
                  status: {
                    safeTxHash: latest.id,
                    confirmations: latest.status === 'signed' ? safe.threshold : 0,
                    threshold: safe.threshold,
                    isReady: latest.status === 'signed',
                    isExecuted: false,
                  },
                }}
                currentAddress={address}
                onConfirm={handleConfirm}
                onExecute={handleExecute}
              />
            </>
          )
        })()}

        <TxQueue
          transactions={pendingTxs}
          threshold={safe.threshold}
          onConfirm={handleConfirm}
          onExecute={handleExecute}
        />
        <TxHistory transactions={executedTxs} />
      </div>
    </>
  )
}

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useSafe } from '../lib/safe/hooks'
import TxBuilder from '../components/safe/TxBuilder'
import TxQueue from '../components/safe/TxQueue'
import TxHistory from '../components/safe/TxHistory'
import TransactionFlow from '../components/safe/TransactionFlow'
import { buildTransaction } from '../lib/safe/transactions'
import { createTransaction, signTransaction, executeTransaction } from '../lib/safe/standalone'

export const Route = createFileRoute('/safe/transactions')({
  component: TransactionsPage,
})

interface LocalTx {
  id: string
  to: string
  value: string
  data: string
  safeTransaction: any
  status: 'pending' | 'signed' | 'executed'
  txHash?: string
}

function TransactionsPage() {
  const safe = useSafe()
  const { address } = useAccount()

  const [transactions, setTransactions] = useState<LocalTx[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!safe.isInSafe) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Safe Transactions</h1>
          <p className="text-gray-400 mb-8">Build and manage multi-sig transactions</p>
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">No Safe Connected</h2>
            <p className="text-gray-400 mb-6">Connect to a Safe first to build and manage transactions.</p>
            <Link
              to="/safe"
              className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors"
            >
              Go to Safe Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleBuild = async (tx: { to: string; value: string; data: string }) => {
    setError(null)
    setBusy(true)
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

      setTransactions((prev) => [localTx, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build transaction')
    } finally {
      setBusy(false)
    }
  }

  const handleConfirm = async (safeTxHash: string) => {
    setError(null)
    setBusy(true)
    try {
      const tx = transactions.find((t) => t.id === safeTxHash)
      if (!tx) return

      const signed = await signTransaction(safe.safeInstance, tx.safeTransaction)

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === safeTxHash ? { ...t, safeTransaction: signed, status: 'signed' as const } : t,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign transaction')
    } finally {
      setBusy(false)
    }
  }

  const handleExecute = async (safeTxHash: string) => {
    setError(null)
    setBusy(true)
    try {
      const tx = transactions.find((t) => t.id === safeTxHash)
      if (!tx) return

      const result = await executeTransaction(safe.safeInstance, tx.safeTransaction)

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === safeTxHash
            ? { ...t, status: 'executed' as const, txHash: result.hash }
            : t,
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute transaction')
    } finally {
      setBusy(false)
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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Safe Transactions</h1>
        <p className="text-gray-400 mb-8">
          Build and manage multi-sig transactions for{' '}
          <span className="font-mono text-cyan-400">
            {safe.safeAddress?.slice(0, 10)}...{safe.safeAddress?.slice(-8)}
          </span>
        </p>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-4 mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {busy && (
          <div className="bg-cyan-900/30 border border-cyan-700 rounded-xl p-4 mb-6">
            <p className="text-cyan-300 text-sm">Processing transaction...</p>
          </div>
        )}

        <div className="space-y-6">
          <TxBuilder onBuild={handleBuild} />

          {/* Show most recent non-executed tx in TransactionFlow detail view */}
          {transactions.filter((t) => t.status !== 'executed').length > 0 && (() => {
            const latest = transactions.find((t) => t.status !== 'executed')!
            return (
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
            )
          })()}

          <TxQueue
            transactions={pendingTxs}
            onConfirm={handleConfirm}
            onExecute={handleExecute}
          />
          <TxHistory transactions={executedTxs} />
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { parseEther } from 'viem'
import { buildTransaction } from './transactions'
import { sendTransactions as sendIframeTxs } from '../core/iframe'
import { createTransaction, signTransaction, executeTransaction } from '../core/standalone'
import type { SafeTransaction, SafeInstance } from '../core/types'
import type { SafeMode } from '../core/detect'

export interface LocalTx {
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

interface UseTransactionsParams {
  safeAddress: string | null
  safeInstance: SafeInstance | null
  threshold: number
  mode: SafeMode
}

export function useTransactions({ safeAddress, safeInstance, threshold, mode }: UseTransactionsParams) {
  const [transactions, setTransactions] = useState<LocalTx[]>([])
  const [txError, setTxError] = useState<string | null>(null)
  const [txBusy, setTxBusy] = useState(false)

  // Restore persisted transactions on mount
  useEffect(() => {
    if (safeAddress) {
      const persisted = loadPersistedTxs(safeAddress)
      if (persisted.length > 0) {
        setTransactions(persisted.map(p => ({
          ...p,
          safeTransaction: null,
        })))
      }
    }
  }, [safeAddress])

  const updateTransactions = (updater: (prev: LocalTx[]) => LocalTx[]) => {
    setTransactions(prev => {
      const next = updater(prev)
      if (safeAddress) persistTxs(safeAddress, next)
      return next
    })
  }

  const handleBuild = async (tx: { to: string; value: string; data: string }) => {
    setTxError(null)
    setTxBusy(true)

    // Iframe mode: use Safe Apps SDK
    if (mode === 'iframe') {
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

    if (!safeInstance) {
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

      const safeTx = await createTransaction(safeInstance, [txData])

      const localTx: LocalTx = {
        id: crypto.randomUUID(),
        to: tx.to,
        value: tx.value,
        data: tx.data,
        safeTransaction: safeTx,
        status: 'pending',
      }

      // For 1-of-1 threshold: auto-sign + auto-execute
      if (threshold === 1) {
        const signed = await signTransaction(safeInstance, safeTx)
        localTx.safeTransaction = signed
        localTx.status = 'signed'

        const result = await executeTransaction(safeInstance, signed)
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

    if (!safeInstance) {
      setTxError('No Safe instance available')
      setTxBusy(false)
      return
    }

    try {
      const tx = transactions.find((t) => t.id === safeTxHash)
      if (!tx) return

      let safeTx = tx.safeTransaction
      if (!safeTx && safeInstance) {
        const txData = buildTransaction({
          to: tx.to as `0x${string}`,
          value: tx.value !== '0' ? tx.value : undefined,
          data: tx.data !== '0x' ? (tx.data as `0x${string}`) : undefined,
        })
        safeTx = await createTransaction(safeInstance, [txData])
        updateTransactions(prev =>
          prev.map(t => t.id === tx.id ? { ...t, safeTransaction: safeTx } : t),
        )
      }
      if (!safeTx) {
        setTxError('Could not rebuild transaction. Connect to a Safe first.')
        setTxBusy(false)
        return
      }

      const signed = await signTransaction(safeInstance, safeTx)

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

    if (!safeInstance) {
      setTxError('No Safe instance available')
      setTxBusy(false)
      return
    }

    try {
      const tx = transactions.find((t) => t.id === safeTxHash)
      if (!tx) return

      let safeTx = tx.safeTransaction
      if (!safeTx && safeInstance) {
        const txData = buildTransaction({
          to: tx.to as `0x${string}`,
          value: tx.value !== '0' ? tx.value : undefined,
          data: tx.data !== '0x' ? (tx.data as `0x${string}`) : undefined,
        })
        safeTx = await createTransaction(safeInstance, [txData])
        updateTransactions(prev =>
          prev.map(t => t.id === tx.id ? { ...t, safeTransaction: safeTx } : t),
        )
      }
      if (!safeTx) {
        setTxError('Could not rebuild transaction. Connect to a Safe first.')
        setTxBusy(false)
        return
      }

      const result = await executeTransaction(safeInstance, safeTx)

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
      confirmations: t.status === 'signed' ? threshold : 0,
      threshold,
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

  return { transactions, pendingTxs, executedTxs, txError, txBusy, handleBuild, handleConfirm, handleExecute }
}

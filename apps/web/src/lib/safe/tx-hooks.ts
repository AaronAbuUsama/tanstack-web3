import { useState, useCallback } from 'react'
import type { MetaTransactionData } from './transactions'
import type { TransactionStatus } from './multisig'

interface MutationState<T> {
  data: T | null
  error: Error | null
  loading: boolean
}

/**
 * Hook to propose a Safe transaction.
 * Returns a propose function and state.
 */
export function useProposeTx() {
  const [state, setState] = useState<MutationState<{ safeTxHash: string }>>({
    data: null,
    error: null,
    loading: false,
  })

  const propose = useCallback(
    async (
      proposeFn: (transactions: MetaTransactionData[]) => Promise<{ safeTxHash: string }>,
      transactions: MetaTransactionData[],
    ) => {
      setState({ data: null, error: null, loading: true })
      try {
        const result = await proposeFn(transactions)
        setState({ data: result, error: null, loading: false })
        return result
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        setState({ data: null, error: err, loading: false })
        throw err
      }
    },
    [],
  )

  return { ...state, propose }
}

/**
 * Hook to manage a queue of pending transactions.
 */
export function useTxQueue() {
  const [transactions, setTransactions] = useState<TransactionStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(
    async (fetchFn: () => Promise<TransactionStatus[]>) => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchFn()
        setTransactions(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return { transactions, loading, error, fetch }
}

/**
 * Hook to confirm a pending transaction.
 */
export function useConfirmTx() {
  const [state, setState] = useState<MutationState<void>>({
    data: null,
    error: null,
    loading: false,
  })

  const confirm = useCallback(
    async (confirmFn: (safeTxHash: string) => Promise<void>, safeTxHash: string) => {
      setState({ data: null, error: null, loading: true })
      try {
        await confirmFn(safeTxHash)
        setState({ data: undefined as unknown as null, error: null, loading: false })
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        setState({ data: null, error: err, loading: false })
        throw err
      }
    },
    [],
  )

  return { ...state, confirm }
}

/**
 * Hook to execute a confirmed transaction.
 */
export function useExecuteTx() {
  const [state, setState] = useState<MutationState<{ hash: string }>>({
    data: null,
    error: null,
    loading: false,
  })

  const execute = useCallback(
    async (executeFn: (safeTxHash: string) => Promise<{ hash: string }>, safeTxHash: string) => {
      setState({ data: null, error: null, loading: true })
      try {
        const result = await executeFn(safeTxHash)
        setState({ data: result, error: null, loading: false })
        return result
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        setState({ data: null, error: err, loading: false })
        throw err
      }
    },
    [],
  )

  return { ...state, execute }
}

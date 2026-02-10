import type { TransactionStatus } from '../core/types'
import { hasSignerConfirmed } from './transactions'

interface TransactionFlowProps {
  transaction: {
    safeTxHash: string
    to: string
    value: string
    data: string
    status: TransactionStatus
  }
  currentAddress?: string
  onConfirm?: (safeTxHash: string) => void
  onExecute?: (safeTxHash: string) => void
}

export default function TransactionFlow({
  transaction,
  currentAddress,
  onConfirm,
  onExecute,
}: TransactionFlowProps) {
  const { status } = transaction
  const hasConfirmed = hasSignerConfirmed(status, currentAddress)

  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-4">
      {/* Header with status badge */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Transaction</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status.isExecuted
              ? 'bg-green-900 text-green-300'
              : status.isReady
                ? 'bg-cyan-900 text-cyan-300'
                : 'bg-yellow-900 text-yellow-300'
          }`}
        >
          {status.isExecuted ? 'Executed' : status.isReady ? 'Ready' : 'Pending'}
        </span>
      </div>

      {/* Transaction details */}
      <div className="space-y-3 mb-4">
        <div>
          <p className="text-gray-400 text-sm">To</p>
          <p className="font-mono text-sm text-gray-300 break-all">{transaction.to}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Value</p>
            <p className="text-white">{transaction.value} ETH</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Tx Hash</p>
            <p className="font-mono text-xs text-gray-400 truncate">{transaction.safeTxHash}</p>
          </div>
        </div>
        {transaction.data !== '0x' && (
          <div>
            <p className="text-gray-400 text-sm">Data</p>
            <p className="font-mono text-xs text-gray-500 break-all truncate">{transaction.data}</p>
          </div>
        )}
      </div>

      {/* Confirmation progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-400 text-sm">Confirmations</p>
          <p className="text-sm text-white">
            {status.confirmations} / {status.threshold}
          </p>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              status.isReady ? 'bg-cyan-500' : 'bg-yellow-500'
            }`}
            style={{
              width: `${Math.min((status.confirmations / status.threshold) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Action buttons */}
      {!status.isExecuted && (
        <div className="flex gap-3">
          {!status.isReady && !hasConfirmed && onConfirm && (
            <button
              onClick={() => onConfirm(transaction.safeTxHash)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Confirm
            </button>
          )}
          {status.isReady && onExecute && (
            <button
              onClick={() => onExecute(transaction.safeTxHash)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Execute
            </button>
          )}
          {hasConfirmed && !status.isReady && (
            <p className="text-sm text-gray-400 py-2">You have confirmed. Waiting for others.</p>
          )}
        </div>
      )}
    </div>
  )
}

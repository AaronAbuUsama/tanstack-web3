interface PendingTx {
  safeTxHash: string
  to: string
  value: string
  confirmations: number
  threshold: number
  submittedAt?: string
}

interface TxQueueProps {
  transactions: PendingTx[]
  onConfirm?: (safeTxHash: string) => void
  onExecute?: (safeTxHash: string) => void
}

export default function TxQueue({ transactions, onConfirm, onExecute }: TxQueueProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Pending Transactions</h3>
        <p className="text-gray-400 text-sm">No pending transactions</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Pending Transactions ({transactions.length})
      </h3>
      <div className="space-y-3">
        {transactions.map((tx) => {
          const isReady = tx.confirmations >= tx.threshold
          return (
            <div key={tx.safeTxHash} className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-gray-400 truncate max-w-[200px]">
                  {tx.safeTxHash}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  isReady ? 'bg-cyan-900 text-cyan-300' : 'bg-yellow-900 text-yellow-300'
                }`}>
                  {isReady ? 'Ready' : 'Pending'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="text-gray-400">To: </span>
                  <span className="font-mono text-gray-300">{tx.to.slice(0, 10)}...</span>
                </div>
                <div>
                  <span className="text-gray-400">Value: </span>
                  <span className="text-white">{tx.value} ETH</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${isReady ? 'bg-cyan-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min((tx.confirmations / tx.threshold) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{tx.confirmations}/{tx.threshold}</span>
                </div>
                <div className="flex gap-2">
                  {!isReady && onConfirm && (
                    <button
                      onClick={() => onConfirm(tx.safeTxHash)}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-medium transition-colors"
                    >
                      Confirm
                    </button>
                  )}
                  {isReady && onExecute && (
                    <button
                      onClick={() => onExecute(tx.safeTxHash)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                    >
                      Execute
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

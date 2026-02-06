interface ExecutedTx {
  safeTxHash: string
  to: string
  value: string
  transactionHash: string
  executedAt?: string
  executor?: string
}

interface TxHistoryProps {
  transactions: ExecutedTx[]
}

export default function TxHistory({ transactions }: TxHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
        <p className="text-gray-400 text-sm">No executed transactions</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Transaction History ({transactions.length})
      </h3>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div key={tx.safeTxHash} className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs text-gray-400 truncate max-w-[200px]">
                {tx.transactionHash}
              </span>
              <span className="px-2 py-0.5 rounded bg-green-900 text-green-300 text-xs font-medium">
                Executed
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">To: </span>
                <span className="font-mono text-gray-300">{tx.to.slice(0, 10)}...</span>
              </div>
              <div>
                <span className="text-gray-400">Value: </span>
                <span className="text-white">{tx.value} ETH</span>
              </div>
              {tx.executedAt && (
                <div>
                  <span className="text-gray-400">Date: </span>
                  <span className="text-gray-300">{tx.executedAt}</span>
                </div>
              )}
              {tx.executor && (
                <div>
                  <span className="text-gray-400">By: </span>
                  <span className="font-mono text-gray-300">{tx.executor.slice(0, 10)}...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

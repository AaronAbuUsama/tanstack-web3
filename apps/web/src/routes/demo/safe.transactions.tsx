import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import ConnectWallet from '../../components/ConnectWallet'
import { useSafe } from '../../lib/safe/hooks'
import { buildTransaction, type TransactionParams } from '../../lib/safe/transactions'

export const Route = createFileRoute('/demo/safe/transactions')({
  component: TransactionsDemo,
})

function TransactionsDemo() {
  const { isConnected, address } = useAccount()
  const safe = useSafe()

  const [to, setTo] = useState('')
  const [value, setValue] = useState('')
  const [data, setData] = useState('')
  const [builtTx, setBuiltTx] = useState<ReturnType<typeof buildTransaction> | null>(null)

  const handleBuild = () => {
    if (!to) return
    const params: TransactionParams = {
      to: to as `0x${string}`,
      value: value || undefined,
      data: (data || undefined) as `0x${string}` | undefined,
    }
    const tx = buildTransaction(params)
    setBuiltTx(tx)
  }

  const handleReset = () => {
    setTo('')
    setValue('')
    setData('')
    setBuiltTx(null)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Safe Transactions</h1>
        <p className="text-gray-400 mb-8">Build and manage multi-sig transactions</p>

        {!isConnected ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect a wallet to build and propose transactions.</p>
            <ConnectWallet />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Transaction Builder */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Build Transaction</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">To Address</label>
                  <input
                    type="text"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Value (ETH)</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0.0"
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Data (optional)</label>
                  <input
                    type="text"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none font-mono text-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleBuild}
                    disabled={!to}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Build Transaction
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Built Transaction Preview */}
            {builtTx && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Transaction Preview</h2>
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm space-y-2">
                  <div>
                    <span className="text-gray-400">to: </span>
                    <span className="text-cyan-400">{builtTx.to}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">value: </span>
                    <span className="text-white">{builtTx.value} wei</span>
                  </div>
                  <div>
                    <span className="text-gray-400">data: </span>
                    <span className="text-gray-300">{builtTx.data}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">operation: </span>
                    <span className="text-white">{builtTx.operation === 0 ? 'Call' : 'DelegateCall'}</span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mt-3">
                  In a real Safe context, this transaction would be proposed to the Transaction Service
                  for multi-sig approval.
                </p>
              </div>
            )}

            {/* Safe Context Info */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Safe Context</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Mode</p>
                  <p className="capitalize">{safe.mode}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Connected Address</p>
                  <p className="font-mono text-sm">{address?.slice(0, 10)}...{address?.slice(-8)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

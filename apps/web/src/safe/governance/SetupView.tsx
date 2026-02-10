import { useState } from 'react'
import { DEV_WALLET_PRIVATE_KEY } from '../../web3/dev-wallet'
import type { useSafe } from '../core/use-safe'

interface SetupViewProps {
  address: string | undefined
  safe: ReturnType<typeof useSafe>
  rpcUrl: string
}

export default function SetupView({ address, safe, rpcUrl }: SetupViewProps) {
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
        signer: DEV_WALLET_PRIVATE_KEY,
      })
    } finally {
      setDeploying(false)
    }
  }

  const handleConnect = async () => {
    if (!connectAddress) return
    setConnecting(true)
    try {
      await safe.connectSafe(connectAddress, rpcUrl, DEV_WALLET_PRIVATE_KEY)
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

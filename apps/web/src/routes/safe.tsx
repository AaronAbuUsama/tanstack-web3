import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import ConnectWallet from '../components/ConnectWallet'
import { useSafe } from '../lib/safe/hooks'
import Owners from '../components/safe/Owners'
import Threshold from '../components/safe/Threshold'
import Modules from '../components/safe/Modules'
import AddressDisplay from '../components/web3/AddressDisplay'
import ChainBadge from '../components/web3/ChainBadge'
import TokenBalances from '../components/web3/TokenBalances'

const ANVIL_RPC = 'http://127.0.0.1:8545'
const ANVIL_SIGNER =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

export const Route = createFileRoute('/safe')({
  component: SafeDashboard,
})

function SafeDashboard() {
  const { isConnected, address, chain } = useAccount()
  const safe = useSafe()

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

        {safe.loading && (
          <div className="bg-gray-800 rounded-xl p-12 text-center mb-6">
            <div className="animate-pulse text-gray-400">Loading Safe...</div>
          </div>
        )}

        {!safe.isInSafe && !safe.loading && isConnected && (
          <SetupView address={address} safe={safe} />
        )}

        {safe.isInSafe && (
          <DashboardView address={address} chain={chain} safe={safe} />
        )}

        <Outlet />
      </div>
    </div>
  )
}

function SetupView({
  address,
  safe,
}: {
  address: string | undefined
  safe: ReturnType<typeof useSafe>
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
        provider: ANVIL_RPC,
        signer: ANVIL_SIGNER,
      })
    } finally {
      setDeploying(false)
    }
  }

  const handleConnect = async () => {
    if (!connectAddress) return
    setConnecting(true)
    try {
      await safe.connectSafe(connectAddress, ANVIL_RPC)
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

function DashboardView({
  address,
  chain,
  safe,
}: {
  address: string | undefined
  chain: { name: string; id: number } | undefined
  safe: ReturnType<typeof useSafe>
}) {
  return (
    <>
      {/* Top bar */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-4">
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

      {safe.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm mb-6">
          {safe.error}
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Owners owners={safe.owners} currentAddress={address} />
        <Threshold
          threshold={safe.threshold}
          ownerCount={safe.owners.length}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Modules modules={[]} />
        <TokenBalances tokens={[]} loading={false} />
      </div>

      {/* Nav to transactions child route */}
      <div className="mb-6">
        <Link
          to="/safe/transactions"
          className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
        >
          View Transactions &rarr;
        </Link>
      </div>
    </>
  )
}

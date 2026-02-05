import { createFileRoute } from '@tanstack/react-router'
import { useAccount } from 'wagmi'
import ConnectWallet from '../../components/ConnectWallet'
import { useSafe } from '../../lib/safe/hooks'

export const Route = createFileRoute('/demo/safe')({
  component: SafeDemo,
})

function SafeDemo() {
  const { isConnected, chain } = useAccount()
  const safe = useSafe()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Safe Demo</h1>
        <p className="text-gray-400 mb-8">Gnosis Safe integration with dual-mode support</p>

        {/* Mode Detection */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Mode</p>
              <p className="font-medium capitalize">
                {safe.loading ? 'Detecting...' : safe.mode}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Safe Context</p>
              <p className={safe.isInSafe ? 'text-green-400' : 'text-yellow-400'}>
                {safe.loading ? '...' : safe.isInSafe ? 'Connected to Safe' : 'Not in Safe'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Connected Chain</p>
              <p>{chain?.name ?? 'Not connected'}</p>
            </div>
          </div>
        </div>

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="bg-gray-800 rounded-xl p-12 text-center mb-6">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect a wallet to interact with Safe features.</p>
            <ConnectWallet />
          </div>
        )}

        {/* Safe Info (shown when in iframe mode with Safe context) */}
        {safe.isInSafe && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Safe Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Safe Address</p>
                <p className="font-mono text-cyan-400 break-all">{safe.safeAddress}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Threshold</p>
                <p>{safe.threshold} of {safe.owners.length} owners</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-400 text-sm mb-2">Owners</p>
                <div className="space-y-1">
                  {safe.owners.map((owner) => (
                    <p key={owner} className="font-mono text-sm text-gray-300">{owner}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Standalone Mode Info */}
        {!safe.isInSafe && !safe.loading && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Standalone Mode</h2>
            <p className="text-gray-400">
              Running in standalone mode. You can create or connect to a Safe
              programmatically using the Protocol Kit. In production, this would
              allow you to deploy new Safes, manage existing ones, and propose
              transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

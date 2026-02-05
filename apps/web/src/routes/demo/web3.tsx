import { createFileRoute } from '@tanstack/react-router'
import { useAccount, useBalance, useSwitchChain } from 'wagmi'
import { formatUnits } from 'viem'
import ConnectWallet from '../../components/ConnectWallet'

export const Route = createFileRoute('/demo/web3')({
  component: Web3Demo,
})

function Web3Demo() {
  const { address, isConnected, chain } = useAccount()
  const { data: balance } = useBalance({ address })
  const { chains, switchChain } = useSwitchChain()

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Web3 Demo</h1>
        <p className="text-gray-400 mb-8">Connect your wallet and interact with the blockchain</p>

        {!isConnected ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">Connect a wallet to view your account details and interact with the network.</p>
            <ConnectWallet />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Account</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Address</p>
                  <p className="font-mono text-cyan-400 break-all">{address}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Balance</p>
                  <p className="text-lg font-semibold">
                    {balance?.value !== undefined
                      ? Number.parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
                      : '0.0000'}{' '}
                    {balance?.symbol ?? 'ETH'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Network</p>
                  <p>{chain?.name ?? 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Chain ID</p>
                  <p>{chain?.id}</p>
                </div>
              </div>
            </div>

            {/* Network Switcher */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Switch Network</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {chains.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => switchChain({ chainId: c.id })}
                    className={`p-4 rounded-lg text-center transition-colors ${
                      chain?.id === c.id
                        ? 'bg-cyan-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-gray-400 mt-1">ID: {c.id}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

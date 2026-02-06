import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi'
import { formatUnits } from 'viem'

export default function ConnectWallet() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })
  const { chains, switchChain } = useSwitchChain()

  if (!isConnected) {
    return (
      <div className="flex gap-2">
        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {connector.name === 'Injected' ? 'Connect Wallet' : connector.name}
          </button>
        ))}
      </div>
    )
  }

  const displayBalance = balance?.value !== undefined
    ? Number.parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
    : '0.0000'

  return (
    <div className="flex items-center gap-3">
      <select
        value={chain?.id}
        onChange={(e) => switchChain({ chainId: Number(e.target.value) })}
        className="bg-gray-700 text-white text-sm rounded-lg px-2 py-1.5 border border-gray-600 focus:border-cyan-500 focus:outline-none"
      >
        {chains.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <div className="text-sm text-gray-300">
        <span className="font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        <span className="ml-2 text-gray-400">{displayBalance} {balance?.symbol ?? 'ETH'}</span>
      </div>
      <button
        onClick={() => disconnect()}
        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
      >
        Disconnect
      </button>
    </div>
  )
}

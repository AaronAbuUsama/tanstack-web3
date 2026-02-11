import { useState } from 'react'
import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi'
import { formatUnits } from 'viem'
import {
  getDevWalletActiveAccountIndex,
  setDevWalletActiveAccountIndex,
} from './dev-wallet'

const DEV_ACCOUNT_OPTIONS = Array.from({ length: 10 }, (_, index) => index)

export default function ConnectWallet() {
  const { address, isConnected, chain, connector } = useAccount()
  const { connect, connectAsync, connectors } = useConnect()
  const { disconnect, disconnectAsync } = useDisconnect()
  const { data: balance } = useBalance({ address })
  const { chains, switchChain } = useSwitchChain()
  const [devAccountIndex, setDevAccountIndex] = useState(() => getDevWalletActiveAccountIndex())
  const [switchingDevAccount, setSwitchingDevAccount] = useState(false)

  const isDevWalletConnected = import.meta.env.DEV && connector?.id === 'dev-wallet'
  const devConnector = connectors.find((item) => item.id === 'dev-wallet')
  const injectedConnector = connectors.find((item) => item.id === 'injected')
  const selectedChainIsDev = Boolean(chain?.id && (chain.id === 31337 || chain.id === 10200))
  const preferredConnector = selectedChainIsDev && devConnector
    ? devConnector
    : (injectedConnector ?? devConnector ?? connectors[0])

  const handleDevAccountSwitch = async (nextIndex: number) => {
    if (!isDevWalletConnected || nextIndex === devAccountIndex || switchingDevAccount) return

    const devConnector = connectors.find((item) => item.id === 'dev-wallet')
    if (!devConnector) return

    setSwitchingDevAccount(true)
    try {
      setDevWalletActiveAccountIndex(nextIndex)
      setDevAccountIndex(nextIndex)
      await disconnectAsync()
      await connectAsync({
        connector: devConnector,
        chainId: chain?.id,
      })
    } finally {
      setSwitchingDevAccount(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => {
            if (!preferredConnector) return
            connect({ connector: preferredConnector })
          }}
          className="px-4 py-2 border-2 border-white bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold transition-colors disabled:opacity-50"
          disabled={!preferredConnector}
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  const displayBalance = balance?.value !== undefined
    ? Number.parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
    : '0.0000'

  return (
    <div className="flex items-center gap-3">
      {isDevWalletConnected && (
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <span className="text-gray-400">Dev Account</span>
          <select
            value={devAccountIndex}
            onChange={(e) => {
              const nextIndex = Number(e.target.value)
              if (!Number.isInteger(nextIndex)) return
              void handleDevAccountSwitch(nextIndex)
            }}
            disabled={switchingDevAccount}
            className="bg-gray-700 text-white text-sm rounded-lg px-2 py-1.5 border border-gray-600 focus:border-cyan-500 focus:outline-none disabled:opacity-60"
          >
            {DEV_ACCOUNT_OPTIONS.map((accountIndex) => (
              <option key={accountIndex} value={accountIndex}>
                #{accountIndex}
              </option>
            ))}
          </select>
        </label>
      )}
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

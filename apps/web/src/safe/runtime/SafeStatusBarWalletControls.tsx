import { useEffect, useMemo, useState } from 'react'
import { formatUnits } from 'viem'
import { useAccount, useBalance, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import {
  getDevWalletActiveAccountIndex,
  setDevWalletActiveAccountIndex,
} from '../../web3/dev-wallet'

const DEV_CHAIN_IDS = new Set([10200, 31337])
const DEV_ACCOUNT_OPTIONS = Array.from({ length: 10 }, (_, index) => index)

interface SafeStatusBarWalletControlsProps {
  onDisconnect?: () => void
}

export function SafeStatusBarWalletControls({ onDisconnect }: SafeStatusBarWalletControlsProps) {
  const { address, chain, connector, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  const { chains, switchChain } = useSwitchChain()
  const { connect, connectAsync, connectors } = useConnect()
  const { disconnect, disconnectAsync } = useDisconnect()

  const [selectedChainId, setSelectedChainId] = useState<number | ''>(chain?.id ?? '')
  const [devAccountIndex, setDevAccountIndex] = useState(() => getDevWalletActiveAccountIndex())
  const [switchingDevAccount, setSwitchingDevAccount] = useState(false)

  useEffect(() => {
    if (isConnected && chain?.id) {
      setSelectedChainId(chain.id)
      return
    }
    if (selectedChainId === '' && chains.length > 0) {
      setSelectedChainId(chains[0].id)
    }
  }, [isConnected, chain?.id, chains, selectedChainId])

  const isDevWalletConnector = connector?.id === 'dev-wallet'
  const devConnector = connectors.find((item) => item.id === 'dev-wallet')
  const injectedConnector = connectors.find((item) => item.id === 'injected')
  const selectedChainIsDev = selectedChainId !== '' && DEV_CHAIN_IDS.has(selectedChainId)
  const preferredConnector = selectedChainIsDev && devConnector
    ? devConnector
    : (injectedConnector ?? devConnector ?? connectors[0])
  const showDevAccountSwitcher = Boolean(
    import.meta.env.DEV &&
      isConnected &&
      isDevWalletConnector &&
      chain?.id &&
      DEV_CHAIN_IDS.has(chain.id),
  )

  const displayBalance = useMemo(() => {
    if (!balance?.value) return `0 ${balance?.symbol ?? 'ETH'}`
    const parsed = Number.parseFloat(formatUnits(balance.value, balance.decimals))
    const fixed = Number.isFinite(parsed) ? parsed.toFixed(4) : '0.0000'
    return `${fixed} ${balance.symbol ?? 'ETH'}`
  }, [balance])

	const handleChainChange = async (nextChainId: number) => {
		setSelectedChainId(nextChainId)
		if (!isConnected) return

		const nextChainIsDev = DEV_CHAIN_IDS.has(nextChainId)
		const reconnectToDevWallet = Boolean(
			nextChainIsDev && connector?.id !== 'dev-wallet' && devConnector,
		)

		if (reconnectToDevWallet) {
			const nextConnector = devConnector
			if (!nextConnector) return
			let reconnected = false
			try {
				await disconnectAsync()
				await connectAsync({
					chainId: nextChainId,
					connector: nextConnector,
				})
				reconnected = true
			} catch {
				// Fallback to regular switch flow below.
			}
			if (reconnected) return
		}

		switchChain({ chainId: nextChainId })
	}

  const handleDevAccountSwitch = async (nextIndex: number) => {
    if (!showDevAccountSwitcher || nextIndex === devAccountIndex || switchingDevAccount) {
      return
    }
    const devConnector = connectors.find((item) => item.id === 'dev-wallet')
    if (!devConnector) return

    setSwitchingDevAccount(true)
    try {
      setDevWalletActiveAccountIndex(nextIndex)
      setDevAccountIndex(nextIndex)
      await disconnectAsync()
      await connectAsync({
        chainId: chain?.id,
        connector: devConnector,
      })
    } finally {
      setSwitchingDevAccount(false)
    }
  }

  if (!isConnected) {
    return (
      <>
        {chains.length > 0 ? (
          <label className='ds-shell-statusbar__control'>
            <span className='ds-shell-statusbar__control-label'>Network</span>
            <select
              className='ds-shell-statusbar__select'
							onChange={(event) => {
								void handleChainChange(Number(event.target.value))
							}}
							value={selectedChainId}
						>
              {chains.map((network) => (
                <option key={network.id} value={network.id}>
                  {network.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <button
          className='ds-shell-statusbar__connect-btn'
          disabled={!preferredConnector}
          onClick={() => {
            if (!preferredConnector) return
            connect({
              chainId: selectedChainId === '' ? undefined : selectedChainId,
              connector: preferredConnector,
            })
          }}
          type='button'
        >
          Connect Wallet
        </button>
      </>
    )
  }

  return (
    <>
      {showDevAccountSwitcher ? (
        <label className='ds-shell-statusbar__control'>
          <span className='ds-shell-statusbar__control-label'>Dev Account</span>
          <select
            className='ds-shell-statusbar__select'
            disabled={switchingDevAccount}
            onChange={(event) => {
              const nextIndex = Number(event.target.value)
              if (!Number.isInteger(nextIndex)) return
              void handleDevAccountSwitch(nextIndex)
            }}
            value={devAccountIndex}
          >
            {DEV_ACCOUNT_OPTIONS.map((accountIndex) => (
              <option key={accountIndex} value={accountIndex}>
                #{accountIndex}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {chains.length > 0 ? (
        <label className='ds-shell-statusbar__control'>
          <span className='ds-shell-statusbar__control-label'>Network</span>
          <select
            className='ds-shell-statusbar__select'
							onChange={(event) => {
								void handleChainChange(Number(event.target.value))
							}}
							value={chain?.id}
						>
            {chains.map((network) => (
              <option key={network.id} value={network.id}>
                {network.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <span className='ds-shell-statusbar__balance-pill'>{displayBalance}</span>
      {address ? <span className='ds-shell-statusbar__address'>{address}</span> : null}
      <button
        className='ds-shell-statusbar__disconnect'
        onClick={() => {
          if (onDisconnect) {
            onDisconnect()
            return
          }
          disconnect()
        }}
        type='button'
      >
        Disconnect
      </button>
    </>
  )
}

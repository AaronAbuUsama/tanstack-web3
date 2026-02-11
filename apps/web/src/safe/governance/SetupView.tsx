import { useState } from 'react'
import {
  CommandCenterScreenShell,
  CommandCenterSetupRuntime,
} from '../../design-system/compositions/command-center'
import { commandCenterSidebarSections } from '../../design-system/fixtures/command-center'
import { Button, Input } from '../../design-system/primitives'
import { PanelShell } from '../../design-system/shells'
import ConnectWallet from '../../web3/ConnectWallet'
import {
  getDevWalletActiveAccountIndex,
  getDevWalletActiveSigner,
} from '../../web3/dev-wallet'
import type { useSafe } from '../core/use-safe'
import type { RuntimePolicy } from '../runtime'
import { mapSetupRuntimeScreen } from '../screens/mappers/setup-runtime'
import { navItemForScreen, safeHrefForNavItem } from '../screens/screen-layout'
import type { SafeScreenId } from '../screens/types'

interface SetupViewProps {
  activeScreen?: SafeScreenId
  address: string | undefined
  chainLabel?: string
  onDisconnect?: () => void
  safe: ReturnType<typeof useSafe>
  rpcUrl: string
  runtimePolicy: RuntimePolicy
}

function resolveSetupSigner(runtimePolicy: RuntimePolicy) {
  if (runtimePolicy.signerProvider === 'dev-mnemonic-account') {
    return getDevWalletActiveSigner()
  }
  return undefined
}

export default function SetupView({
  activeScreen = 'overview',
  address,
  chainLabel,
  onDisconnect,
  safe,
  rpcUrl,
  runtimePolicy,
}: SetupViewProps) {
  const [owners, setOwners] = useState<string[]>([address ?? ''])
  const [threshold, setThreshold] = useState(1)
  const [deploying, setDeploying] = useState(false)

  const [connectAddress, setConnectAddress] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const signer = resolveSetupSigner(runtimePolicy)
  const signerUnavailable = !signer
  const activeNavItem = navItemForScreen(activeScreen)

  const navSections = commandCenterSidebarSections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      active: item.id === activeNavItem,
      href: safeHrefForNavItem(item.id),
      badge:
        item.id === 'transactions' || item.id === 'modules'
          ? undefined
          : item.badge,
    })),
  }))

  const handleDeploy = async () => {
    if (!signer) {
      setLocalError('Current wallet path cannot sign Safe setup operations in standalone mode yet.')
      return
    }
    setDeploying(true)
    setLocalError(null)
    try {
      await safe.deploySafe({
        owners,
        threshold,
        provider: rpcUrl,
        signer,
      })
    } finally {
      setDeploying(false)
    }
  }

  const handleConnect = async () => {
    if (!connectAddress) return
    if (!signer) {
      setLocalError('Current wallet path cannot sign Safe setup operations in standalone mode yet.')
      return
    }
    setConnecting(true)
    setLocalError(null)
    try {
      await safe.connectSafe(connectAddress, rpcUrl, signer)
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
    setOwners((prev) => prev.map((owner, i) => (i === index ? value : owner)))
  }

  const thresholdOptions = Array.from({ length: owners.length }, (_, i) => i + 1)
  const canDeploy = !deploying && owners.every((owner) => owner.trim()) && !signerUnavailable
  const canConnect = !connecting && Boolean(connectAddress.trim()) && !signerUnavailable

  if (activeScreen === 'setup-runtime') {
    const setupRuntimeScreen = mapSetupRuntimeScreen({
      activeChainLabel: chainLabel ?? 'Chiado (Anvil Fork)',
      activeDevIndex: getDevWalletActiveAccountIndex(),
      policy: runtimePolicy,
    })

    return (
      <CommandCenterSetupRuntime
        {...setupRuntimeScreen}
        address={address}
        chainLabel={chainLabel ?? 'gnosis chain'}
        connected={Boolean(address)}
        navSections={navSections}
        onDisconnect={onDisconnect}
        safeAddress={connectAddress || owners[0] || '0x...'}
        safeBalanceLabel='0'
        statusBalanceLabel='0 ETH'
        thresholdLabel={`${threshold} of ${owners.length}`}
      />
    )
  }

  return (
    <CommandCenterScreenShell
      address={address}
      chainLabel={chainLabel ?? 'gnosis chain'}
      connected={Boolean(address)}
      navSections={navSections}
      onDisconnect={onDisconnect}
      safeAddress={connectAddress || owners[0] || '0x...'}
      safeBalanceLabel='0'
      statusBalanceLabel='0 ETH'
      thresholdLabel={`${threshold} of ${owners.length}`}
      title='Safe Setup'
      titleIcon='◆'
    >
      <div
        className={`ds-command-notice ${runtimePolicy.txSubmissionPath === 'transaction-service' ? 'is-info' : ''}`}
      >
        {runtimePolicy.txSubmissionPath === 'transaction-service' ? (
          <>
            <strong>Transaction Service mode:</strong> Pending transactions and confirmations are shared through the hosted Safe Transaction Service.
          </>
        ) : (
          <>
            <strong>Local-only mode:</strong> Pending transaction coordination is stored in browser state for this local environment.
          </>
        )}
      </div>

      <PanelShell title={address ? 'Wallet Session' : 'Connect Wallet'}>
        <div className='ds-command-form-stack'>
          <p className='ds-command-copy'>
            {address
              ? 'Switch chain or dev account before creating or connecting a Safe.'
              : 'Connect a wallet to deploy a new Safe or connect an existing Safe.'}
          </p>
          <div className='ds-command-form-stack__actions'>
            <ConnectWallet />
          </div>
        </div>
      </PanelShell>

      {signerUnavailable ? (
        <div className='ds-command-notice is-error'>
          Current signer path cannot sign Safe setup operations in standalone mode. Use Dev Wallet in development.
        </div>
      ) : null}

      {(safe.error || localError) ? (
        <div className='ds-command-notice is-error'>{localError ?? safe.error}</div>
      ) : null}

      <div className='ds-command-setup__grid'>
        <PanelShell title='Create New Safe'>
          <div className='ds-command-form-stack'>
            {owners.map((owner, index) => (
              <div className='flex items-end gap-2' key={`owner-${index}-${owners.length}`}>
                <Input
                  className='flex-1'
                  label={`Owner ${index + 1}`}
                  onChange={(event) => updateOwner(index, event.target.value)}
                  placeholder='0x...'
                  value={owner}
                />
                {owners.length > 1 ? (
                  <Button onClick={() => removeOwner(index)} variant='ghost'>
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}

            <div className='ds-command-form-stack__actions'>
              <Button onClick={addOwner} variant='outline'>
                + Add Owner
              </Button>
            </div>

            <div className='ds-command-owners__threshold'>
              <span className='ds-command-owners__threshold-label'>Threshold</span>
              <div className='ds-command-owners__threshold-options'>
                {thresholdOptions.map((option) => (
                  <button
                    className={`ds-command-owners__threshold-option ${option === threshold ? 'is-selected' : ''}`}
                    key={option}
                    onClick={() => setThreshold(option)}
                    type='button'
                  >
                    {option}
                  </button>
                ))}
              </div>
              <span className='ds-command-owners__threshold-help'>
                {threshold} of {owners.length} owners must sign
              </span>
            </div>

            <Button
              className='w-full'
              disabled={!canDeploy}
              onClick={handleDeploy}
            >
              {deploying ? 'Deploying...' : 'Deploy Safe'}
            </Button>
          </div>
        </PanelShell>

        <PanelShell title='Connect to Existing Safe'>
          <div className='ds-command-form-stack'>
            <Input
              label='Safe Address'
              onChange={(event) => setConnectAddress(event.target.value)}
              placeholder='0x...'
              value={connectAddress}
            />
            <Button
              className='w-full'
              disabled={!canConnect}
              onClick={handleConnect}
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </Button>
          </div>
        </PanelShell>
      </div>
    </CommandCenterScreenShell>
  )
}

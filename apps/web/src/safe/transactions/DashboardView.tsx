import { useState } from 'react'
import { formatUnits } from 'viem'
import type { useSafe } from '../core/use-safe'
import { createAddOwnerTx, createRemoveOwnerTx, createChangeThresholdTx, signTransaction, executeTransaction } from '../core/standalone'
import { useTransactions } from './use-transactions'
import Owners from '../governance/Owners'
import Threshold from '../governance/Threshold'
import GuardPanel from '../guard/GuardPanel'
import ModulePanel from '../module/ModulePanel'
import AddressDisplay from '../../web3/AddressDisplay'
import ChainBadge from '../../web3/ChainBadge'
import TokenBalances from '../../web3/TokenBalances'
import { DEV_WALLET_PRIVATE_KEY } from '../../web3/dev-wallet'
import TxBuilder from './TxBuilder'
import TxQueue from './TxQueue'
import TxHistory from './TxHistory'
import TransactionFlow from './TransactionFlow'
import SafeOverview from '../governance/SafeOverview'
import FundSafe from './FundSafe'

interface DashboardViewProps {
  address: string | undefined
  chain: { name: string; id: number } | undefined
  safe: ReturnType<typeof useSafe>
  rpcUrl: string
}

export default function DashboardView({ address, chain, safe, rpcUrl }: DashboardViewProps) {
  const [operationLoading, setOperationLoading] = useState(false)
  const [operationError, setOperationError] = useState<string | null>(null)

  const { transactions, pendingTxs, executedTxs, txError, txBusy, handleBuild, handleConfirm, handleExecute } = useTransactions({
    safeAddress: safe.safeAddress,
    safeInstance: safe.safeInstance,
    threshold: safe.threshold,
    mode: safe.mode,
  })

  const handleAddOwner = async (ownerAddress: string) => {
    if (!safe.safeInstance || !safe.safeAddress) return
    setOperationLoading(true)
    setOperationError(null)
    try {
      const tx = await createAddOwnerTx(safe.safeInstance, ownerAddress)
      const signed = await signTransaction(safe.safeInstance, tx)
      await executeTransaction(safe.safeInstance, signed)
      await safe.connectSafe(safe.safeAddress, rpcUrl, DEV_WALLET_PRIVATE_KEY)
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Failed to add owner')
    } finally {
      setOperationLoading(false)
    }
  }

  const handleRemoveOwner = async (ownerAddress: string) => {
    if (!safe.safeInstance || !safe.safeAddress) return
    setOperationLoading(true)
    setOperationError(null)
    try {
      const newThreshold = Math.min(safe.threshold, safe.owners.length - 1)
      const tx = await createRemoveOwnerTx(safe.safeInstance, ownerAddress, newThreshold)
      const signed = await signTransaction(safe.safeInstance, tx)
      await executeTransaction(safe.safeInstance, signed)
      await safe.connectSafe(safe.safeAddress, rpcUrl, DEV_WALLET_PRIVATE_KEY)
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Failed to remove owner')
    } finally {
      setOperationLoading(false)
    }
  }

  const handleChangeThreshold = async (newThreshold: number) => {
    if (!safe.safeInstance || !safe.safeAddress) return
    setOperationLoading(true)
    setOperationError(null)
    try {
      const tx = await createChangeThresholdTx(safe.safeInstance, newThreshold)
      const signed = await signTransaction(safe.safeInstance, tx)
      await executeTransaction(safe.safeInstance, signed)
      await safe.connectSafe(safe.safeAddress, rpcUrl, DEV_WALLET_PRIVATE_KEY)
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Failed to change threshold')
    } finally {
      setOperationLoading(false)
    }
  }

  return (
    <>
      {/* Safe info header */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-3">
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
        {safe.safeAddress && (
          <div className="border-t border-gray-700 pt-3">
            <span className="text-xs text-gray-500 block mb-1">Safe Address</span>
            <code className="text-sm text-cyan-300 font-mono break-all select-all">{safe.safeAddress}</code>
          </div>
        )}
      </div>

      {safe.error && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm mb-6">
          {safe.error}
        </div>
      )}

      <SafeOverview
        owners={safe.owners}
        threshold={safe.threshold}
        guard={safe.guard}
        rpcUrl={rpcUrl}
        moduleCount={safe.modules.length}
      />

      {operationLoading && (
        <div className="bg-cyan-900/30 border border-cyan-700 rounded-xl p-4 mb-6">
          <p className="text-cyan-300 text-sm">Processing Safe operation...</p>
        </div>
      )}

      {operationError && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm mb-6">
          {operationError}
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Owners owners={safe.owners} currentAddress={address} onAddOwner={handleAddOwner} onRemoveOwner={handleRemoveOwner} />
        <Threshold
          threshold={safe.threshold}
          ownerCount={safe.owners.length}
          onChangeThreshold={handleChangeThreshold}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <TokenBalances
            tokens={safe.balance !== '0' ? [{
              name: 'xDAI',
              symbol: 'xDAI',
              balance: formatUnits(BigInt(safe.balance), 18),
            }] : []}
            loading={false}
          />
          {import.meta.env.DEV && (
            <FundSafe
              safeAddress={safe.safeAddress!}
              rpcUrl={rpcUrl}
              signer={DEV_WALLET_PRIVATE_KEY}
              onFunded={async () => { await safe.connectSafe(safe.safeAddress!, rpcUrl, DEV_WALLET_PRIVATE_KEY) }}
            />
          )}
        </div>
        <GuardPanel
          guard={safe.guard}
          safeAddress={safe.safeAddress!}
          safeInstance={safe.safeInstance!}
          rpcUrl={rpcUrl}
          signer={DEV_WALLET_PRIVATE_KEY}
          onRefresh={async () => { await safe.connectSafe(safe.safeAddress!, rpcUrl, DEV_WALLET_PRIVATE_KEY) }}
        />
      </div>

      <div className="mb-6">
        <ModulePanel
          modules={safe.modules}
          safeAddress={safe.safeAddress!}
          safeInstance={safe.safeInstance!}
          rpcUrl={rpcUrl}
          signer={DEV_WALLET_PRIVATE_KEY}
          onRefresh={async () => { await safe.connectSafe(safe.safeAddress!, rpcUrl, DEV_WALLET_PRIVATE_KEY) }}
        />
      </div>

      {/* Transaction Builder */}
      <div className="space-y-6 mb-6">
        <h2 className="text-xl font-semibold">Transactions</h2>

        {txError && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-4">
            <p className="text-red-300 text-sm">{txError}</p>
          </div>
        )}

        {txBusy && (
          <div className="bg-cyan-900/30 border border-cyan-700 rounded-xl p-4">
            <p className="text-cyan-300 text-sm">Processing transaction...</p>
          </div>
        )}

        {safe.threshold > 1 && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4">
            <p className="text-amber-300 text-sm">
              <strong>Multi-sig mode:</strong> This Safe requires {safe.threshold} of {safe.owners.length} confirmations.
            </p>
          </div>
        )}

        <TxBuilder onBuild={handleBuild} />

        {/* Latest pending tx detail */}
        {transactions.filter((t) => t.status !== 'executed').length > 0 && (() => {
          const latest = transactions.find((t) => t.status !== 'executed')!
          const isRestored = latest.safeTransaction === null
          return (
            <>
              {isRestored && (
                <p className="text-amber-400 text-xs mb-2">This transaction was restored from cache and will be rebuilt when confirmed.</p>
              )}
              <TransactionFlow
                transaction={{
                  safeTxHash: latest.id,
                  to: latest.to,
                  value: latest.value,
                  data: latest.data,
                  status: {
                    safeTxHash: latest.id,
                    confirmations: latest.confirmations,
                    threshold: safe.threshold,
                    isReady: latest.confirmations >= safe.threshold,
                    isExecuted: false,
                  },
                }}
                currentAddress={address}
                onConfirm={handleConfirm}
                onExecute={handleExecute}
              />
            </>
          )
        })()}

        <TxQueue
          transactions={pendingTxs}
          threshold={safe.threshold}
          onConfirm={handleConfirm}
          onExecute={handleExecute}
        />
        <TxHistory transactions={executedTxs} />
      </div>
    </>
  )
}

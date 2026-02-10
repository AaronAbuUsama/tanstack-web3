import { useState, useEffect } from 'react'
import { parseEther, formatEther } from 'viem'
import { deploySpendingLimitGuard } from '../contracts/deploy'
import { SpendingLimitGuardABI } from '../contracts/abis'
import { signTransaction, executeTransaction } from '../core/standalone'
import type { SafeInstance } from '../core/types'
import InfoSection from '../../components/ui/InfoSection'

interface GuardPanelProps {
  guard: string
  safeAddress: string
  safeInstance: SafeInstance
  rpcUrl: string
  signer: string
  onRefresh: () => Promise<void>
}

export default function GuardPanel({ guard, safeAddress, safeInstance, rpcUrl, signer, onRefresh }: GuardPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [spendingLimit, setSpendingLimit] = useState('1')
  const [deployedGuardAddress, setDeployedGuardAddress] = useState<string | null>(null)
  const [currentLimit, setCurrentLimit] = useState<string | null>(null)

  useEffect(() => {
    if (guard) {
      (async () => {
        try {
          const { createPublicClient, http } = await import('viem')
          const client = createPublicClient({ transport: http(rpcUrl) })
          const limit = await client.readContract({
            address: guard as `0x${string}`,
            abi: SpendingLimitGuardABI,
            functionName: 'spendingLimit',
          })
          setCurrentLimit(formatEther(limit as bigint))
        } catch {}
      })()
    }
  }, [guard, rpcUrl])

  async function handleDisableGuard() {
    setLoading(true)
    setError(null)
    try {
      const tx = await safeInstance.createDisableGuardTx()
      const signed = await signTransaction(safeInstance, tx)
      await executeTransaction(safeInstance, signed)
      await onRefresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to disable guard')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeployGuard() {
    setLoading(true)
    setError(null)
    try {
      const result = await deploySpendingLimitGuard(
        { provider: rpcUrl, signer },
        safeAddress,
        parseEther(spendingLimit),
      )
      setDeployedGuardAddress(result.address)
    } catch (err: any) {
      setError(err?.message || 'Failed to deploy guard')
    } finally {
      setLoading(false)
    }
  }

  async function handleEnableGuard() {
    if (!deployedGuardAddress) return
    setLoading(true)
    setError(null)
    try {
      const tx = await safeInstance.createEnableGuardTx(deployedGuardAddress)
      const signed = await signTransaction(safeInstance, tx)
      await executeTransaction(safeInstance, signed)
      await onRefresh()
    } catch (err: any) {
      setError(err?.message || 'Failed to enable guard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-2">
        Transaction Guard ({guard ? 1 : 0})
      </h3>

      <InfoSection tagline="Enforces rules on every transaction before it executes.">
        A guard is a smart contract that inspects owner-signed Safe transactions before execution.
        If the guard's check fails, the entire transaction is blocked. The SpendingLimitGuard
        blocks any single owner-signed transaction transferring more than the configured ETH limit.
        Module allowance spending is controlled by module-specific rules.
      </InfoSection>

      {guard ? (
        <div className="space-y-3">
          <div className="bg-gray-900 rounded-lg p-3">
            <span className="font-mono text-sm text-gray-300">
              {guard.slice(0, 6)}...{guard.slice(-4)}
            </span>
          </div>
          {currentLimit !== null && (
            <p className="text-sm text-gray-400">
              Spending limit: <span className="text-cyan-400">{currentLimit} ETH</span>
            </p>
          )}
          <button
            onClick={handleDisableGuard}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Disabling...' : 'Disable Guard'}
          </button>
        </div>
      ) : deployedGuardAddress ? (
        <div className="space-y-3">
          <p className="text-sm text-green-400">Guard deployed successfully</p>
          <div className="bg-gray-900 rounded-lg p-3">
            <span className="font-mono text-sm text-gray-300">
              {deployedGuardAddress.slice(0, 6)}...{deployedGuardAddress.slice(-4)}
            </span>
          </div>
          <button
            onClick={handleEnableGuard}
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Enabling...' : 'Enable Guard'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">No guard enabled</p>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Spending Limit (ETH)
              <span className="block text-xs text-gray-500 mt-0.5">Set the maximum ETH any single transaction can transfer</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={spendingLimit}
              onChange={(e) => setSpendingLimit(e.target.value)}
              className="w-full bg-gray-900 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleDeployGuard}
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Deploying...' : 'Deploy Guard'}
          </button>
        </div>
      )}

      {error && (
        <div className="mt-3 bg-red-900/50 border border-red-700 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}

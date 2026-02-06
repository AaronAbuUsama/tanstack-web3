import { useState, useEffect } from 'react'
import { encodeFunctionData, parseEther, formatEther } from 'viem'
import { deployAllowanceModule } from '../../lib/contracts/deploy'
import { AllowanceModuleABI } from '../../lib/contracts/abis'
import { signTransaction, executeTransaction, createTransaction } from '../../lib/safe/standalone'
import type { SafeInstance } from '../../lib/safe/types'
import InfoSection from '../ui/InfoSection'

function getAllowanceModuleKey(safeAddress: string) {
  return `safe-allowance-module-${safeAddress}`
}

interface ModulePanelProps {
  modules: string[]
  safeAddress: string
  safeInstance: SafeInstance
  rpcUrl: string
  signer: string
  onRefresh: () => Promise<void>
}

export default function ModulePanel({
  modules,
  safeAddress,
  safeInstance,
  rpcUrl,
  signer,
  onRefresh,
}: ModulePanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deployedModuleAddress, setDeployedModuleAddress] = useState<string | null>(null)

  // Load persisted AllowanceModule address on mount
  useEffect(() => {
    try {
      const persisted = localStorage.getItem(getAllowanceModuleKey(safeAddress))
      if (persisted) {
        setDeployedModuleAddress(persisted)
      }
    } catch {
      // localStorage may be unavailable in private browsing
    }
  }, [safeAddress])

  // Allowance management
  const [delegateAddress, setDelegateAddress] = useState('')
  const [allowanceAmount, setAllowanceAmount] = useState('1')
  const [resetPeriod, setResetPeriod] = useState('0')
  const [availableAllowance, setAvailableAllowance] = useState<string | null>(null)

  // Execute allowance
  const [executeTo, setExecuteTo] = useState('')
  const [executeAmount, setExecuteAmount] = useState('')

  // Computed: only set if our tracked module is in the enabled modules list
  const allowanceModuleAddress = deployedModuleAddress && modules.includes(deployedModuleAddress)
    ? deployedModuleAddress
    : null
  const showDeployedNotEnabled =
    deployedModuleAddress && !modules.includes(deployedModuleAddress)
  const hasEnabledModule = modules.length > 0

  async function handleDisableModule(moduleAddress: string) {
    setLoading(true)
    setError(null)
    try {
      const tx = await safeInstance.createDisableModuleTx(moduleAddress)
      const signed = await signTransaction(safeInstance, tx)
      await executeTransaction(safeInstance, signed)
      await onRefresh()
    } catch (err: any) {
      setError(err.message ?? 'Failed to disable module')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeployModule() {
    setLoading(true)
    setError(null)
    try {
      const result = await deployAllowanceModule({ provider: rpcUrl, signer }, safeAddress)
      setDeployedModuleAddress(result.address)
      localStorage.setItem(getAllowanceModuleKey(safeAddress), result.address)
    } catch (err: any) {
      setError(err.message ?? 'Failed to deploy module')
    } finally {
      setLoading(false)
    }
  }

  async function handleEnableModule() {
    if (!deployedModuleAddress) return
    setLoading(true)
    setError(null)
    try {
      const tx = await safeInstance.createEnableModuleTx(deployedModuleAddress)
      const signed = await signTransaction(safeInstance, tx)
      await executeTransaction(safeInstance, signed)
      await onRefresh()
    } catch (err: any) {
      setError(err.message ?? 'Failed to enable module')
    } finally {
      setLoading(false)
    }
  }

  async function handleSetAllowance() {
    setLoading(true)
    setError(null)
    try {
      const data = encodeFunctionData({
        abi: AllowanceModuleABI,
        functionName: 'setAllowance',
        args: [
          delegateAddress as `0x${string}`,
          parseEther(allowanceAmount),
          BigInt(resetPeriod),
        ],
      })
      const safeTx = await createTransaction(safeInstance, [
        {
          to: allowanceModuleAddress!,
          value: '0',
          data,
        },
      ])
      const signed = await signTransaction(safeInstance, safeTx)
      await executeTransaction(safeInstance, signed)
      await onRefresh()
    } catch (err: any) {
      setError(err.message ?? 'Failed to set allowance')
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckAllowance() {
    setLoading(true)
    setError(null)
    try {
      const { createPublicClient, http } = await import('viem')
      const client = createPublicClient({ transport: http(rpcUrl) })
      const available = await client.readContract({
        address: allowanceModuleAddress as `0x${string}`,
        abi: AllowanceModuleABI,
        functionName: 'getAvailableAllowance',
        args: [delegateAddress as `0x${string}`],
      })
      setAvailableAllowance(formatEther(available as bigint))
    } catch (err: any) {
      setError(err.message ?? 'Failed to check allowance')
    } finally {
      setLoading(false)
    }
  }

  async function handleExecuteAllowance() {
    setLoading(true)
    setError(null)
    try {
      const { createWalletClient, createPublicClient, http, defineChain } = await import('viem')
      const { privateKeyToAccount } = await import('viem/accounts')
      const transport = http(rpcUrl)
      const publicClient = createPublicClient({ transport })
      const chainId = await publicClient.getChainId()
      const chain = defineChain({
        id: chainId,
        name: `Chain ${chainId}`,
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: [rpcUrl] } },
      })
      const account = privateKeyToAccount(signer as `0x${string}`)
      const walletClient = createWalletClient({ account, chain, transport })
      const hash = await walletClient.writeContract({
        address: allowanceModuleAddress as `0x${string}`,
        abi: AllowanceModuleABI,
        functionName: 'executeAllowance',
        args: [executeTo as `0x${string}`, parseEther(executeAmount)],
      })
      await publicClient.waitForTransactionReceipt({ hash })
      await onRefresh()
    } catch (err: any) {
      setError(err.message ?? 'Failed to execute allowance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 space-y-6">
      {/* Header */}
      <h3 className="text-lg font-semibold text-white mb-2">Modules ({modules.length})</h3>

      <InfoSection tagline="Modules let authorized addresses bypass multi-sig to spend within limits.">
        A module is a smart contract that can execute transactions on behalf of the Safe without
        requiring owner signatures. The AllowanceModule grants specific delegate addresses a spending
        budget. Delegates can transfer ETH up to their allowance limit directly, without going through
        the multi-sig approval process. If a guard is active, module transactions are still subject to
        the guard's checks.
      </InfoSection>

      {/* Error display */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Module list */}
      {modules.length === 0 ? (
        <p className="text-gray-400 text-sm">No modules enabled</p>
      ) : (
        <div className="space-y-2">
          {modules.map((mod) => (
            <div
              key={mod}
              className="bg-gray-900 rounded-lg p-3 flex items-center justify-between"
            >
              <span className="font-mono text-sm text-gray-300">
                {mod.slice(0, 6)}...{mod.slice(-4)}
                {mod === deployedModuleAddress && (
                  <span className="ml-2 text-xs text-cyan-400">(AllowanceModule)</span>
                )}
              </span>
              <button
                onClick={() => handleDisableModule(mod)}
                disabled={loading}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
              >
                Disable
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Deploy / Enable section */}
      <div className="border-t border-gray-700 pt-4">
        {showDeployedNotEnabled ? (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm">
              Module deployed at{' '}
              <span className="font-mono text-cyan-400">
                {deployedModuleAddress.slice(0, 6)}...{deployedModuleAddress.slice(-4)}
              </span>
            </p>
            <button
              onClick={handleEnableModule}
              disabled={loading}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {loading ? 'Enabling...' : 'Enable Module'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleDeployModule}
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {loading ? 'Deploying...' : 'Deploy AllowanceModule'}
          </button>
        )}
      </div>

      {/* Allowance not tracked hint */}
      {hasEnabledModule && !allowanceModuleAddress && (
        <div className="border-t border-gray-700 pt-4">
          <p className="text-gray-400 text-sm">Deploy an AllowanceModule to manage allowances.</p>
        </div>
      )}

      {/* Allowance Management */}
      {allowanceModuleAddress && (
        <div className="border-t border-gray-700 pt-4 space-y-4">
          <h4 className="text-md font-semibold text-cyan-400">Allowance Management</h4>

          {/* Set Allowance */}
          <div className="space-y-3">
            <p className="text-gray-300 text-sm font-medium">Set Allowance</p>
            <p className="text-gray-500 text-xs">Grant a wallet address permission to spend up to X ETH. Reset period auto-refills the allowance (0 = no refill).</p>
            <input
              type="text"
              placeholder="Delegate address (0x...)"
              value={delegateAddress}
              onChange={(e) => setDelegateAddress(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Amount (ETH)"
                value={allowanceAmount}
                onChange={(e) => setAllowanceAmount(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Reset period (seconds)"
                value={resetPeriod}
                onChange={(e) => setResetPeriod(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={handleSetAllowance}
              disabled={loading || !delegateAddress}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm"
            >
              {loading ? 'Setting...' : 'Set Allowance'}
            </button>
          </div>

          {/* Check Allowance */}
          <div className="space-y-3">
            <p className="text-gray-300 text-sm font-medium">Check Allowance</p>
            <p className="text-gray-500 text-xs">See how much a delegate can still spend.</p>
            <div className="flex gap-3 items-center">
              <button
                onClick={handleCheckAllowance}
                disabled={loading || !delegateAddress}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded-lg transition-colors text-sm"
              >
                {loading ? 'Checking...' : 'Check Allowance'}
              </button>
              {availableAllowance !== null && (
                <span className="text-cyan-400 text-sm font-mono">
                  {availableAllowance} ETH available
                </span>
              )}
            </div>
          </div>

          {/* Execute Allowance */}
          <div className="space-y-3">
            <p className="text-gray-300 text-sm font-medium">Execute Allowance</p>
            <p className="text-gray-500 text-xs">As a delegate, send ETH using your allowance. Still subject to the guard's spending limit.</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="To address (0x...)"
                value={executeTo}
                onChange={(e) => setExecuteTo(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Amount (ETH)"
                value={executeAmount}
                onChange={(e) => setExecuteAmount(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={handleExecuteAllowance}
              disabled={loading || !executeTo || !executeAmount}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg transition-colors text-sm"
            >
              {loading ? 'Executing...' : 'Execute Allowance'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

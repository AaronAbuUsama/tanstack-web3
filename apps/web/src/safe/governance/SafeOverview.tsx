import { useState, useEffect } from 'react'
import { formatEther } from 'viem'
import { SpendingLimitGuardABI } from '../contracts/abis'

interface SafeOverviewProps {
  owners: string[]
  threshold: number
  guard: string
  rpcUrl: string
  moduleCount: number
}

export default function SafeOverview({ owners, threshold, guard, rpcUrl, moduleCount }: SafeOverviewProps) {
  const [guardLimit, setGuardLimit] = useState<string | null>(null)

  useEffect(() => {
    if (!guard) {
      setGuardLimit(null)
      return
    }
    (async () => {
      try {
        const { createPublicClient, http } = await import('viem')
        const client = createPublicClient({ transport: http(rpcUrl) })
        const limit = await client.readContract({
          address: guard as `0x${string}`,
          abi: SpendingLimitGuardABI,
          functionName: 'spendingLimit',
        })
        setGuardLimit(formatEther(limit as bigint))
      } catch {
        setGuardLimit(null)
      }
    })()
  }, [guard, rpcUrl])

  return (
    <div className="bg-gray-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">How This Safe Works</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Owners */}
        <div className="bg-gray-900/60 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Owners</div>
          <div className="text-white font-semibold">
            {threshold}-of-{owners.length} signatures
          </div>
          <p className="text-gray-400 text-xs mt-1">
            {threshold === 1
              ? 'Any single owner can approve transactions.'
              : `${threshold} owners must sign before a transaction executes.`}
          </p>
        </div>

        {/* Guard */}
        <div className="bg-gray-900/60 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Guard</div>
          {guard ? (
            <>
              <div className="text-white font-semibold">
                {guardLimit ? `${guardLimit} ETH limit` : 'Active'}
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Blocks any single transaction exceeding the spending limit.
              </p>
            </>
          ) : (
            <>
              <div className="text-yellow-400 font-semibold">None</div>
              <p className="text-gray-400 text-xs mt-1">
                No guard — all transactions pass unchecked.
              </p>
            </>
          )}
        </div>

        {/* Modules */}
        <div className="bg-gray-900/60 rounded-lg p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Modules</div>
          {moduleCount > 0 ? (
            <>
              <div className="text-white font-semibold">
                {moduleCount} active
              </div>
              <p className="text-gray-400 text-xs mt-1">
                Authorized contracts can spend without multi-sig approval.
              </p>
            </>
          ) : (
            <>
              <div className="text-gray-500 font-semibold">None</div>
              <p className="text-gray-400 text-xs mt-1">
                Only owners can initiate transactions.
              </p>
            </>
          )}
        </div>
      </div>

      {guard && moduleCount > 0 && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          The guard checks owner-signed transactions. Modules enforce their own spending rules.
        </p>
      )}
    </div>
  )
}

import { useState } from 'react'
import { parseEther } from 'viem'

interface FundSafeProps {
  safeAddress: string
  rpcUrl: string
  signer: string
  onFunded: () => Promise<void>
}

export default function FundSafe({ safeAddress, rpcUrl, signer, onFunded }: FundSafeProps) {
  const [amount, setAmount] = useState('1')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const handleFund = async () => {
    setLoading(true)
    setStatus(null)
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

      const hash = await walletClient.sendTransaction({
        to: safeAddress as `0x${string}`,
        value: parseEther(amount),
      })
      await publicClient.waitForTransactionReceipt({ hash })
      setStatus(`Sent ${amount} ETH to Safe`)
      await onFunded()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to fund Safe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 mt-4">
      <h3 className="text-sm font-semibold text-amber-400 mb-2">Dev Faucet</h3>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.1"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-amber-500 focus:outline-none"
        />
        <button
          onClick={handleFund}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Sending...' : 'Fund Safe'}
        </button>
      </div>
      {status && <p className="text-xs text-gray-400 mt-2">{status}</p>}
    </div>
  )
}

interface TokenBalance {
  name: string
  symbol: string
  balance: string
  decimals?: number
  usdValue?: string
  logoUrl?: string
}

interface TokenBalancesProps {
  tokens: TokenBalance[]
  loading?: boolean
}

export default function TokenBalances({ tokens, loading }: TokenBalancesProps) {
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Token Balances</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (tokens.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Token Balances</h3>
        <p className="text-gray-400 text-sm">No tokens found</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Token Balances</h3>
      <div className="space-y-2">
        {tokens.map((token) => (
          <div
            key={`${token.symbol}-${token.name}`}
            className="flex items-center justify-between bg-gray-900 rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              {token.logoUrl ? (
                <img src={token.logoUrl} alt={token.symbol} className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                  {token.symbol.slice(0, 2)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">{token.name}</p>
                <p className="text-xs text-gray-400">{token.symbol}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">{token.balance}</p>
              {token.usdValue && (
                <p className="text-xs text-gray-400">${token.usdValue}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

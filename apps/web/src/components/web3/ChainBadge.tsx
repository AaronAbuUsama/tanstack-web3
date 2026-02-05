interface ChainBadgeProps {
  chainName: string
  chainId: number
  isConnected?: boolean
  size?: 'sm' | 'md'
  onClick?: () => void
}

const chainColors: Record<number, string> = {
  1: 'from-blue-500 to-blue-600',       // Ethereum Mainnet
  11155111: 'from-blue-400 to-blue-500', // Sepolia
  100: 'from-green-500 to-green-600',    // Gnosis
  10200: 'from-green-400 to-green-500',  // Gnosis Chiado
  31337: 'from-gray-500 to-gray-600',    // Localhost
}

export default function ChainBadge({
  chainName,
  chainId,
  isConnected = false,
  size = 'md',
  onClick,
}: ChainBadgeProps) {
  const gradient = chainColors[chainId] ?? 'from-gray-500 to-gray-600'
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses} ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      } bg-gradient-to-r ${gradient} text-white`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isConnected ? 'bg-green-300' : 'bg-gray-300'
        }`}
      />
      {chainName}
    </Component>
  )
}

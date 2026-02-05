import { useState } from 'react'

interface AddressDisplayProps {
  address: string
  ensName?: string | null
  truncate?: boolean
  showCopy?: boolean
  className?: string
}

export default function AddressDisplay({
  address,
  ensName,
  truncate = true,
  showCopy = true,
  className = '',
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false)

  const displayAddress = truncate
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Avatar placeholder */}
      <div
        className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex-shrink-0"
        title={address}
      />
      <div className="flex flex-col">
        {ensName && <span className="text-sm font-medium text-white">{ensName}</span>}
        <span className="font-mono text-sm text-gray-300">{displayAddress}</span>
      </div>
      {showCopy && (
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-gray-700"
          title="Copy address"
        >
          {copied ? '✓' : 'Copy'}
        </button>
      )}
    </div>
  )
}

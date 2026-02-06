import { useState } from 'react'

interface OwnersProps {
  owners: string[]
  currentAddress?: string
  onAddOwner?: (address: string) => void
  onRemoveOwner?: (address: string) => void
}

export default function Owners({ owners, currentAddress, onAddOwner, onRemoveOwner }: OwnersProps) {
  const [newOwner, setNewOwner] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopied(address)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Owners ({owners.length})</h3>
      <div className="space-y-2 mb-4">
        {owners.map((owner) => (
          <div key={owner} className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${owner.toLowerCase() === currentAddress?.toLowerCase() ? 'bg-green-400' : 'bg-gray-500'}`} />
              <span className="font-mono text-sm text-gray-300">
                {owner.slice(0, 6)}...{owner.slice(-4)}
              </span>
              {owner.toLowerCase() === currentAddress?.toLowerCase() && (
                <span className="text-xs text-green-400">(you)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(owner)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                {copied === owner ? 'Copied!' : 'Copy'}
              </button>
              {onRemoveOwner && owners.length > 1 && (
                <button
                  onClick={() => onRemoveOwner(owner)}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {onAddOwner && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            placeholder="0x... new owner address"
            className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-cyan-500 focus:outline-none font-mono"
          />
          <button
            onClick={() => { if (newOwner) { onAddOwner(newOwner); setNewOwner('') } }}
            disabled={!newOwner}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
      )}
    </div>
  )
}

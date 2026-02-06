import { useState } from 'react'

interface TxBuilderProps {
  onBuild: (tx: { to: string; value: string; data: string }) => void
}

export default function TxBuilder({ onBuild }: TxBuilderProps) {
  const [to, setTo] = useState('')
  const [value, setValue] = useState('')
  const [data, setData] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!to) return
    onBuild({ to, value: value || '0', data: data || '0x' })
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Transaction Builder</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-1">Recipient Address</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x..."
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Value (ETH)</label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.0"
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Data (hex, optional)</label>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="0x..."
            rows={3}
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none font-mono text-sm resize-none"
          />
        </div>
        <button
          type="submit"
          disabled={!to}
          className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
        >
          Build Transaction
        </button>
      </form>
    </div>
  )
}

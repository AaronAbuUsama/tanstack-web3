interface ThresholdProps {
  threshold: number
  ownerCount: number
  onChangeThreshold?: (newThreshold: number) => void
}

export default function Threshold({ threshold, ownerCount, onChangeThreshold }: ThresholdProps) {
  const percentage = ownerCount > 0 ? Math.round((threshold / ownerCount) * 100) : 0

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Threshold</h3>
      <div className="flex items-center gap-4 mb-4">
        <div className="text-4xl font-bold text-cyan-400">{threshold}</div>
        <div className="text-gray-400">
          <p className="text-lg">of {ownerCount} owners</p>
          <p className="text-sm">({percentage}% required)</p>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
        <div
          className="bg-cyan-500 h-3 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {onChangeThreshold && (
        <div className="flex gap-2">
          {Array.from({ length: ownerCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => onChangeThreshold(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                n === threshold
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

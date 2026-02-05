interface ModulesProps {
  modules: string[]
}

export default function Modules({ modules }: ModulesProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Modules ({modules.length})</h3>
      {modules.length === 0 ? (
        <p className="text-gray-400 text-sm">No modules enabled</p>
      ) : (
        <div className="space-y-2">
          {modules.map((mod) => (
            <div key={mod} className="bg-gray-900 rounded-lg p-3">
              <span className="font-mono text-sm text-gray-300">{mod}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

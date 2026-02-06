import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface InfoSectionProps {
  tagline: string
  children: ReactNode
}

export default function InfoSection({ tagline, children }: InfoSectionProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-4">
      <p className="text-gray-400 text-sm">{tagline}</p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-cyan-400 hover:text-cyan-300 text-xs mt-1 flex items-center gap-1 transition-colors"
      >
        {open ? 'Less' : 'Learn more'}
        <ChevronDown
          size={12}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-2 text-gray-400 text-xs leading-relaxed bg-gray-900/50 rounded-lg p-3">
          {children}
        </div>
      )}
    </div>
  )
}

import { createContext, useEffect, useState, type ReactNode } from 'react'
import { type SafeMode, detectSafeMode } from './detect'
import { getSafeInfo as getIframeSafeInfo } from './iframe'

export interface SafeContextValue {
  mode: SafeMode
  isInSafe: boolean
  safeAddress: string | null
  owners: string[]
  threshold: number
  chainId: number | null
  loading: boolean
}

const defaultValue: SafeContextValue = {
  mode: 'standalone',
  isInSafe: false,
  safeAddress: null,
  owners: [],
  threshold: 0,
  chainId: null,
  loading: true,
}

export const SafeContext = createContext<SafeContextValue>(defaultValue)

export default function SafeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SafeContextValue>(defaultValue)

  useEffect(() => {
    const mode = detectSafeMode()

    if (mode === 'iframe') {
      getIframeSafeInfo()
        .then((info) => {
          setState({
            mode: 'iframe',
            isInSafe: true,
            safeAddress: info.safeAddress,
            owners: info.owners,
            threshold: info.threshold,
            chainId: info.chainId,
            loading: false,
          })
        })
        .catch(() => {
          setState({
            ...defaultValue,
            mode: 'iframe',
            loading: false,
          })
        })
    } else {
      setState({
        ...defaultValue,
        mode: 'standalone',
        loading: false,
      })
    }
  }, [])

  return (
    <SafeContext.Provider value={state}>
      {children}
    </SafeContext.Provider>
  )
}

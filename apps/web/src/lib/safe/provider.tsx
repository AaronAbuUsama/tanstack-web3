import { createContext, useEffect, useState, type ReactNode } from 'react'
import { type SafeMode, detectSafeMode } from './detect'
import { getSafeInfo as getIframeSafeInfo } from './iframe'
import { createSafeInstance, deploySafe as deploySafeLib, getSafeInfo } from './standalone'

export interface SafeContextValue {
  mode: SafeMode
  isInSafe: boolean
  safeAddress: string | null
  owners: string[]
  threshold: number
  chainId: number | null
  loading: boolean
  safeInstance: any | null
  error: string | null
  connectSafe: (address: string, provider: string, signer?: string) => Promise<void>
  deploySafe: (config: { owners: string[]; threshold: number; provider: string; signer: string }) => Promise<string>
  disconnectSafe: () => void
}

interface SafeState {
  mode: SafeMode
  isInSafe: boolean
  safeAddress: string | null
  owners: string[]
  threshold: number
  chainId: number | null
  loading: boolean
  safeInstance: any | null
  error: string | null
}

const defaultState: SafeState = {
  mode: 'standalone',
  isInSafe: false,
  safeAddress: null,
  owners: [],
  threshold: 0,
  chainId: null,
  loading: true,
  safeInstance: null,
  error: null,
}

const defaultValue: SafeContextValue = {
  ...defaultState,
  connectSafe: async () => {},
  deploySafe: async () => '',
  disconnectSafe: () => {},
}

export const SafeContext = createContext<SafeContextValue>(defaultValue)

export default function SafeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SafeState>(defaultState)

  useEffect(() => {
    const mode = detectSafeMode()

    if (mode === 'iframe') {
      getIframeSafeInfo()
        .then((info) => {
          setState((prev) => ({
            ...prev,
            mode: 'iframe',
            isInSafe: true,
            safeAddress: info.safeAddress,
            owners: info.owners,
            threshold: info.threshold,
            chainId: info.chainId,
            loading: false,
          }))
        })
        .catch(() => {
          setState((prev) => ({
            ...prev,
            mode: 'iframe',
            loading: false,
          }))
        })
    } else {
      setState((prev) => ({
        ...prev,
        mode: 'standalone',
        loading: false,
      }))
    }
  }, [])

  const connectSafe = async (address: string, provider: string, signer?: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const instance = await createSafeInstance({ safeAddress: address, provider, signer })
      const info = await getSafeInfo(instance)
      setState({
        mode: 'standalone',
        isInSafe: true,
        safeAddress: info.address,
        owners: info.owners,
        threshold: info.threshold,
        chainId: Number(info.chainId),
        loading: false,
        safeInstance: instance,
        error: null,
      })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to connect to Safe',
      }))
    }
  }

  const deploySafeFn = async (config: {
    owners: string[]
    threshold: number
    provider: string
    signer: string
  }) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      const safeSdk = await deploySafeLib(config)
      const address = await safeSdk.getAddress()
      await connectSafe(address, config.provider, config.signer)
      return address
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to deploy Safe',
      }))
      return ''
    }
  }

  const disconnectSafe = () => {
    setState({
      ...defaultState,
      mode: 'standalone',
      loading: false,
    })
  }

  const value: SafeContextValue = {
    ...state,
    connectSafe,
    deploySafe: deploySafeFn,
    disconnectSafe,
  }

  return <SafeContext.Provider value={value}>{children}</SafeContext.Provider>
}

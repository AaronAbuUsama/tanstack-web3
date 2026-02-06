import { createContext, useEffect, useState, type ReactNode } from 'react'
import { type SafeMode, detectSafeMode } from './detect'
import { getSafeInfo as getIframeSafeInfo } from './iframe'
import { createSafeInstance, deploySafe as deploySafeLib, getSafeInfo } from './standalone'
import type { SafeInstance } from './types'

/** Turn raw viem/RPC errors into human-readable messages. */
function friendlyError(err: unknown, fallback: string): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('Failed to fetch') || msg.includes('ECONNREFUSED') || msg.includes('fetch failed')) {
    return 'Could not connect to local blockchain. Make sure Anvil is running (bun run dev starts it automatically).'
  }
  if (msg.includes('Invalid multiSend contract address') || msg.includes('Invalid SafeProxyFactory')) {
    return 'Safe contracts are not deployed on this chain. Use a supported network (Gnosis Chiado, Gnosis, Sepolia) or fork one with: anvil --fork-url https://rpc.chiadochain.net'
  }
  return msg || fallback
}

export interface SafeContextValue {
  mode: SafeMode
  isInSafe: boolean
  safeAddress: string | null
  owners: string[]
  threshold: number
  chainId: number | null
  loading: boolean
  safeInstance: SafeInstance | null
  error: string | null
  modules: string[]
  balance: string
  guard: string
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
  safeInstance: SafeInstance | null
  error: string | null
  modules: string[]
  balance: string
  guard: string
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
  modules: [],
  balance: '0',
  guard: '',
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
      const info = await getSafeInfo(instance, provider)
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
        modules: info.modules,
        balance: info.balance,
        guard: info.guard,
      })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: friendlyError(err, 'Failed to connect to Safe'),
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
      // deploySafeLib now handles the full deploy: predict → send tx → re-init
      const deployedSafe = await deploySafeLib(config)
      const info = await getSafeInfo(deployedSafe, config.provider)
      setState({
        mode: 'standalone',
        isInSafe: true,
        safeAddress: info.address,
        owners: info.owners,
        threshold: info.threshold,
        chainId: Number(info.chainId),
        loading: false,
        safeInstance: deployedSafe,
        error: null,
        modules: info.modules,
        balance: info.balance,
        guard: info.guard,
      })
      return info.address
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: friendlyError(err, 'Failed to deploy Safe'),
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

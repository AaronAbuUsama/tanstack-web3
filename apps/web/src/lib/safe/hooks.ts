import { useContext } from 'react'
import { SafeContext, type SafeContextValue } from './provider'

export function useSafe(): SafeContextValue {
  return useContext(SafeContext)
}

export function useSafeInstance() {
  const ctx = useContext(SafeContext)
  return ctx.safeInstance
}

export function useConnectSafe() {
  const ctx = useContext(SafeContext)
  return ctx.connectSafe
}

export function useDeploySafe() {
  const ctx = useContext(SafeContext)
  return ctx.deploySafe
}

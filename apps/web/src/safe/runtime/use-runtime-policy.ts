import { useMemo } from 'react'
import { resolveRuntimePolicy } from './resolve-runtime-policy'
import type { RuntimePolicyInput } from './types'

export function useRuntimePolicy(input: RuntimePolicyInput) {
  return useMemo(
    () => resolveRuntimePolicy(input),
    [
      input.appContext,
      input.isConnected,
      input.connectorId,
      input.txServiceEnabled,
      input.txServiceSupportedChain,
    ],
  )
}

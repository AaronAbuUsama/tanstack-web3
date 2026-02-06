import { useContext } from 'react'
import { SafeContext, type SafeContextValue } from './provider'

export function useSafe(): SafeContextValue {
  return useContext(SafeContext)
}

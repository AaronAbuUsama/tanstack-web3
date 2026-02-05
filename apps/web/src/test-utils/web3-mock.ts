import { type ReactNode, createElement, useState } from 'react'
import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Create a mock wagmi config for testing.
 */
export function createMockWeb3Config() {
  return createConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(),
    },
    ssr: true,
  })
}

/**
 * Mock Web3 provider for testing.
 * Wraps children with WagmiProvider + QueryClientProvider using mock config.
 */
export function MockWeb3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }))
  const config = createMockWeb3Config()

  return createElement(
    WagmiProvider,
    { config },
    createElement(QueryClientProvider, { client: queryClient }, children),
  )
}

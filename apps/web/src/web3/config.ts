import { http, createConfig } from 'wagmi'
import type { Chain } from 'viem'
import { mainnet, sepolia, gnosis, gnosisChiado } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { devWallet } from './dev-wallet'

/**
 * In dev mode, Anvil forks Chiado (chain ID 10200) on localhost:8545.
 * Route the Gnosis Chiado transport to the local fork so wagmi talks to Anvil.
 */
const chiadoTransport = import.meta.env.DEV
  ? http('http://127.0.0.1:8545')
  : http()

// In dev mode, override the chain name to indicate local Anvil fork
const devChiadoFork = import.meta.env.DEV
  ? { ...gnosisChiado, name: 'Anvil (Chiado Fork)' } as const
  : gnosisChiado

const chains = [
  mainnet,
  sepolia,
  gnosis,
  devChiadoFork,
] as const

const connectors = [
  injected(),
  ...(import.meta.env.DEV ? [devWallet()] : []),
]

export const config = createConfig({
  chains: chains as unknown as readonly [Chain, ...Chain[]],
  connectors,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [gnosis.id]: http(),
    [devChiadoFork.id]: chiadoTransport,
  },
  ssr: true,
})

export default config

import { http, createConfig } from 'wagmi'
import type { Chain } from 'viem'
import { mainnet, sepolia, gnosis, gnosisChiado } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { devWallet } from './dev-wallet'

const localhost = {
  id: 31337,
  name: 'Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
} as const satisfies Chain

const chains = [
  mainnet,
  sepolia,
  gnosis,
  gnosisChiado,
  ...(import.meta.env.DEV ? [localhost] : []),
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
    [gnosisChiado.id]: http(),
    [localhost.id]: http(),
  },
  ssr: true,
})

export default config

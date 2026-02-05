import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, gnosis, gnosisChiado } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [mainnet, sepolia, gnosis, gnosisChiado],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [gnosis.id]: http(),
    [gnosisChiado.id]: http(),
  },
  ssr: true,
})

export default config

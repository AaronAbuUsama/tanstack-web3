import { defineChain } from 'viem'
import { mainnet, sepolia, gnosis, gnosisChiado } from 'wagmi/chains'

export const localhost = defineChain({
  id: 31337,
  name: 'Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
})

export { mainnet, sepolia, gnosis, gnosisChiado }

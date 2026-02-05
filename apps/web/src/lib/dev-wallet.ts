import { createConnector } from 'wagmi'
import {
  createWalletClient,
  http,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const HARDHAT_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const
const account = privateKeyToAccount(HARDHAT_PRIVATE_KEY)

export function devWallet() {
  return createConnector(((config: Parameters<Parameters<typeof createConnector>[0]>[0]) => {
    let currentChainId: number

    return {
      id: 'dev-wallet',
      name: 'Dev Wallet',
      type: 'dev-wallet' as const,

      async connect({ chainId } = {}) {
        const chain = config.chains.find((c) => c.id === chainId) ?? config.chains[0]
        currentChainId = chain.id
        return {
          accounts: [account.address] as readonly `0x${string}`[],
          chainId: chain.id,
        }
      },

      async disconnect() {},

      async getAccounts() {
        return [account.address] as readonly `0x${string}`[]
      },

      async getChainId() {
        return currentChainId ?? config.chains[0].id
      },

      async getProvider({ chainId } = {}) {
        const chain = config.chains.find((c) => c.id === chainId) ?? config.chains[0]
        const client = createWalletClient({
          account,
          chain,
          transport: http(),
        })
        return {
          request: client.request,
        }
      },

      async isAuthorized() {
        return true
      },

      async switchChain({ chainId }) {
        const chain = config.chains.find((c) => c.id === chainId)
        if (!chain) throw new Error(`Chain ${chainId} not found`)
        currentChainId = chainId
        config.emitter.emit('change', { chainId })
        return chain
      },

      onAccountsChanged() {},
      onChainChanged() {},
      onDisconnect() {},
    }
  }) as Parameters<typeof createConnector>[0])
}

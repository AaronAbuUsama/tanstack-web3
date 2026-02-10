import { createConnector } from 'wagmi'
import {
  createWalletClient,
  http,
  toHex,
} from 'viem'
import { mnemonicToAccount } from 'viem/accounts'

export const DEV_WALLET_MNEMONIC =
  'test test test test test test test test test test test junk' as const

let activeAccountIndex = 0

function assertValidAccountIndex(accountIndex: number) {
  if (!Number.isInteger(accountIndex) || accountIndex < 0) {
    throw new Error('Dev wallet account index must be a non-negative integer.')
  }
}

export function getDevWalletAccountForIndex(accountIndex: number) {
  assertValidAccountIndex(accountIndex)
  return mnemonicToAccount(DEV_WALLET_MNEMONIC, {
    accountIndex: 0,
    addressIndex: accountIndex,
  })
}

export function getDevWalletSignerForIndex(accountIndex: number): `0x${string}` {
  const account = getDevWalletAccountForIndex(accountIndex)
  const privateKey = account.getHdKey().privateKey
  if (!privateKey) {
    throw new Error(`Could not derive private key for dev wallet account index ${accountIndex}.`)
  }
  return toHex(privateKey)
}

export function getDevWalletActiveAccountIndex() {
  return activeAccountIndex
}

export function setDevWalletActiveAccountIndex(accountIndex: number) {
  assertValidAccountIndex(accountIndex)
  activeAccountIndex = accountIndex
}

export function getDevWalletActiveAccount() {
  return getDevWalletAccountForIndex(activeAccountIndex)
}

export function getDevWalletActiveSigner(): `0x${string}` {
  return getDevWalletSignerForIndex(activeAccountIndex)
}

export function devWallet() {
  return createConnector(((config: Parameters<Parameters<typeof createConnector>[0]>[0]) => {
    let currentChainId: number

    return {
      id: 'dev-wallet',
      name: 'Dev Wallet',
      type: 'dev-wallet' as const,

      async connect({ chainId } = {}) {
        const chain = config.chains.find((c) => c.id === chainId) ?? config.chains[0]
        const account = getDevWalletActiveAccount()
        currentChainId = chain.id
        return {
          accounts: [account.address] as readonly `0x${string}`[],
          chainId: chain.id,
        }
      },

      async disconnect() {},

      async getAccounts() {
        const account = getDevWalletActiveAccount()
        return [account.address] as readonly `0x${string}`[]
      },

      async getChainId() {
        return currentChainId ?? config.chains[0].id
      },

      async getProvider({ chainId } = {}) {
        const chain = config.chains.find((c) => c.id === chainId) ?? config.chains[0]
        const account = getDevWalletActiveAccount()
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

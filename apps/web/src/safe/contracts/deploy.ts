import { SpendingLimitGuardABI, AllowanceModuleABI } from './abis'
import { SpendingLimitGuardBytecode, AllowanceModuleBytecode } from './bytecodes'

interface DeployConfig {
  provider: string
  signer: string
}

interface DeployResult {
  address: string
  hash: string
}

async function getClients(config: DeployConfig) {
  const { createWalletClient, createPublicClient, http, defineChain } = await import('viem')
  const { privateKeyToAccount } = await import('viem/accounts')

  const transport = http(config.provider)
  const publicClient = createPublicClient({ transport })
  const chainId = await publicClient.getChainId()

  const chain = defineChain({
    id: chainId,
    name: `Chain ${chainId}`,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [config.provider] } },
  })

  const account = privateKeyToAccount(config.signer as `0x${string}`)
  const walletClient = createWalletClient({ account, chain, transport })

  return { publicClient, walletClient }
}

export async function deploySpendingLimitGuard(config: DeployConfig, safeAddress: string, spendingLimit: bigint): Promise<DeployResult> {
  const { publicClient, walletClient } = await getClients(config)
  const hash = await walletClient.deployContract({
    abi: SpendingLimitGuardABI,
    bytecode: SpendingLimitGuardBytecode,
    args: [safeAddress as `0x${string}`, spendingLimit],
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { address: receipt.contractAddress!, hash }
}

export async function deployAllowanceModule(config: DeployConfig, safeAddress: string): Promise<DeployResult> {
  const { publicClient, walletClient } = await getClients(config)
  const hash = await walletClient.deployContract({
    abi: AllowanceModuleABI,
    bytecode: AllowanceModuleBytecode,
    args: [safeAddress as `0x${string}`],
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  return { address: receipt.contractAddress!, hash }
}

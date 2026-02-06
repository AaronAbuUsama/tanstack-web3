import SafeAppsSDK, { type SafeInfo } from '@safe-global/safe-apps-sdk'
import type { BaseTransaction } from '@safe-global/safe-apps-sdk'

let sdkInstance: SafeAppsSDK | null = null

function getSDK(): SafeAppsSDK {
  if (!sdkInstance) {
    sdkInstance = new SafeAppsSDK()
  }
  return sdkInstance
}

export async function getSafeInfo(): Promise<SafeInfo> {
  const sdk = getSDK()
  return sdk.safe.getInfo()
}

export async function sendTransactions(txs: BaseTransaction[]): Promise<string> {
  const sdk = getSDK()
  const response = await sdk.txs.send({ txs })
  return response.safeTxHash
}

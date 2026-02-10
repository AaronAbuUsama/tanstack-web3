import type {
	DevAccountOption,
	RuntimePolicySummary,
} from "../../../design-system/compositions/command-center";
import { getDevWalletAccountForIndex } from "../../../web3/dev-wallet";
import type { RuntimePolicy } from "../../runtime";

export interface MapSetupRuntimeInput {
	activeChainLabel: string;
	activeDevIndex: number;
	devAccountCount?: number;
	policy: RuntimePolicy;
}

export interface MapSetupRuntimeOutput {
	activeChainLabel: string;
	activeDevIndex: number;
	devAccounts: DevAccountOption[];
	policy: RuntimePolicySummary;
}

export function mapSetupRuntimeScreen({
	activeChainLabel,
	activeDevIndex,
	devAccountCount = 3,
	policy,
}: MapSetupRuntimeInput): MapSetupRuntimeOutput {
	return {
		activeChainLabel,
		activeDevIndex,
		devAccounts: Array.from({ length: devAccountCount }, (_, index) => {
			const account = getDevWalletAccountForIndex(index);
			return {
				address: account.address,
				balanceLabel: "10,000 ETH",
				id: `dev-account-${index}`,
				index,
			};
		}),
		policy: {
			appContext: policy.appContext,
			signerProvider: policy.signerProvider,
			txSubmissionPath: policy.txSubmissionPath,
		},
	};
}

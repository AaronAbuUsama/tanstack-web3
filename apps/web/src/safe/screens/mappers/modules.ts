import { formatUnits } from "viem";
import type { ModuleDelegate } from "../../../design-system/compositions/command-center";
import type { AllowanceDelegateState } from "../../module/types";

function shortenAddress(address: string) {
	if (address.length <= 10) return address;
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export type ModulesScreenMode = "active" | "inactive" | "deploy-ready";

export interface MapModulesScreenInput {
	activeModuleAddress: string | null;
	allowanceDelegates: AllowanceDelegateState[];
	deployedModuleAddress: string | null;
}

export interface MapModulesScreenOutput {
	delegates: ModuleDelegate[];
	mode: ModulesScreenMode;
	moduleAddress: string;
	moduleName: string;
	primaryActionLabel: string;
	statusDescription: string;
}

export function mapModulesScreen({
	activeModuleAddress,
	allowanceDelegates,
	deployedModuleAddress,
}: MapModulesScreenInput): MapModulesScreenOutput {
	const mode: ModulesScreenMode = activeModuleAddress
		? "active"
		: deployedModuleAddress
			? "deploy-ready"
			: "inactive";

	const moduleAddress = activeModuleAddress
		? shortenAddress(activeModuleAddress)
		: deployedModuleAddress
			? shortenAddress(deployedModuleAddress)
			: "not deployed";

	const statusDescription =
		mode === "active"
			? `Active • ${moduleAddress} • delegates can spend without multi-sig approval up to allowance limits.`
			: mode === "deploy-ready"
				? `Deployed • ${moduleAddress} • enable this module to allow delegated spending.`
				: "No module enabled • deploy AllowanceModule to configure delegated spending rules.";

	const primaryActionLabel =
		mode === "active"
			? "Disable"
			: mode === "deploy-ready"
				? "Enable Module"
				: "Deploy AllowanceModule";

	return {
		delegates: allowanceDelegates.map((delegate) => {
			const amountEth = formatUnits(delegate.amountWei, 18);
			const spentEth = formatUnits(delegate.spentWei, 18);
			const availableEth = formatUnits(delegate.availableWei, 18);
			const utilizationPercent =
				delegate.amountWei > 0n
					? Math.max(
							0,
							Math.min(
								100,
								Math.round(
									Number((delegate.spentWei * 10000n) / delegate.amountWei) / 100,
								),
							),
						)
					: 0;

			const resetPeriod =
				delegate.resetPeriodSeconds === 0n
					? "manual"
					: delegate.resetPeriodSeconds === 86400n
						? "daily"
						: delegate.resetPeriodSeconds === 604800n
							? "weekly"
							: delegate.resetPeriodSeconds === 2592000n
								? "monthly"
								: "custom";
			const resetLabel =
				delegate.resetPeriodSeconds === 0n
					? "No automatic reset"
					: `Resets every ${delegate.resetPeriodSeconds}s`;

			return {
				address: shortenAddress(delegate.address),
				id: delegate.address.toLowerCase(),
				availableLabel: `${availableEth} ETH available`,
				resetLabel,
				resetPeriod,
				usedLabel: `${spentEth} / ${amountEth} ETH`,
				utilizationPercent,
			};
		}),
		mode,
		moduleAddress,
		moduleName: "AllowanceModule",
		primaryActionLabel,
		statusDescription,
	};
}

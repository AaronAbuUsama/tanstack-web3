import type { GuardLimitSummary } from "../../../design-system/compositions/command-center";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function shortenAddress(address: string) {
	if (address.length <= 10) return address;
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function parseDecimal(value?: string | null) {
	if (!value) return null;
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : null;
}

export type GuardScreenMode = "active" | "inactive" | "deploy-ready";

export interface MapGuardScreenInput {
	currentLimitEth: string | null;
	deployedGuardAddress: string | null;
	guardAddress: string;
	spendingLimitEth: string;
}

export interface MapGuardScreenOutput {
	active: boolean;
	guardAddress: string;
	guardDescription: string;
	guardName: string;
	limitSummary: GuardLimitSummary;
	mode: GuardScreenMode;
	primaryActionLabel: string;
}

export function mapGuardScreen({
	currentLimitEth,
	deployedGuardAddress,
	guardAddress,
	spendingLimitEth,
}: MapGuardScreenInput): MapGuardScreenOutput {
	const active =
		Boolean(guardAddress) &&
		guardAddress.toLowerCase() !== ZERO_ADDRESS.toLowerCase();
	const mode: GuardScreenMode = active
		? "active"
		: deployedGuardAddress
			? "deploy-ready"
			: "inactive";

	const maxLimit = currentLimitEth ?? spendingLimitEth;
	const parsedCurrent = parseDecimal(currentLimitEth) ?? 0;
	const parsedMax = parseDecimal(maxLimit);
	const utilizationPercent =
		parsedMax && parsedMax > 0
			? Math.max(0, Math.min(100, Math.round((parsedCurrent / parsedMax) * 100)))
			: 0;

	const resolvedGuardAddress = active
		? shortenAddress(guardAddress)
		: deployedGuardAddress
			? shortenAddress(deployedGuardAddress)
			: "not deployed";

	const guardDescription = active
		? `Active • ${resolvedGuardAddress} • blocks transactions exceeding the configured limit`
		: deployedGuardAddress
			? `Deployed • ${resolvedGuardAddress} • enable this guard to enforce limits`
			: "No guard enabled • deploy a spending limit guard to enforce limits";

	const primaryActionLabel =
		mode === "active"
			? "Disable Guard"
			: mode === "deploy-ready"
				? "Enable Guard"
				: "Deploy Guard";

	return {
		active,
		guardAddress: resolvedGuardAddress,
		guardDescription,
		guardName: "SpendingLimitGuard",
		limitSummary: {
			currentLabel: `${parsedCurrent.toFixed(2)} ETH`,
			maxLabel: `${maxLimit} ETH`,
			utilizationPercent,
		},
		mode,
		primaryActionLabel,
	};
}

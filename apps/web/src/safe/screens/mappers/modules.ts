import type {
	ModuleDelegate,
} from "../../../design-system/compositions/command-center";

function shortenAddress(address: string) {
	if (address.length <= 10) return address;
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export type ModulesScreenMode = "active" | "inactive" | "deploy-ready";

export interface MapModulesScreenInput {
	deployedModuleAddress: string | null;
	modules: string[];
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
	deployedModuleAddress,
	modules,
}: MapModulesScreenInput): MapModulesScreenOutput {
	const activeModule = modules[0] ?? null;
	const mode: ModulesScreenMode = activeModule
		? "active"
		: deployedModuleAddress
			? "deploy-ready"
			: "inactive";

	const moduleAddress = activeModule
		? shortenAddress(activeModule)
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
		delegates: modules.map((moduleAddressValue, index) => ({
			address: shortenAddress(moduleAddressValue),
			id: `${index}:${moduleAddressValue.toLowerCase()}`,
			resetLabel: "Resets in n/a",
			resetPeriod: "module",
			usedLabel: "0.00 / 0.00 ETH",
			utilizationPercent: 0,
		})),
		mode,
		moduleAddress,
		moduleName: "AllowanceModule",
		primaryActionLabel,
		statusDescription,
	};
}

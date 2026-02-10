import type { SidebarNavSection } from "../shells";
import { SidebarShell } from "../shells";

export interface SidebarNavProps {
	navSections: SidebarNavSection[];
	safeAddress: string;
	safeBalanceLabel: string;
	thresholdLabel: string;
}

export function SidebarNav({
	navSections,
	safeAddress,
	safeBalanceLabel,
	thresholdLabel,
}: SidebarNavProps) {
	return (
		<SidebarShell
			navSections={navSections}
			safeAddress={safeAddress}
			safeBalanceLabel={safeBalanceLabel}
			thresholdLabel={thresholdLabel}
		/>
	);
}

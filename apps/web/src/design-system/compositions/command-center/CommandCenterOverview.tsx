import type { ReactNode } from "react";
import {
	GuardStatusBanner,
	OwnerThresholdChip,
	PendingTxRow,
	type PendingTxVisualState,
} from "../../domains/safe";
import type {
	ActivityListItem,
	StatStripItem,
} from "../../fixtures/command-center";
import { ActivityList, StatStrip } from "../../patterns";
import type { SidebarNavSection } from "../../shells";
import { PanelShell } from "../../shells";
import { CommandCenterScreenShell } from "./CommandCenterScreenShell";
import "./command-center.css";

export interface PendingPreview {
	confirmations: number;
	idLabel: string;
	state: PendingTxVisualState;
	threshold: number;
	toLabel: string;
	valueLabel: string;
}

export interface CommandCenterOverviewProps {
	activity: ActivityListItem[];
	address?: string;
	chainLabel: string;
	embedded?: boolean;
	guardActive: boolean;
	guardDescription: string;
	guardTitle: string;
	navSections: SidebarNavSection[];
	onDisconnect?: () => void;
	pendingPreview?: PendingPreview;
	safeAddress: string;
	safeBalanceLabel: string;
	stats: StatStripItem[];
	statusBarWalletControls?: ReactNode;
	statusBalanceLabel: string;
	thresholdLabel: string;
}

export function CommandCenterOverview({
	activity,
	address,
	chainLabel,
	embedded = false,
	guardActive,
	guardDescription,
	guardTitle,
	navSections,
	onDisconnect,
	pendingPreview,
	safeAddress,
	safeBalanceLabel,
	stats,
	statusBarWalletControls,
	statusBalanceLabel,
	thresholdLabel,
}: CommandCenterOverviewProps) {
	return (
		<CommandCenterScreenShell
			address={address}
			chainLabel={chainLabel}
			embedded={embedded}
			navSections={navSections}
			onDisconnect={onDisconnect}
			safeAddress={safeAddress}
			safeBalanceLabel={safeBalanceLabel}
			statusBarWalletControls={statusBarWalletControls}
			statusBalanceLabel={statusBalanceLabel}
			thresholdLabel={thresholdLabel}
			title="Command Center Overview"
			titleIcon="📊"
		>
			<StatStrip items={stats} />

			<div className="ds-command-center__panels">
				<div className="ds-command-center__panel-stack">
					<GuardStatusBanner
						active={guardActive}
						description={guardDescription}
						title={guardTitle}
					/>
					<OwnerThresholdChip valueLabel={thresholdLabel} />
				</div>

				<div className="ds-command-center__panel-stack">
					<ActivityList entries={activity} />
					{pendingPreview ? (
						<PanelShell tagLabel="pending" title="Pending Preview">
							<PendingTxRow
								confirmations={pendingPreview.confirmations}
								idLabel={pendingPreview.idLabel}
								state={pendingPreview.state}
								threshold={pendingPreview.threshold}
								toLabel={pendingPreview.toLabel}
								valueLabel={pendingPreview.valueLabel}
							/>
						</PanelShell>
					) : null}
				</div>
			</div>
		</CommandCenterScreenShell>
	);
}

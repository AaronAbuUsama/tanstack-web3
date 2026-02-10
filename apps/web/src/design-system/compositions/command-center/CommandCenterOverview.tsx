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
import { ActivityList, SidebarNav, StatStrip } from "../../patterns";
import type { SidebarNavSection } from "../../shells";
import { PanelShell, StatusBarShell } from "../../shells";
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
	pendingPreview?: PendingPreview;
	safeAddress: string;
	safeBalanceLabel: string;
	stats: StatStripItem[];
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
	pendingPreview,
	safeAddress,
	safeBalanceLabel,
	stats,
	statusBalanceLabel,
	thresholdLabel,
}: CommandCenterOverviewProps) {
	return (
		<section className={`ds-command-center ${embedded ? "is-embedded" : ""}`}>
			<StatusBarShell
				address={address}
				balanceLabel={statusBalanceLabel}
				chainLabel={chainLabel}
				connected
			/>
			<div className="ds-command-center__layout">
				<SidebarNav
					navSections={navSections}
					safeAddress={safeAddress}
					safeBalanceLabel={safeBalanceLabel}
					thresholdLabel={thresholdLabel}
				/>
				<main className="ds-command-center__main">
					<h2 className="ds-command-center__title">
						<span aria-hidden className="ds-command-center__title-icon">
							📊
						</span>
						Command Center Overview
					</h2>

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
				</main>
			</div>
		</section>
	);
}

import { GuardStatusBanner } from "../../domains/safe";
import { Button, Input } from "../../primitives";
import { PanelShell } from "../../shells";
import {
	CommandCenterScreenShell,
	type CommandCenterScreenShellProps,
} from "./CommandCenterScreenShell";
import "./command-center.css";

export interface GuardLimitSummary {
	currentLabel: string;
	maxLabel: string;
	utilizationPercent: number;
}

export interface CommandCenterGuardProps
	extends Omit<
		CommandCenterScreenShellProps,
		"children" | "title" | "titleIcon"
	> {
	guardAddress: string;
	guardName: string;
	limitSummary: GuardLimitSummary;
}

export function CommandCenterGuard({
	address,
	chainLabel,
	embedded,
	guardAddress,
	guardName,
	limitSummary,
	navSections,
	safeAddress,
	safeBalanceLabel,
	statusBalanceLabel,
	thresholdLabel,
}: CommandCenterGuardProps) {
	return (
		<CommandCenterScreenShell
			address={address}
			chainLabel={chainLabel}
			embedded={embedded}
			navSections={navSections}
			safeAddress={safeAddress}
			safeBalanceLabel={safeBalanceLabel}
			statusBalanceLabel={statusBalanceLabel}
			thresholdLabel={thresholdLabel}
			title="Spending Guard"
			titleIcon="⚠"
		>
			<GuardStatusBanner
				active
				description={`Active • ${guardAddress} • blocks transactions exceeding the configured limit`}
				title={guardName}
			/>

			<section className="ds-command-guard__limit-display">
				<div className="ds-command-guard__limit-value">
					<span className="ds-command-guard__limit-label">
						Per-Transaction Limit
					</span>
					<p className="ds-command-guard__limit-number">
						{limitSummary.maxLabel}
					</p>
				</div>
				<div className="ds-command-guard__limit-meter">
					<span className="ds-command-guard__limit-label">
						Last Transaction Used
					</span>
					<div className="ds-command-guard__progress-track">
						<div
							className="ds-command-guard__progress-fill"
							style={{ width: `${limitSummary.utilizationPercent}%` }}
						/>
					</div>
					<div className="ds-command-guard__progress-meta">
						<span>{limitSummary.currentLabel} used</span>
						<span>{limitSummary.maxLabel} max</span>
					</div>
				</div>
			</section>

			<div className="ds-command-guard__panel-grid">
				<PanelShell title="How It Works">
					<p className="ds-command-copy">
						The guard checks owner-signed Safe executions before they can settle
						on-chain. If the ETH value exceeds the configured limit, execution
						is reverted.
					</p>
					<p className="ds-command-copy">
						Module spending limits are enforced by each enabled module contract
						and are configured separately.
					</p>
				</PanelShell>

				<PanelShell title="Change Limit">
					<div className="ds-command-form-stack">
						<Input
							defaultValue={limitSummary.maxLabel}
							label="New Limit (ETH)"
						/>
						<Button>Update Limit</Button>
						<p className="ds-command-copy is-muted">
							Changing limit parameters requires deploying a new guard contract
							and enabling it on the Safe.
						</p>
					</div>
				</PanelShell>
			</div>
		</CommandCenterScreenShell>
	);
}

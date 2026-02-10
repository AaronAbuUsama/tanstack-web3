import { Button } from "../../primitives";
import { PanelShell } from "../../shells";
import {
	CommandCenterScreenShell,
	type CommandCenterScreenShellProps,
} from "./CommandCenterScreenShell";
import "./command-center.css";

export interface CommandCenterOwner {
	address: string;
	id: string;
	isCurrentSigner?: boolean;
}

export interface CommandCenterOwnersProps
	extends Omit<
		CommandCenterScreenShellProps,
		"children" | "title" | "titleIcon"
	> {
	ownerCount: number;
	owners: CommandCenterOwner[];
	threshold: number;
}

export function CommandCenterOwners({
	address,
	chainLabel,
	embedded,
	navSections,
	ownerCount,
	owners,
	safeAddress,
	safeBalanceLabel,
	statusBalanceLabel,
	threshold,
	thresholdLabel,
}: CommandCenterOwnersProps) {
	const thresholdOptions = Array.from(
		{ length: ownerCount },
		(_, index) => index + 1,
	);

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
			title="Owners & Threshold"
			titleIcon="♛"
		>
			<div className="ds-command-owners__threshold">
				<span className="ds-command-owners__threshold-label">Threshold</span>
				<div className="ds-command-owners__threshold-options">
					{thresholdOptions.map((option) => (
						<button
							className={`ds-command-owners__threshold-option ${option === threshold ? "is-selected" : ""}`}
							key={option}
							type="button"
						>
							{option}
						</button>
					))}
				</div>
				<span className="ds-command-owners__threshold-help">
					of {ownerCount} owners must sign
				</span>
				<Button variant="outline">Update</Button>
			</div>

			<PanelShell
				actions={<Button>+ Add Owner</Button>}
				title={`Owners (${owners.length})`}
			>
				<div className="ds-command-owners__list">
					{owners.map((owner) => (
						<div className="ds-command-owners__row" key={owner.id}>
							<span className="ds-command-owners__avatar" aria-hidden>
								♛
							</span>
							<code className="ds-command-owners__address">
								{owner.address}
							</code>
							{owner.isCurrentSigner ? (
								<span className="ds-command-owners__tag">You</span>
							) : null}
							<button
								aria-label={`Remove owner ${owner.address}`}
								className="ds-command-owners__remove"
								type="button"
							>
								×
							</button>
						</div>
					))}
				</div>
			</PanelShell>
		</CommandCenterScreenShell>
	);
}

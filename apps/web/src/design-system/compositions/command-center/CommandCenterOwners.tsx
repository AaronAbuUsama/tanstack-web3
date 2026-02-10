import { useEffect, useState } from "react";
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
	onAddOwner?: (ownerAddress: string) => void | Promise<void>;
	onChangeThreshold?: (threshold: number) => void | Promise<void>;
	onRemoveOwner?: (ownerAddress: string) => void | Promise<void>;
	ownerActionBusy?: boolean;
	ownerActionError?: string | null;
	ownerCount: number;
	owners: CommandCenterOwner[];
	threshold: number;
}

export function CommandCenterOwners({
	address,
	chainLabel,
	embedded,
	navSections,
	onAddOwner,
	onChangeThreshold,
	onRemoveOwner,
	ownerActionBusy = false,
	ownerActionError,
	ownerCount,
	owners,
	safeAddress,
	safeBalanceLabel,
	statusBalanceLabel,
	threshold,
	thresholdLabel,
}: CommandCenterOwnersProps) {
	const [pendingThreshold, setPendingThreshold] = useState(threshold);
	const thresholdOptions = Array.from(
		{ length: ownerCount },
		(_, index) => index + 1,
	);
	const canUpdateThreshold =
		typeof onChangeThreshold === "function" &&
		pendingThreshold !== threshold &&
		!ownerActionBusy;

	useEffect(() => {
		setPendingThreshold(threshold);
	}, [threshold]);

	const handleAddOwner = async () => {
		if (!onAddOwner || ownerActionBusy) return;
		const promptedAddress = window.prompt("Enter owner address");
		const nextOwnerAddress = promptedAddress?.trim();
		if (!nextOwnerAddress) return;
		await onAddOwner(nextOwnerAddress);
	};

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
			{ownerActionError ? (
				<div className="ds-command-notice is-error">{ownerActionError}</div>
			) : null}
			{ownerActionBusy ? (
				<div className="ds-command-notice is-info">
					Processing owner operation...
				</div>
			) : null}

			<div className="ds-command-owners__threshold">
				<span className="ds-command-owners__threshold-label">Threshold</span>
				<div className="ds-command-owners__threshold-options">
					{thresholdOptions.map((option) => (
						<button
							className={`ds-command-owners__threshold-option ${option === pendingThreshold ? "is-selected" : ""}`}
							key={option}
							onClick={() => setPendingThreshold(option)}
							type="button"
						>
							{option}
						</button>
					))}
				</div>
				<span className="ds-command-owners__threshold-help">
					of {ownerCount} owners must sign
				</span>
				<Button
					disabled={!canUpdateThreshold}
					onClick={() => {
						if (!onChangeThreshold) return;
						void onChangeThreshold(pendingThreshold);
					}}
					variant="outline"
				>
					Update
				</Button>
			</div>

			<PanelShell
				actions={
					<Button
						disabled={!onAddOwner || ownerActionBusy}
						onClick={() => {
							void handleAddOwner();
						}}
					>
						+ Add Owner
					</Button>
				}
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
								disabled={!onRemoveOwner || ownerActionBusy || owners.length <= 1}
								onClick={() => {
									if (!onRemoveOwner) return;
									void onRemoveOwner(owner.address);
								}}
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

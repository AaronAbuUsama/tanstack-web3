import { useEffect, useState } from "react";
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
	active?: boolean;
	deployedGuardAddress?: string | null;
	errorMessage?: string | null;
	guardAddress: string;
	guardName: string;
	isBusy?: boolean;
	limitSummary: GuardLimitSummary;
	onDeployGuard?: () => void | Promise<void>;
	onDisableGuard?: () => void | Promise<void>;
	onEnableGuard?: () => void | Promise<void>;
	onUpdateLimit?: (nextValue: string) => void | Promise<void>;
	onSpendingLimitChange?: (nextValue: string) => void;
	spendingLimitValue?: string;
}

export function CommandCenterGuard({
	active = true,
	address,
	chainLabel,
	deployedGuardAddress,
	embedded,
	errorMessage,
	guardAddress,
	guardName,
	isBusy = false,
	limitSummary,
	navSections,
	onDisconnect,
	onDeployGuard,
	onDisableGuard,
	onEnableGuard,
	onUpdateLimit,
	onSpendingLimitChange,
	safeAddress,
	safeBalanceLabel,
	spendingLimitValue,
	statusBalanceLabel,
	thresholdLabel,
}: CommandCenterGuardProps) {
	const [limitInput, setLimitInput] = useState(spendingLimitValue ?? "");
	const deployReady = !active && Boolean(deployedGuardAddress);
	const primaryActionLabel = active
		? "Disable Guard"
		: deployReady
			? "Enable Guard"
			: "Deploy Guard";

	useEffect(() => {
		setLimitInput(spendingLimitValue ?? "");
	}, [spendingLimitValue]);

	const handlePrimaryAction = () => {
		if (active && onDisableGuard) {
			void onDisableGuard();
			return;
		}
		if (deployReady && onEnableGuard) {
			void onEnableGuard();
			return;
		}
		if (!deployReady && onDeployGuard) {
			void onDeployGuard();
		}
	};

	const handleLimitUpdate = () => {
		const nextValue = limitInput.trim();
		if (!nextValue || !active || !onUpdateLimit || isBusy) return;
		void onUpdateLimit(nextValue);
	};

	return (
		<CommandCenterScreenShell
			address={address}
			chainLabel={chainLabel}
			embedded={embedded}
			navSections={navSections}
			onDisconnect={onDisconnect}
			safeAddress={safeAddress}
			safeBalanceLabel={safeBalanceLabel}
			statusBalanceLabel={statusBalanceLabel}
			thresholdLabel={thresholdLabel}
			title="Spending Guard"
			titleIcon="⚠"
		>
			<GuardStatusBanner
				active={active}
				description={
					active
						? `Active • ${guardAddress} • blocks transactions exceeding the configured limit`
						: deployReady
							? `Deployed • ${deployedGuardAddress} • enable this guard to enforce limits`
							: "No guard enabled • deploy a spending limit guard to enforce limits"
				}
				title={guardName}
			/>

			{errorMessage ? (
				<div className="ds-command-notice is-error">{errorMessage}</div>
			) : null}
			{isBusy ? (
				<div className="ds-command-notice is-info">Processing guard operation...</div>
			) : null}

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
							label="New Limit (ETH)"
							onChange={(event) => {
								setLimitInput(event.target.value);
								onSpendingLimitChange?.(event.target.value);
							}}
							value={limitInput}
						/>
						<Button
							disabled={isBusy || !active || !onUpdateLimit || !limitInput.trim()}
							onClick={handleLimitUpdate}
						>
							Update Limit
						</Button>
						<Button
							disabled={
								isBusy ||
								(active
									? !onDisableGuard
									: deployReady
										? !onEnableGuard
										: !onDeployGuard)
							}
							onClick={handlePrimaryAction}
							variant={active ? "danger" : "primary"}
						>
							{primaryActionLabel}
						</Button>
						{!active ? (
							<p className="ds-command-copy is-muted">
								Enable an active guard before updating the spending limit.
							</p>
						) : null}
						{deployReady ? (
							<p className="ds-command-copy is-muted">
								Enable deployed guard at {deployedGuardAddress} to activate
								spending checks.
							</p>
						) : null}
						<p className="ds-command-copy is-muted">
							{active
								? "Disable guard to remove execution limit checks."
								: "Deploying a guard creates a contract that enforces per-transaction limits when enabled."}
						</p>
					</div>
				</PanelShell>
			</div>
		</CommandCenterScreenShell>
	);
}

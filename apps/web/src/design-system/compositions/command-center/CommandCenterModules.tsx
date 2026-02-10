import { useId, useState } from "react";
import { Button, Input } from "../../primitives";
import { PanelShell } from "../../shells";
import {
	CommandCenterScreenShell,
	type CommandCenterScreenShellProps,
} from "./CommandCenterScreenShell";
import "./command-center.css";

export interface ModuleDelegate {
	address: string;
	id: string;
	resetLabel: string;
	resetPeriod: string;
	usedLabel: string;
	utilizationPercent: number;
}

export interface CommandCenterModulesProps
	extends Omit<
		CommandCenterScreenShellProps,
		"children" | "title" | "titleIcon"
	> {
	delegates: ModuleDelegate[];
	errorMessage?: string | null;
	isBusy?: boolean;
	mode?: "active" | "inactive" | "deploy-ready";
	moduleAddress: string;
	moduleName: string;
	onPrimaryAction?: () => void | Promise<void>;
	primaryActionLabel?: string;
	statusDescription?: string;
}

export function CommandCenterModules({
	address,
	chainLabel,
	delegates,
	errorMessage,
	embedded,
	isBusy = false,
	mode = "active",
	moduleAddress,
	moduleName,
	navSections,
	onPrimaryAction,
	primaryActionLabel,
	safeAddress,
	safeBalanceLabel,
	statusDescription,
	statusBalanceLabel,
	thresholdLabel,
}: CommandCenterModulesProps) {
	const [delegateAddress, setDelegateAddress] = useState("");
	const [allowanceEth, setAllowanceEth] = useState("0.2");
	const [executeTo, setExecuteTo] = useState("");
	const [executeAmount, setExecuteAmount] = useState("0.05");
	const allowanceResetId = useId();
	const active = mode === "active";
	const resolvedPrimaryActionLabel =
		primaryActionLabel ??
		(active ? "Disable" : mode === "deploy-ready" ? "Enable Module" : "Deploy AllowanceModule");
	const resolvedStatusDescription =
		statusDescription ??
		(active
			? `Active • ${moduleAddress} • delegates can spend without multi-sig approval up to allowance limits.`
			: mode === "deploy-ready"
				? `Deployed • ${moduleAddress} • enable this module to allow delegated spending.`
				: "No module enabled • deploy AllowanceModule to configure delegated spending rules.");
	const primaryVariant = active ? "danger" : "primary";

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
			title="Allowance Module"
			titleIcon="⚙"
		>
			<section className="ds-command-modules__status-banner">
				<span aria-hidden className="ds-command-modules__status-icon">
					🔐
				</span>
				<div className="ds-command-modules__status-copy">
					<h3>{moduleName}</h3>
					<p>{resolvedStatusDescription}</p>
				</div>
				<div className="ds-command-modules__status-actions">
					<Button disabled={!active || isBusy} variant="outline">
						Add Delegate
					</Button>
					<Button
						disabled={isBusy || !onPrimaryAction}
						onClick={() => {
							if (!onPrimaryAction) return;
							void onPrimaryAction();
						}}
						variant={primaryVariant}
					>
						{resolvedPrimaryActionLabel}
					</Button>
				</div>
			</section>

			{errorMessage ? (
				<div className="ds-command-notice is-error">{errorMessage}</div>
			) : null}
			{isBusy ? (
				<div className="ds-command-notice is-info">
					Processing module operation...
				</div>
			) : null}

			<div className="ds-command-modules__grid">
				{delegates.map((delegate) => (
					<article
						className="ds-command-modules__delegate-card"
						key={delegate.id}
					>
						<div className="ds-command-modules__delegate-head">
							<span aria-hidden className="ds-command-modules__delegate-avatar">
								♛
							</span>
							<button
								aria-label={`Open actions for ${delegate.address}`}
								className="ds-command-modules__menu-btn"
								type="button"
							>
								...
							</button>
						</div>
						<code className="ds-command-modules__delegate-address">
							{delegate.address}
						</code>
						<div className="ds-command-modules__allowance">
							<span className="ds-command-modules__allowance-label">
								Allowance Used
							</span>
							<div className="ds-command-guard__progress-track">
								<div
									className="ds-command-modules__allowance-fill"
									style={{ width: `${delegate.utilizationPercent}%` }}
								/>
							</div>
							<div className="ds-command-modules__allowance-meta">
								<span>{delegate.usedLabel}</span>
								<span>{delegate.utilizationPercent}%</span>
							</div>
						</div>
						<div className="ds-command-modules__delegate-reset">
							<span>{delegate.resetLabel}</span>
							<span className="ds-command-modules__reset-badge">
								{delegate.resetPeriod}
							</span>
						</div>
					</article>
				))}

				<button
					className="ds-command-modules__add-delegate"
					disabled={!active || isBusy}
					type="button"
				>
					<span aria-hidden className="ds-command-modules__plus">
						+
					</span>
					Add Delegate
				</button>
			</div>

			<PanelShell title="Set Allowance">
				<div className="ds-command-form-grid">
					<Input
						label="Delegate Address"
						onChange={(event) => setDelegateAddress(event.target.value)}
						placeholder="0x..."
						value={delegateAddress}
					/>
					<Input
						label="Allowance (ETH)"
						onChange={(event) => setAllowanceEth(event.target.value)}
						placeholder="0.2"
						value={allowanceEth}
					/>
					<div className="ds-primitive-field">
						<label className="ds-primitive-label" htmlFor={allowanceResetId}>
							Reset Period
						</label>
						<select className="ds-command-select" id={allowanceResetId}>
							<option>Daily (24h)</option>
							<option>Weekly (7d)</option>
							<option>Monthly (30d)</option>
							<option>No reset</option>
						</select>
					</div>
					<div className="ds-command-form-grid__full ds-command-form-grid__actions">
						<Button disabled={!active || isBusy || !delegateAddress}>
							Set Allowance
						</Button>
					</div>
				</div>
			</PanelShell>

			<PanelShell tagLabel="delegate view" title="Execute as Delegate">
				<div className="ds-command-form-grid">
					<div className="ds-command-form-grid__full">
						<Input
							label="Send To"
							onChange={(event) => setExecuteTo(event.target.value)}
							placeholder="0x..."
							value={executeTo}
						/>
					</div>
					<Input
						label="Amount (ETH)"
						onChange={(event) => setExecuteAmount(event.target.value)}
						placeholder="0.05"
						value={executeAmount}
					/>
					<div className="ds-command-form-grid__full ds-command-form-grid__actions is-spread">
						<span className="ds-command-copy is-muted">
							Available: 0.08 ETH remaining
						</span>
						<Button
							disabled={!active || isBusy || !executeTo || !executeAmount}
							variant="success"
						>
							Execute Spend
						</Button>
					</div>
				</div>
			</PanelShell>
		</CommandCenterScreenShell>
	);
}

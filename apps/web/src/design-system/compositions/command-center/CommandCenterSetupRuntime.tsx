import { useId } from "react";
import { Badge, Button, Input } from "../../primitives";
import { PanelShell } from "../../shells";
import {
	CommandCenterScreenShell,
	type CommandCenterScreenShellProps,
} from "./CommandCenterScreenShell";
import "./command-center.css";

export interface RuntimePolicySummary {
	appContext: "standalone" | "safe-app-iframe";
	signerProvider: "dev-mnemonic-account" | "injected-eip1193" | "none";
	txSubmissionPath: "protocol-kit-direct" | "safe-apps-sdk" | "none";
}

export interface DevAccountOption {
	address: string;
	balanceLabel: string;
	id: string;
	index: number;
}

export interface CommandCenterSetupRuntimeProps
	extends Omit<
		CommandCenterScreenShellProps,
		"children" | "title" | "titleIcon"
	> {
	activeChainLabel: string;
	activeDevIndex: number;
	devAccounts: DevAccountOption[];
	policy: RuntimePolicySummary;
}

export function CommandCenterSetupRuntime({
	activeChainLabel,
	activeDevIndex,
	address,
	chainLabel,
	devAccounts,
	embedded,
	navSections,
	policy,
	safeAddress,
	safeBalanceLabel,
	statusBalanceLabel,
	thresholdLabel,
}: CommandCenterSetupRuntimeProps) {
	const chainSwitcherId = useId();

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
			title="Setup & Runtime Controls"
			titleIcon="⚙"
		>
			<div className="ds-command-setup__grid">
				<PanelShell title="Safe Setup">
					<div className="ds-command-form-stack">
						<Input label="Safe Name" placeholder="Treasury Safe" />
						<div className="ds-command-form-stack__inline">
							<Input defaultValue="0xf39F...2266" label="Owner 1" />
							<Input defaultValue="0x7099...79c8" label="Owner 2" />
							<Input defaultValue="0x3C44...93BC" label="Owner 3" />
						</div>
						<div className="ds-command-setup__threshold-row">
							<span className="ds-command-owners__threshold-label">
								Threshold
							</span>
							<span className="ds-command-setup__threshold-value">2 of 3</span>
							<Button variant="outline">Adjust</Button>
						</div>
						<div className="ds-command-form-stack__actions">
							<Button>Create Safe</Button>
							<Button variant="outline">Connect Existing</Button>
						</div>
					</div>
				</PanelShell>

				<PanelShell title="Runtime Policy">
					<div className="ds-command-setup__policy-list">
						<div className="ds-command-setup__policy-row">
							<span>App Context</span>
							<Badge>{policy.appContext}</Badge>
						</div>
						<div className="ds-command-setup__policy-row">
							<span>Signer Provider</span>
							<Badge>{policy.signerProvider}</Badge>
						</div>
						<div className="ds-command-setup__policy-row">
							<span>TX Submission Path</span>
							<Badge>{policy.txSubmissionPath}</Badge>
						</div>
					</div>
					<p className="ds-command-copy is-muted">
						This policy is derived from runtime context and not stored in local
						storage.
					</p>
				</PanelShell>
			</div>

			<div className="ds-command-setup__grid">
				<PanelShell tagLabel="dev wallet" title="Account Switcher">
					<div className="ds-command-setup__account-list">
						{devAccounts.map((account) => (
							<button
								className={`ds-command-setup__account-item ${account.index === activeDevIndex ? "is-active" : ""}`}
								key={account.id}
								type="button"
							>
								<span className="ds-command-setup__account-index">
									Account {account.index}
								</span>
								<code>{account.address}</code>
								<span>{account.balanceLabel}</span>
							</button>
						))}
					</div>
				</PanelShell>

				<PanelShell tagLabel="network" title="Chain Switcher">
					<div className="ds-command-form-stack">
						<div className="ds-primitive-field">
							<label className="ds-primitive-label" htmlFor={chainSwitcherId}>
								Active Chain
							</label>
							<select
								className="ds-command-select"
								defaultValue={activeChainLabel}
								id={chainSwitcherId}
							>
								<option>Chiado (Anvil Fork)</option>
								<option>Gnosis Mainnet</option>
								<option>Ethereum Sepolia</option>
							</select>
						</div>
						<div className="ds-command-setup__policy-row">
							<span>Pending Source</span>
							<Badge variant="inverse">transaction-service</Badge>
						</div>
						<div className="ds-command-setup__policy-row">
							<span>Fallback</span>
							<Badge variant="header">local coordination</Badge>
						</div>
					</div>
				</PanelShell>
			</div>
		</CommandCenterScreenShell>
	);
}

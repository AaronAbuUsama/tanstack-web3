import { useId } from "react";
import { PendingTxRow, type PendingTxRowProps } from "../../domains/safe";
import type { ActivityListItem } from "../../fixtures/command-center";
import { ActivityList } from "../../patterns";
import { Button, Input } from "../../primitives";
import { PanelShell } from "../../shells";
import {
	CommandCenterScreenShell,
	type CommandCenterScreenShellProps,
} from "./CommandCenterScreenShell";
import "./command-center.css";

export interface CommandCenterTransactionsProps
	extends Omit<
		CommandCenterScreenShellProps,
		"children" | "title" | "titleIcon"
	> {
	historyEntries: ActivityListItem[];
	pendingTransactions: PendingTxRowProps[];
}

export function CommandCenterTransactions({
	address,
	chainLabel,
	embedded,
	historyEntries,
	navSections,
	pendingTransactions,
	safeAddress,
	safeBalanceLabel,
	statusBalanceLabel,
	thresholdLabel,
}: CommandCenterTransactionsProps) {
	const operationSelectId = useId();
	const txDataId = useId();
	const pendingTag = `${pendingTransactions.length} pending`;

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
			title="Transactions"
			titleIcon="↔"
		>
			<div className="ds-command-tabs">
				<span className="ds-command-tab is-active">Build</span>
				<span className="ds-command-tab">
					Pending ({pendingTransactions.length})
				</span>
				<span className="ds-command-tab">History</span>
			</div>

			<PanelShell title="New Transaction">
				<div className="ds-command-form-grid">
					<div className="ds-command-form-grid__full">
						<Input label="Recipient Address" placeholder="0x..." />
					</div>
					<Input label="Value (ETH)" placeholder="0.00" />
					<div className="ds-primitive-field">
						<label className="ds-primitive-label" htmlFor={operationSelectId}>
							Operation
						</label>
						<select className="ds-command-select" id={operationSelectId}>
							<option>Call (0)</option>
							<option>DelegateCall (1)</option>
						</select>
					</div>
					<div className="ds-command-form-grid__full ds-primitive-field">
						<label className="ds-primitive-label" htmlFor={txDataId}>
							Data (hex, optional)
						</label>
						<textarea
							className="ds-command-textarea"
							id={txDataId}
							placeholder="0x..."
							rows={3}
						/>
					</div>
					<div className="ds-command-form-grid__full ds-command-form-grid__actions">
						<Button variant="outline">Clear</Button>
						<Button>Build Transaction</Button>
					</div>
				</div>
			</PanelShell>

			<PanelShell tagLabel={pendingTag} title="Pending Signatures">
				<div className="ds-command-transactions__pending-list">
					{pendingTransactions.map((transaction) => (
						<PendingTxRow key={transaction.idLabel} {...transaction} />
					))}
				</div>
			</PanelShell>

			<ActivityList entries={historyEntries} />
		</CommandCenterScreenShell>
	);
}

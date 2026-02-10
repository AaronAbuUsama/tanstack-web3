import { useId, useState, type FormEvent } from "react";
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
	modeHelpText?: string;
	modeLabel?: string;
	onBuildTransaction?: (tx: {
		data: string;
		operation: 0 | 1;
		to: string;
		value: string;
	}) => void | Promise<void>;
	pendingTransactions: PendingTxRowProps[];
	txBusy?: boolean;
	txError?: string | null;
}

export function CommandCenterTransactions({
	address,
	chainLabel,
	embedded,
	historyEntries,
	modeHelpText,
	modeLabel,
	navSections,
	onBuildTransaction,
	pendingTransactions,
	safeAddress,
	safeBalanceLabel,
	statusBalanceLabel,
	thresholdLabel,
	txBusy = false,
	txError,
}: CommandCenterTransactionsProps) {
	const [recipientAddress, setRecipientAddress] = useState("");
	const [valueEth, setValueEth] = useState("");
	const [operation, setOperation] = useState<"0" | "1">("0");
	const [txData, setTxData] = useState("");
	const operationSelectId = useId();
	const txDataId = useId();
	const pendingTag = `${pendingTransactions.length} pending`;
	const buildDisabled = !onBuildTransaction || !recipientAddress.trim() || txBusy;

	const handleClear = () => {
		setRecipientAddress("");
		setValueEth("");
		setTxData("");
		setOperation("0");
	};

	const handleBuild = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (buildDisabled || !onBuildTransaction) return;
		await onBuildTransaction({
			to: recipientAddress.trim(),
			value: valueEth || "0",
			data: txData || "0x",
			operation: operation === "1" ? 1 : 0,
		});
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

			{modeLabel && modeHelpText ? (
				<div className="ds-command-notice">
					<strong>{modeLabel}:</strong> {modeHelpText}
				</div>
			) : null}

			{txError ? <div className="ds-command-notice is-error">{txError}</div> : null}
			{txBusy ? (
				<div className="ds-command-notice is-info">Processing transaction...</div>
			) : null}

			<PanelShell title="New Transaction">
				<form className="ds-command-form-grid" onSubmit={handleBuild}>
					<div className="ds-command-form-grid__full">
						<Input
							label="Recipient Address"
							onChange={(event) => setRecipientAddress(event.target.value)}
							placeholder="0x..."
							value={recipientAddress}
						/>
					</div>
					<Input
						label="Value (ETH)"
						onChange={(event) => setValueEth(event.target.value)}
						placeholder="0.00"
						value={valueEth}
					/>
					<div className="ds-primitive-field">
						<label className="ds-primitive-label" htmlFor={operationSelectId}>
							Operation
						</label>
						<select
							className="ds-command-select"
							id={operationSelectId}
							onChange={(event) =>
								setOperation(event.target.value === "1" ? "1" : "0")
							}
							value={operation}
						>
							<option value="0">Call (0)</option>
							<option value="1">DelegateCall (1)</option>
						</select>
					</div>
					<div className="ds-command-form-grid__full ds-primitive-field">
						<label className="ds-primitive-label" htmlFor={txDataId}>
							Data (hex, optional)
						</label>
						<textarea
							className="ds-command-textarea"
							id={txDataId}
							onChange={(event) => setTxData(event.target.value)}
							placeholder="0x..."
							rows={3}
							value={txData}
						/>
					</div>
					<div className="ds-command-form-grid__full ds-command-form-grid__actions">
						<Button disabled={txBusy} onClick={handleClear} variant="outline">
							Clear
						</Button>
						<Button disabled={buildDisabled} type="submit">
							Build Transaction
						</Button>
					</div>
				</form>
			</PanelShell>

			<PanelShell tagLabel={pendingTag} title="Pending Signatures">
				{pendingTransactions.length > 0 ? (
					<div className="ds-command-transactions__pending-list">
						{pendingTransactions.map((transaction) => (
							<PendingTxRow key={transaction.idLabel} {...transaction} />
						))}
					</div>
				) : (
					<p className="ds-command-copy is-muted">No pending transactions</p>
				)}
			</PanelShell>

			<ActivityList entries={historyEntries} />
		</CommandCenterScreenShell>
	);
}

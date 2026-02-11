import { formatUnits } from "viem";
import type { PendingTxRowProps } from "../../../design-system/domains/safe";
import type { ActivityListItem } from "../../../design-system/fixtures/command-center";
import type { ExecutedTx, PendingTx } from "../../transactions/use-transactions";

function shortenAddress(address: string) {
	if (address.length <= 10) return address;
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatEthValue(value?: string) {
	if (!value) return "0";
	if (!/^\d+$/.test(value)) return value;
	try {
		return formatUnits(BigInt(value), 18);
	} catch {
		return value;
	}
}

function txIdLabel(safeTxHash: string) {
	const trimmed = safeTxHash.startsWith("0x") ? safeTxHash.slice(2) : safeTxHash;
	return `#${trimmed.slice(0, 4)}`;
}

export interface MapTransactionsScreenInput {
	executedTxs: ExecutedTx[];
	onConfirm?: (safeTxHash: string) => void;
	onExecute?: (safeTxHash: string) => void;
	pendingTxs: PendingTx[];
}

export interface MapTransactionsScreenOutput {
	historyEntries: ActivityListItem[];
	pendingTransactions: PendingTxRowProps[];
}

export function mapTransactionsScreen({
	executedTxs,
	onConfirm,
	onExecute,
	pendingTxs,
}: MapTransactionsScreenInput): MapTransactionsScreenOutput {
	const pendingTransactions = pendingTxs.map((tx) => ({
		confirmations: tx.confirmations,
		idLabel: txIdLabel(tx.safeTxHash),
		onAction: tx.isReady
			? onExecute
				? () => onExecute(tx.safeTxHash)
				: undefined
			: onConfirm
				? () => onConfirm(tx.safeTxHash)
				: undefined,
		state: tx.isReady ? ("ready" as const) : ("pending" as const),
		threshold: tx.threshold,
		toLabel: shortenAddress(tx.to),
		valueLabel: `${formatEthValue(tx.value)} ETH`,
	}));

	const historyEntries: ActivityListItem[] = [
		...pendingTxs.slice(0, 3).map((tx) => ({
			amountLabel: `${formatEthValue(tx.value)} ETH`,
			direction: "outgoing" as const,
			id: tx.safeTxHash,
			meta: `${shortenAddress(tx.to)} • ${tx.confirmations}/${tx.threshold} confirmed`,
			title: tx.isReady ? "Ready for execution" : "Pending owner signatures",
		})),
		...executedTxs.slice(0, 3).map((tx) => ({
			amountLabel: `${formatEthValue(tx.value)} ETH`,
			direction: "config" as const,
			id: `executed-${tx.safeTxHash}`,
			meta: shortenAddress(tx.to),
			title: "Transaction executed",
		})),
	];

	return {
		historyEntries,
		pendingTransactions,
	};
}

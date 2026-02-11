import { formatUnits } from "viem";
import type { PendingTxRowProps } from "../../../design-system/domains/safe";
import type { ActivityListItem } from "../../../design-system/fixtures/command-center";
import type {
	ExecutedTx,
	PendingTx,
} from "../../transactions/use-transactions";

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
	const trimmed = safeTxHash.startsWith("0x")
		? safeTxHash.slice(2)
		: safeTxHash;
	return `#${trimmed.slice(0, 4)}`;
}

function pendingTitle(tx: PendingTx) {
	if (tx.intent === "governance:change-threshold") {
		return tx.isReady ? "Threshold update ready" : "Threshold update proposed";
	}
	if (tx.intent === "governance:add-owner") {
		return tx.isReady ? "Add owner ready" : "Add owner proposed";
	}
	if (tx.intent === "governance:remove-owner") {
		return tx.isReady ? "Remove owner ready" : "Remove owner proposed";
	}
	return tx.isReady ? "Ready for execution" : "Pending owner signatures";
}

function executedTitle(tx: ExecutedTx) {
	if (tx.intent === "governance:change-threshold") {
		return "Threshold updated";
	}
	if (tx.intent === "governance:add-owner") {
		return "Owner added";
	}
	if (tx.intent === "governance:remove-owner") {
		return "Owner removed";
	}
	return "Transaction executed";
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
			title: pendingTitle(tx),
		})),
		...executedTxs.slice(0, 3).map((tx) => ({
			amountLabel: `${formatEthValue(tx.value)} ETH`,
			direction: "config" as const,
			id: `executed-${tx.safeTxHash}`,
			meta: shortenAddress(tx.to),
			title: executedTitle(tx),
		})),
	];

	return {
		historyEntries,
		pendingTransactions,
	};
}

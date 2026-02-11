import { useEffect, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import {
	confirmTransaction,
	getPendingTransactions,
	getTransaction,
	isTxServiceSupportedChain,
	proposeTransaction,
} from "../core/api";
import { sendTransactions as sendIframeTxs } from "../core/iframe";
import {
	createTransaction,
	executeTransaction,
	signTransaction,
} from "../core/standalone";
import type {
	SafeInstance,
	SafeTransaction,
	TxSourceMode,
} from "../core/types";
import type { SafeMode } from "../core/detect";
import type { SafeMultisigTransactionResponse } from "@safe-global/types-kit";
import {
	buildTransaction,
	buildTransactionStatus,
	hasSignerConfirmed,
} from "./transactions";

const TRANSACTION_INTENTS = [
	"transfer",
	"governance:add-owner",
	"governance:remove-owner",
	"governance:change-threshold",
] as const;

export type TransactionIntent = (typeof TRANSACTION_INTENTS)[number];

const TRANSACTION_INTENT_SET = new Set<string>(TRANSACTION_INTENTS);

interface ProposeSafeTransactionParams {
	safeTransaction: SafeTransaction;
	intent?: TransactionIntent;
	origin?: string;
}

interface ProposeSafeTransactionResult {
	executed: boolean;
	safeTxHash: string;
}

export interface PendingTx {
	safeTxHash: string;
	to: string;
	value: string;
	data: string;
	confirmations: number;
	confirmedBy: string[];
	threshold: number;
	isReady: boolean;
	source: TxSourceMode;
	intent: TransactionIntent;
	submittedAt?: string;
}

export interface ExecutedTx {
	safeTxHash: string;
	to: string;
	value: string;
	transactionHash: string;
	source: TxSourceMode;
	intent: TransactionIntent;
}

interface LocalTx {
	safeTxHash: string;
	to: string;
	value: string;
	data: string;
	nonce: number;
	safeTxGas: string;
	baseGas: string;
	gasPrice: string;
	gasToken: string;
	refundReceiver: string;
	confirmedBy: string[];
	status: "pending" | "executed";
	intent: TransactionIntent;
	txHash?: string;
	submittedAt: string;
}

interface PersistedTx {
	safeTxHash?: string;
	id?: string;
	to?: string;
	value?: string;
	data?: string;
	nonce?: number;
	safeTxGas?: string;
	baseGas?: string;
	gasPrice?: string;
	gasToken?: string;
	refundReceiver?: string;
	confirmedBy?: string[];
	confirmations?: number;
	status?: "pending" | "signed" | "executed";
	intent?: string;
	txHash?: string;
	submittedAt?: string;
}

interface UseTransactionsParams {
	safeAddress: string | null;
	safeInstance: SafeInstance | null;
	threshold: number;
	mode: SafeMode;
	chainId: number | null;
	rpcUrl: string;
	currentAddress?: string;
}

const POLL_INTERVAL_MS = 12_000;

function getTxStorageKey(safeAddress: string) {
	return `safe-txs-${safeAddress}`;
}

function normalizeAddress(address: string) {
	return address.toLowerCase();
}

function normalizeAddressList(addresses: string[]) {
	return Array.from(new Set(addresses.map(normalizeAddress)));
}

function isLocalRpcUrl(rpcUrl: string) {
	return /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(rpcUrl);
}

function transactionOriginForIntent(intent: TransactionIntent) {
	return `intent:${intent}`;
}

function parseTransactionIntent(value?: string | null): TransactionIntent {
	if (!value) return "transfer";
	return TRANSACTION_INTENT_SET.has(value)
		? (value as TransactionIntent)
		: "transfer";
}

function parseIntentFromOrigin(origin?: string | null): TransactionIntent {
	if (!origin || !origin.startsWith("intent:")) return "transfer";
	return parseTransactionIntent(origin.slice("intent:".length));
}

function readLegacyConfirmations(tx: PersistedTx) {
	if (!Array.isArray(tx.confirmedBy) || tx.confirmedBy.length === 0) {
		const confirmations =
			typeof tx.confirmations === "number" ? tx.confirmations : 0;
		return Array.from(
			{ length: confirmations },
			(_, index) => `legacy-${index}`,
		);
	}
	return tx.confirmedBy;
}

function parsePersistedTx(tx: PersistedTx): LocalTx | null {
	const safeTxHash = tx.safeTxHash ?? tx.id;
	if (!safeTxHash || !tx.to || !tx.value || !tx.data) return null;

	return {
		safeTxHash,
		to: tx.to,
		value: tx.value,
		data: tx.data,
		nonce: tx.nonce ?? 0,
		safeTxGas: tx.safeTxGas ?? "0",
		baseGas: tx.baseGas ?? "0",
		gasPrice: tx.gasPrice ?? "0",
		gasToken: tx.gasToken ?? "0x0000000000000000000000000000000000000000",
		refundReceiver:
			tx.refundReceiver ?? "0x0000000000000000000000000000000000000000",
		confirmedBy: normalizeAddressList(readLegacyConfirmations(tx)),
		status: tx.status === "executed" ? "executed" : "pending",
		intent: parseTransactionIntent(tx.intent),
		txHash: tx.txHash,
		submittedAt: tx.submittedAt ?? new Date().toISOString(),
	};
}

function loadPersistedTxs(safeAddress: string): LocalTx[] {
	try {
		const raw = localStorage.getItem(getTxStorageKey(safeAddress));
		if (!raw) return [];

		const parsed = JSON.parse(raw) as PersistedTx[];
		if (!Array.isArray(parsed)) return [];

		return parsed
			.map(parsePersistedTx)
			.filter((tx): tx is LocalTx => tx !== null);
	} catch {
		return [];
	}
}

function persistTxs(safeAddress: string, txs: LocalTx[]) {
	try {
		localStorage.setItem(getTxStorageKey(safeAddress), JSON.stringify(txs));
	} catch {
		// localStorage may be full or unavailable
	}
}

function formatWeiAsEth(value: string) {
	try {
		return formatEther(BigInt(value));
	} catch {
		return value;
	}
}

function toFriendlyError(err: unknown, fallback: string) {
	return err instanceof Error ? err.message : fallback;
}

function mapServicePendingTx(tx: SafeMultisigTransactionResponse): PendingTx {
	const confirmedBy = normalizeAddressList(
		(tx.confirmations ?? []).map((confirmation) => confirmation.owner),
	);
	const status = buildTransactionStatus({
		safeTxHash: tx.safeTxHash,
		confirmations: tx.confirmations?.length ?? 0,
		confirmedBy,
		threshold: tx.confirmationsRequired,
		isExecuted: tx.isExecuted,
		source: "transaction-service",
	});

	return {
		safeTxHash: tx.safeTxHash,
		to: tx.to,
		value: formatWeiAsEth(tx.value),
		data: tx.data ?? "0x",
		confirmations: status.confirmations,
		confirmedBy: status.confirmedBy,
		threshold: status.threshold,
		isReady: status.isReady,
		source: "transaction-service",
		intent: parseIntentFromOrigin(tx.origin),
		submittedAt: tx.submissionDate,
	};
}

function mapLocalPendingTx(tx: LocalTx, threshold: number): PendingTx {
	const status = buildTransactionStatus({
		safeTxHash: tx.safeTxHash,
		confirmations: tx.confirmedBy.length,
		confirmedBy: tx.confirmedBy,
		threshold,
		isExecuted: tx.status === "executed",
		source: "local",
	});

	return {
		safeTxHash: tx.safeTxHash,
		to: tx.to,
		value: tx.value,
		data: tx.data,
		confirmations: status.confirmations,
		confirmedBy: status.confirmedBy,
		threshold: status.threshold,
		isReady: status.isReady,
		source: "local",
		intent: tx.intent,
		submittedAt: tx.submittedAt,
	};
}

export function useTransactions({
	safeAddress,
	safeInstance,
	threshold,
	mode,
	chainId,
	rpcUrl,
	currentAddress,
}: UseTransactionsParams) {
	const [localTransactions, setLocalTransactions] = useState<LocalTx[]>([]);
	const [servicePendingTransactions, setServicePendingTransactions] = useState<
		SafeMultisigTransactionResponse[]
	>([]);
	const [serviceExecutedTransactions, setServiceExecutedTransactions] =
		useState<ExecutedTx[]>([]);
	const [txError, setTxError] = useState<string | null>(null);
	const [txBusy, setTxBusy] = useState(false);

	const normalizedCurrentAddress = currentAddress
		? normalizeAddress(currentAddress)
		: undefined;

	const txSourceMode: TxSourceMode = useMemo(() => {
		if (mode !== "standalone") return "local";
		if (chainId === null) return "local";
		if (!isTxServiceSupportedChain(chainId)) return "local";
		if (isLocalRpcUrl(rpcUrl)) return "local";
		return "transaction-service";
	}, [mode, chainId, rpcUrl]);

	const txModeLabel =
		txSourceMode === "transaction-service"
			? "Transaction Service"
			: "Local-only";
	const txModeHelpText =
		txSourceMode === "transaction-service"
			? "Shared pending queue is powered by hosted Safe Transaction Service."
			: "Pending queue is stored in local browser storage for this RPC/session.";

	useEffect(() => {
		if (!safeAddress || txSourceMode !== "local") {
			setLocalTransactions([]);
			return;
		}
		setLocalTransactions(loadPersistedTxs(safeAddress));
	}, [safeAddress, txSourceMode]);

	useEffect(() => {
		if (!safeAddress || txSourceMode !== "local") return;

		const onStorage = (event: StorageEvent) => {
			if (event.key !== getTxStorageKey(safeAddress)) return;
			setLocalTransactions(loadPersistedTxs(safeAddress));
		};

		window.addEventListener("storage", onStorage);
		return () => {
			window.removeEventListener("storage", onStorage);
		};
	}, [safeAddress, txSourceMode]);

	useEffect(() => {
		if (
			txSourceMode !== "local" ||
			mode !== "standalone" ||
			!safeInstance ||
			localTransactions.length === 0
		)
			return;

		const pendingHashes = localTransactions
			.filter((tx) => tx.status !== "executed")
			.map((tx) => tx.safeTxHash);

		if (pendingHashes.length === 0) return;

		let cancelled = false;

		const syncConfirmations = async () => {
			try {
				const ownersByHash = await Promise.all(
					pendingHashes.map(async (safeTxHash) => ({
						safeTxHash,
						owners: normalizeAddressList(
							await safeInstance.getOwnersWhoApprovedTx(safeTxHash),
						),
					})),
				);
				if (cancelled) return;

				setLocalTransactions((prev) => {
					let didChange = false;
					const next = prev.map((tx) => {
						if (tx.status === "executed") return tx;
						const fromChain = ownersByHash.find(
							(entry) => entry.safeTxHash === tx.safeTxHash,
						);
						if (!fromChain) return tx;

						const current = tx.confirmedBy.join(",");
						const incoming = fromChain.owners.join(",");
						if (current === incoming) return tx;

						didChange = true;
						return {
							...tx,
							confirmedBy: fromChain.owners,
						};
					});

					if (!didChange) return prev;
					if (safeAddress) persistTxs(safeAddress, next);
					return next;
				});
			} catch {
				// Keep local fallback resilient even if a chain sync check fails.
			}
		};

		void syncConfirmations();
		const intervalId = window.setInterval(() => {
			void syncConfirmations();
		}, POLL_INTERVAL_MS);

		return () => {
			cancelled = true;
			window.clearInterval(intervalId);
		};
	}, [txSourceMode, mode, safeInstance, localTransactions, safeAddress]);

	useEffect(() => {
		if (
			txSourceMode !== "transaction-service" ||
			!safeAddress ||
			chainId === null
		) {
			setServicePendingTransactions([]);
			return;
		}

		let cancelled = false;

		const refresh = async () => {
			try {
				const pending = await getPendingTransactions({ chainId, safeAddress });
				if (cancelled) return;
				setServicePendingTransactions(pending.filter((tx) => !tx.isExecuted));
			} catch (err) {
				if (cancelled) return;
				setTxError(
					toFriendlyError(
						err,
						"Failed to load pending transactions from transaction service",
					),
				);
			}
		};

		void refresh();
		const intervalId = window.setInterval(() => {
			void refresh();
		}, POLL_INTERVAL_MS);

		return () => {
			cancelled = true;
			window.clearInterval(intervalId);
		};
	}, [txSourceMode, safeAddress, chainId]);

	const updateLocalTransactions = (updater: (prev: LocalTx[]) => LocalTx[]) => {
		setLocalTransactions((prev) => {
			const next = updater(prev);
			if (safeAddress) persistTxs(safeAddress, next);
			return next;
		});
	};

	const refreshServicePendingTransactions = async () => {
		if (
			txSourceMode !== "transaction-service" ||
			!safeAddress ||
			chainId === null
		)
			return;
		const pending = await getPendingTransactions({ chainId, safeAddress });
		setServicePendingTransactions(pending.filter((tx) => !tx.isExecuted));
	};

	const buildLocalSafeTransaction = async (tx: LocalTx) => {
		if (!safeInstance) throw new Error("No Safe instance available.");

		const txData = buildTransaction({
			to: tx.to as `0x${string}`,
			value: tx.value !== "0" ? tx.value : undefined,
			data: tx.data !== "0x" ? (tx.data as `0x${string}`) : undefined,
		});

		return createTransaction(safeInstance, [txData], {
			nonce: tx.nonce,
			safeTxGas: tx.safeTxGas,
			baseGas: tx.baseGas,
			gasPrice: tx.gasPrice,
			gasToken: tx.gasToken,
			refundReceiver: tx.refundReceiver,
		});
	};

	const handleProposeSafeTransaction = async ({
		safeTransaction,
		intent = "transfer",
		origin,
	}: ProposeSafeTransactionParams): Promise<ProposeSafeTransactionResult> => {
		if (!safeInstance) {
			throw new Error("No Safe instance available. Connect to a Safe first.");
		}

		if (txSourceMode === "transaction-service") {
			if (!safeAddress || chainId === null || !normalizedCurrentAddress) {
				throw new Error(
					"Transaction Service mode requires a connected signer address and chain.",
				);
			}

			const safeTxHash = await safeInstance.getTransactionHash(safeTransaction);
			const signedTx = await signTransaction(safeInstance, safeTransaction);
			const senderSignature = Array.from(signedTx.signatures.values())[0]?.data;
			if (!senderSignature) {
				throw new Error(
					"Could not derive signer signature for transaction proposal.",
				);
			}

			await proposeTransaction({
				chainId,
				safeAddress,
				safeTransactionData: signedTx.data,
				safeTxHash,
				senderAddress: normalizedCurrentAddress,
				senderSignature,
				origin: origin ?? transactionOriginForIntent(intent),
			});

			await refreshServicePendingTransactions();
			return { safeTxHash, executed: false };
		}

		const safeTxHash = await safeInstance.getTransactionHash(safeTransaction);
		const localTx: LocalTx = {
			safeTxHash,
			to: safeTransaction.data.to,
			value: formatWeiAsEth(safeTransaction.data.value),
			data: safeTransaction.data.data ?? "0x",
			nonce: safeTransaction.data.nonce,
			safeTxGas: safeTransaction.data.safeTxGas,
			baseGas: safeTransaction.data.baseGas,
			gasPrice: safeTransaction.data.gasPrice,
			gasToken: safeTransaction.data.gasToken,
			refundReceiver: safeTransaction.data.refundReceiver,
			confirmedBy: [],
			status: "pending",
			intent,
			submittedAt: new Date().toISOString(),
		};

		if (threshold === 1) {
			const signed = await signTransaction(safeInstance, safeTransaction);
			const result = await executeTransaction(safeInstance, signed);
			localTx.confirmedBy = normalizedCurrentAddress
				? [normalizedCurrentAddress]
				: [];
			localTx.status = "executed";
			localTx.txHash = result.hash;
			updateLocalTransactions((prev) => [localTx, ...prev]);
			return { safeTxHash, executed: true };
		}

		updateLocalTransactions((prev) => [localTx, ...prev]);
		return { safeTxHash, executed: false };
	};

	const handleBuild = async (tx: {
		to: string;
		value: string;
		data: string;
	}) => {
		setTxError(null);
		setTxBusy(true);

		if (mode === "iframe") {
			try {
				const safeTxHash = await sendIframeTxs([
					{
						to: tx.to,
						value: parseEther(tx.value || "0").toString(),
						data: tx.data || "0x",
					},
				]);
				const localTx: LocalTx = {
					safeTxHash,
					to: tx.to,
					value: tx.value || "0",
					data: tx.data || "0x",
					nonce: 0,
					safeTxGas: "0",
					baseGas: "0",
					gasPrice: "0",
					gasToken: "0x0000000000000000000000000000000000000000",
					refundReceiver: "0x0000000000000000000000000000000000000000",
					confirmedBy: [],
					status: "pending",
					intent: "transfer",
					txHash: safeTxHash,
					submittedAt: new Date().toISOString(),
				};
				updateLocalTransactions((prev) => [localTx, ...prev]);
			} catch (err) {
				setTxError(toFriendlyError(err, "Failed to send iframe transaction"));
			} finally {
				setTxBusy(false);
			}
			return;
		}

		if (!safeInstance) {
			setTxError("No Safe instance available. Connect to a Safe first.");
			setTxBusy(false);
			return;
		}

		try {
			const txData = buildTransaction({
				to: tx.to as `0x${string}`,
				value: tx.value !== "0" ? tx.value : undefined,
				data: tx.data !== "0x" ? (tx.data as `0x${string}`) : undefined,
			});

			const safeTx = await createTransaction(safeInstance, [txData]);
			await handleProposeSafeTransaction({
				safeTransaction: safeTx,
				intent: "transfer",
			});
		} catch (err) {
			setTxError(toFriendlyError(err, "Failed to build transaction"));
		} finally {
			setTxBusy(false);
		}
	};

	const handleConfirm = async (safeTxHash: string) => {
		setTxError(null);
		setTxBusy(true);

		if (!safeInstance) {
			setTxError("No Safe instance available");
			setTxBusy(false);
			return;
		}

		try {
			if (txSourceMode === "transaction-service") {
				if (chainId === null || !normalizedCurrentAddress) {
					throw new Error(
						"Transaction Service mode requires a connected signer address and chain.",
					);
				}

				const tx = servicePendingTransactions.find(
					(pending) => pending.safeTxHash === safeTxHash,
				);
				if (!tx) return;

				const pending = mapServicePendingTx(tx);
				if (
					hasSignerConfirmed(
						{
							safeTxHash: pending.safeTxHash,
							confirmations: pending.confirmations,
							confirmedBy: pending.confirmedBy,
							threshold: pending.threshold,
							isReady: pending.isReady,
							isExecuted: false,
							source: pending.source,
						},
						normalizedCurrentAddress,
					)
				) {
					throw new Error("Transaction already confirmed by current signer");
				}

				const serviceTx = await getTransaction({ chainId, safeTxHash });
				const signed = await signTransaction(safeInstance, serviceTx);
				const signerSignature =
					signed.getSignature(normalizedCurrentAddress)?.data ??
					Array.from(signed.signatures.values()).find(
						(signature) =>
							normalizeAddress(signature.signer) === normalizedCurrentAddress,
					)?.data;

				if (!signerSignature) {
					throw new Error(
						"Could not extract signer signature for confirmation.",
					);
				}

				await confirmTransaction({
					chainId,
					safeTxHash,
					signature: signerSignature,
				});
				await refreshServicePendingTransactions();
			} else {
				if (!normalizedCurrentAddress) {
					throw new Error(
						"No signer address available to confirm transaction.",
					);
				}

				const tx = localTransactions.find(
					(pending) => pending.safeTxHash === safeTxHash,
				);
				if (!tx) return;
				if (tx.status === "executed") {
					throw new Error("Transaction is already executed");
				}
				if (tx.confirmedBy.includes(normalizedCurrentAddress)) {
					throw new Error("Transaction already confirmed by current signer");
				}

				const safeTx = await buildLocalSafeTransaction(tx);
				const recomputedHash = await safeInstance.getTransactionHash(safeTx);
				if (recomputedHash !== tx.safeTxHash) {
					throw new Error(
						"Stored transaction payload does not match current transaction hash.",
					);
				}

				await safeInstance.approveTransactionHash(tx.safeTxHash);
				const ownersWhoApproved = await safeInstance.getOwnersWhoApprovedTx(
					tx.safeTxHash,
				);
				const confirmedBy = normalizeAddressList(ownersWhoApproved);

				updateLocalTransactions((prev) =>
					prev.map((pending) =>
						pending.safeTxHash === safeTxHash
							? {
									...pending,
									confirmedBy,
								}
							: pending,
					),
				);
			}
		} catch (err) {
			setTxError(toFriendlyError(err, "Failed to confirm transaction"));
		} finally {
			setTxBusy(false);
		}
	};

	const handleExecute = async (safeTxHash: string) => {
		setTxError(null);
		setTxBusy(true);

		if (!safeInstance) {
			setTxError("No Safe instance available");
			setTxBusy(false);
			return;
		}

		try {
			if (txSourceMode === "transaction-service") {
				if (chainId === null) {
					throw new Error(
						"Transaction Service mode requires a resolved chain id.",
					);
				}

				const serviceTx = await getTransaction({ chainId, safeTxHash });
				const confirmations = serviceTx.confirmations?.length ?? 0;
				if (confirmations < serviceTx.confirmationsRequired) {
					throw new Error(
						`Not enough confirmations: ${confirmations}/${serviceTx.confirmationsRequired}`,
					);
				}

				const result = await executeTransaction(safeInstance, serviceTx);
				await refreshServicePendingTransactions();
				setServiceExecutedTransactions((prev) => [
					{
						safeTxHash,
						to: serviceTx.to,
						value: formatWeiAsEth(serviceTx.value),
						transactionHash: result.hash,
						source: "transaction-service",
						intent: parseIntentFromOrigin(serviceTx.origin),
					},
					...prev.filter((tx) => tx.safeTxHash !== safeTxHash),
				]);
			} else {
				const tx = localTransactions.find(
					(pending) => pending.safeTxHash === safeTxHash,
				);
				if (!tx) return;
				if (tx.confirmedBy.length < threshold) {
					throw new Error(
						`Not enough confirmations: ${tx.confirmedBy.length}/${threshold}`,
					);
				}

				const safeTx = await buildLocalSafeTransaction(tx);
				const signed = await signTransaction(safeInstance, safeTx);
				const result = await executeTransaction(safeInstance, signed);

				updateLocalTransactions((prev) =>
					prev.map((pending) =>
						pending.safeTxHash === safeTxHash
							? { ...pending, status: "executed", txHash: result.hash }
							: pending,
					),
				);
			}
		} catch (err) {
			setTxError(toFriendlyError(err, "Failed to execute transaction"));
		} finally {
			setTxBusy(false);
		}
	};

	const pendingTxs = useMemo(() => {
		if (txSourceMode === "transaction-service") {
			return servicePendingTransactions.map(mapServicePendingTx);
		}

		return localTransactions
			.filter((tx) => tx.status !== "executed")
			.map((tx) => mapLocalPendingTx(tx, threshold));
	}, [txSourceMode, servicePendingTransactions, localTransactions, threshold]);

	const executedTxs = useMemo(() => {
		if (txSourceMode === "transaction-service") {
			return serviceExecutedTransactions;
		}

		return localTransactions
			.filter((tx) => tx.status === "executed")
			.map((tx) => ({
				safeTxHash: tx.safeTxHash,
				to: tx.to,
				value: tx.value,
				transactionHash: tx.txHash ?? "",
				source: "local" as const,
				intent: tx.intent,
			}));
	}, [txSourceMode, serviceExecutedTransactions, localTransactions]);

	return {
		pendingTxs,
		executedTxs,
		txError,
		txBusy,
		txSourceMode,
		txModeLabel,
		txModeHelpText,
		handleBuild,
		handleProposeSafeTransaction,
		handleConfirm,
		handleExecute,
	};
}

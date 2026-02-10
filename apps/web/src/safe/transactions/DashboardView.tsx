import { useState } from "react";
import { formatUnits } from "viem";
import { CommandCenterOverview } from "../../design-system/compositions/command-center";
import {
	commandCenterActivity,
	commandCenterSidebarSections,
	commandCenterStats,
} from "../../design-system/fixtures/command-center";
import AddressDisplay from "../../web3/AddressDisplay";
import ChainBadge from "../../web3/ChainBadge";
import { getDevWalletActiveSigner } from "../../web3/dev-wallet";
import TokenBalances from "../../web3/TokenBalances";
import {
	createAddOwnerTx,
	createChangeThresholdTx,
	createRemoveOwnerTx,
	executeTransaction,
	signTransaction,
} from "../core/standalone";
import type { useSafe } from "../core/use-safe";
import Owners from "../governance/Owners";
import SafeOverview from "../governance/SafeOverview";
import Threshold from "../governance/Threshold";
import GuardPanel from "../guard/GuardPanel";
import ModulePanel from "../module/ModulePanel";
import FundSafe from "./FundSafe";
import TransactionFlow from "./TransactionFlow";
import TxBuilder from "./TxBuilder";
import TxHistory from "./TxHistory";
import TxQueue from "./TxQueue";
import { useTransactions } from "./use-transactions";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function shortenAddress(address?: string) {
	if (!address) return "n/a";
	if (address.length <= 10) return address;
	return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatEthMaybeWei(value?: string) {
	if (!value) return "0";
	if (!/^\d+$/.test(value)) return value;
	try {
		return formatUnits(BigInt(value), 18);
	} catch {
		return value;
	}
}

interface DashboardViewProps {
	address: string | undefined;
	chain: { name: string; id: number } | undefined;
	safe: ReturnType<typeof useSafe>;
	rpcUrl: string;
}

export default function DashboardView({
	address,
	chain,
	safe,
	rpcUrl,
}: DashboardViewProps) {
	const [operationLoading, setOperationLoading] = useState(false);
	const [operationError, setOperationError] = useState<string | null>(null);
	const resolveSigner = () => getDevWalletActiveSigner();

	const {
		pendingTxs,
		executedTxs,
		txError,
		txBusy,
		txSourceMode,
		txModeLabel,
		txModeHelpText,
		handleBuild,
		handleConfirm,
		handleExecute,
	} = useTransactions({
		safeAddress: safe.safeAddress,
		safeInstance: safe.safeInstance,
		threshold: safe.threshold,
		mode: safe.mode,
		chainId: safe.chainId,
		rpcUrl,
		currentAddress: address,
	});

	const handleAddOwner = async (ownerAddress: string) => {
		if (!safe.safeInstance || !safe.safeAddress) return;
		setOperationLoading(true);
		setOperationError(null);
		try {
			const tx = await createAddOwnerTx(safe.safeInstance, ownerAddress);
			const signed = await signTransaction(safe.safeInstance, tx);
			await executeTransaction(safe.safeInstance, signed);
			await safe.connectSafe(safe.safeAddress, rpcUrl, resolveSigner());
		} catch (err) {
			setOperationError(
				err instanceof Error ? err.message : "Failed to add owner",
			);
		} finally {
			setOperationLoading(false);
		}
	};

	const handleRemoveOwner = async (ownerAddress: string) => {
		if (!safe.safeInstance || !safe.safeAddress) return;
		setOperationLoading(true);
		setOperationError(null);
		try {
			const newThreshold = Math.min(safe.threshold, safe.owners.length - 1);
			const tx = await createRemoveOwnerTx(
				safe.safeInstance,
				ownerAddress,
				newThreshold,
			);
			const signed = await signTransaction(safe.safeInstance, tx);
			await executeTransaction(safe.safeInstance, signed);
			await safe.connectSafe(safe.safeAddress, rpcUrl, resolveSigner());
		} catch (err) {
			setOperationError(
				err instanceof Error ? err.message : "Failed to remove owner",
			);
		} finally {
			setOperationLoading(false);
		}
	};

	const handleChangeThreshold = async (newThreshold: number) => {
		if (!safe.safeInstance || !safe.safeAddress) return;
		setOperationLoading(true);
		setOperationError(null);
		try {
			const tx = await createChangeThresholdTx(safe.safeInstance, newThreshold);
			const signed = await signTransaction(safe.safeInstance, tx);
			await executeTransaction(safe.safeInstance, signed);
			await safe.connectSafe(safe.safeAddress, rpcUrl, resolveSigner());
		} catch (err) {
			setOperationError(
				err instanceof Error ? err.message : "Failed to change threshold",
			);
		} finally {
			setOperationLoading(false);
		}
	};

	const safeBalanceEth = formatEthMaybeWei(safe.balance);
	const thresholdLabel = `${safe.threshold} of ${safe.owners.length}`;
	const guardActive = Boolean(safe.guard && safe.guard !== ZERO_ADDRESS);

	const navSections = commandCenterSidebarSections.map((section) => ({
		...section,
		items: section.items.map((item) => {
			if (item.id === "transactions") {
				return {
					...item,
					badge: pendingTxs.length > 0 ? String(pendingTxs.length) : undefined,
				};
			}
			if (item.id === "modules") {
				return {
					...item,
					badge:
						safe.modules.length > 0 ? String(safe.modules.length) : undefined,
				};
			}
			return item;
		}),
	}));

	const stats = [
		{
			...commandCenterStats[0],
			value: String(pendingTxs.length),
			subLabel:
				pendingTxs.length > 0
					? `${pendingTxs.length} awaiting signatures`
					: "queue clear",
			backgroundToken: "var(--ds-color-white)",
		},
		{
			...commandCenterStats[1],
			value: guardActive ? "active" : "inactive",
			subLabel: guardActive ? "daily limit checks on" : "no guard configured",
			backgroundToken: guardActive
				? "var(--ds-color-sky)"
				: "var(--ds-color-white)",
		},
		{
			...commandCenterStats[2],
			value: String(safe.modules.length),
			subLabel:
				safe.modules.length > 0
					? `${safe.modules.length} module active`
					: "no modules active",
			backgroundToken:
				safe.modules.length > 0
					? "var(--ds-color-lavender)"
					: "var(--ds-color-white)",
		},
	];

	const txActivity = [
		...pendingTxs.slice(0, 2).map((tx) => ({
			id: tx.safeTxHash,
			direction: "outgoing" as const,
			title: tx.isReady ? "Ready for execution" : "Pending owner signatures",
			meta: `${shortenAddress(tx.to)} • ${tx.confirmations}/${tx.threshold}`,
			amountLabel: `${formatEthMaybeWei(tx.value)} ETH`,
		})),
		...executedTxs.slice(0, 1).map((tx) => ({
			id: `executed-${tx.safeTxHash}`,
			direction: "config" as const,
			title: "Transaction executed",
			meta: shortenAddress(tx.to),
			amountLabel: `${formatEthMaybeWei(tx.value)} ETH`,
		})),
	];

	const activity = txActivity.length > 0 ? txActivity : commandCenterActivity;
	const latestPending = pendingTxs[0];
	const pendingPreview = latestPending
		? {
				confirmations: latestPending.confirmations,
				idLabel: `#${latestPending.safeTxHash.slice(2, 6)}`,
				state: latestPending.isReady
					? ("ready" as const)
					: ("pending" as const),
				threshold: latestPending.threshold,
				toLabel: shortenAddress(latestPending.to),
				valueLabel: `${formatEthMaybeWei(latestPending.value)} ETH`,
			}
		: undefined;

	return (
		<>
			<div className="mb-6 overflow-hidden rounded-xl border border-gray-700">
				<CommandCenterOverview
					activity={activity}
					address={address}
					chainLabel={chain?.name ?? "gnosis chain"}
					embedded
					guardActive={guardActive}
					guardDescription={
						guardActive
							? "Daily spending limit checks are currently enforced."
							: "No guard contract is configured for this Safe."
					}
					guardTitle={guardActive ? "Guard active" : "Guard inactive"}
					navSections={navSections}
					pendingPreview={pendingPreview}
					safeAddress={safe.safeAddress ?? "0x..."}
					safeBalanceLabel={safeBalanceEth}
					stats={stats}
					statusBalanceLabel={`${safeBalanceEth} ETH`}
					thresholdLabel={thresholdLabel}
				/>
			</div>

			{/* Safe info header */}
			<div className="bg-gray-800 rounded-xl p-4 mb-6">
				<div className="flex items-center justify-between flex-wrap gap-4 mb-3">
					<div className="flex items-center gap-4">
						{chain && (
							<ChainBadge
								chainName={chain.name}
								chainId={chain.id}
								isConnected
							/>
						)}
						{safe.safeAddress && <AddressDisplay address={safe.safeAddress} />}
					</div>
					<button
						onClick={safe.disconnectSafe}
						type="button"
						className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
					>
						Disconnect
					</button>
				</div>
				{safe.safeAddress && (
					<div className="border-t border-gray-700 pt-3">
						<span className="text-xs text-gray-500 block mb-1">
							Safe Address
						</span>
						<code className="text-sm text-cyan-300 font-mono break-all select-all">
							{safe.safeAddress}
						</code>
					</div>
				)}
			</div>

			{safe.error && (
				<div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm mb-6">
					{safe.error}
				</div>
			)}

			<SafeOverview
				owners={safe.owners}
				threshold={safe.threshold}
				guard={safe.guard}
				rpcUrl={rpcUrl}
				moduleCount={safe.modules.length}
			/>

			{operationLoading && (
				<div className="bg-cyan-900/30 border border-cyan-700 rounded-xl p-4 mb-6">
					<p className="text-cyan-300 text-sm">Processing Safe operation...</p>
				</div>
			)}

			{operationError && (
				<div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm mb-6">
					{operationError}
				</div>
			)}

			{/* Info grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<Owners
					owners={safe.owners}
					currentAddress={address}
					onAddOwner={handleAddOwner}
					onRemoveOwner={handleRemoveOwner}
				/>
				<Threshold
					threshold={safe.threshold}
					ownerCount={safe.owners.length}
					onChangeThreshold={handleChangeThreshold}
				/>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
				<div>
					<TokenBalances
						tokens={
							safe.balance !== "0"
								? [
										{
											name: "xDAI",
											symbol: "xDAI",
											balance: formatUnits(BigInt(safe.balance), 18),
										},
									]
								: []
						}
						loading={false}
					/>
					{import.meta.env.DEV && (
						<FundSafe
							safeAddress={safe.safeAddress!}
							rpcUrl={rpcUrl}
							signer={resolveSigner()}
							onFunded={async () => {
								await safe.connectSafe(
									safe.safeAddress!,
									rpcUrl,
									resolveSigner(),
								);
							}}
						/>
					)}
				</div>
				<GuardPanel
					guard={safe.guard}
					safeAddress={safe.safeAddress!}
					safeInstance={safe.safeInstance!}
					rpcUrl={rpcUrl}
					signer={resolveSigner()}
					onRefresh={async () => {
						await safe.connectSafe(safe.safeAddress!, rpcUrl, resolveSigner());
					}}
				/>
			</div>

			<div className="mb-6">
				<ModulePanel
					modules={safe.modules}
					safeAddress={safe.safeAddress!}
					safeInstance={safe.safeInstance!}
					rpcUrl={rpcUrl}
					signer={resolveSigner()}
					onRefresh={async () => {
						await safe.connectSafe(safe.safeAddress!, rpcUrl, resolveSigner());
					}}
				/>
			</div>

			{/* Transaction Builder */}
			<div className="space-y-6 mb-6">
				<h2 className="text-xl font-semibold">Transactions</h2>

				{txError && (
					<div className="bg-red-900/50 border border-red-700 rounded-xl p-4">
						<p className="text-red-300 text-sm">{txError}</p>
					</div>
				)}

				{txBusy && (
					<div className="bg-cyan-900/30 border border-cyan-700 rounded-xl p-4">
						<p className="text-cyan-300 text-sm">Processing transaction...</p>
					</div>
				)}

				<div
					className={`rounded-xl p-4 border ${
						txSourceMode === "transaction-service"
							? "bg-cyan-900/20 border-cyan-700"
							: "bg-amber-900/30 border-amber-700"
					}`}
				>
					<p
						className={`text-sm ${txSourceMode === "transaction-service" ? "text-cyan-300" : "text-amber-300"}`}
					>
						<strong>{txModeLabel}:</strong> {txModeHelpText}
					</p>
				</div>

				{safe.threshold > 1 && (
					<div className="bg-amber-900/20 border border-amber-700 rounded-xl p-4">
						<p className="text-amber-300 text-sm">
							<strong>Multi-sig mode:</strong> This Safe requires{" "}
							{safe.threshold} of {safe.owners.length} confirmations.
						</p>
					</div>
				)}

				<TxBuilder onBuild={handleBuild} />

				{/* Latest pending tx detail */}
				{pendingTxs.length > 0 &&
					(() => {
						const latest = pendingTxs[0];
						return (
							<TransactionFlow
								transaction={{
									safeTxHash: latest.safeTxHash,
									to: latest.to,
									value: latest.value,
									data: latest.data,
									status: {
										safeTxHash: latest.safeTxHash,
										confirmations: latest.confirmations,
										confirmedBy: latest.confirmedBy,
										threshold: latest.threshold,
										isReady: latest.isReady,
										isExecuted: false,
										source: latest.source,
									},
								}}
								currentAddress={address}
								onConfirm={handleConfirm}
								onExecute={handleExecute}
							/>
						);
					})()}

				<TxQueue
					transactions={pendingTxs}
					threshold={safe.threshold}
					modeLabel={txModeLabel}
					modeHelpText={txModeHelpText}
					onConfirm={handleConfirm}
					onExecute={handleExecute}
				/>
				<TxHistory transactions={executedTxs} />
			</div>
		</>
	);
}

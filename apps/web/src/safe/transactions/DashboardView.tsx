import { useEffect, useState } from "react";
import { formatEther, formatUnits, parseEther } from "viem";
import {
	CommandCenterGuard,
	CommandCenterModules,
	CommandCenterOverview,
	CommandCenterOwners,
	CommandCenterTransactions,
} from "../../design-system/compositions/command-center";
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
	SpendingLimitGuardABI,
} from "../contracts/abis";
import {
	deployAllowanceModule,
	deploySpendingLimitGuard,
} from "../contracts/deploy";
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
import { mapGuardScreen } from "../screens/mappers/guard";
import { mapModulesScreen } from "../screens/mappers/modules";
import { mapOwnersScreen } from "../screens/mappers/owners";
import { mapTransactionsScreen } from "../screens/mappers/transactions";
import { navItemForScreen } from "../screens/screen-layout";
import type { SafeScreenId } from "../screens/types";
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

function getAllowanceModuleKey(safeAddress: string) {
	return `safe-allowance-module-${safeAddress}`;
}

function addressEq(addressA: string, addressB: string) {
	return addressA.toLowerCase() === addressB.toLowerCase();
}

interface DashboardViewProps {
	activeScreen: SafeScreenId;
	address: string | undefined;
	chain: { name: string; id: number } | undefined;
	safe: ReturnType<typeof useSafe>;
	rpcUrl: string;
}

export default function DashboardView({
	activeScreen,
	address,
	chain,
	safe,
	rpcUrl,
}: DashboardViewProps) {
	const [operationLoading, setOperationLoading] = useState(false);
	const [operationError, setOperationError] = useState<string | null>(null);
	const [guardLoading, setGuardLoading] = useState(false);
	const [guardError, setGuardError] = useState<string | null>(null);
	const [guardSpendingLimit, setGuardSpendingLimit] = useState("1");
	const [deployedGuardAddress, setDeployedGuardAddress] = useState<string | null>(
		null,
	);
	const [currentGuardLimit, setCurrentGuardLimit] = useState<string | null>(null);
	const [moduleLoading, setModuleLoading] = useState(false);
	const [moduleError, setModuleError] = useState<string | null>(null);
	const [deployedModuleAddress, setDeployedModuleAddress] = useState<
		string | null
	>(null);
	const resolveSigner = () => getDevWalletActiveSigner();

	useEffect(() => {
		if (!safe.guard || safe.guard === ZERO_ADDRESS) {
			setCurrentGuardLimit(null);
			return;
		}

		let cancelled = false;
		void (async () => {
			try {
				const { createPublicClient, http } = await import("viem");
				const client = createPublicClient({ transport: http(rpcUrl) });
				const limit = await client.readContract({
					address: safe.guard as `0x${string}`,
					abi: SpendingLimitGuardABI,
					functionName: "spendingLimit",
				});
				if (!cancelled) {
					setCurrentGuardLimit(formatEther(limit as bigint));
				}
			} catch {
				if (!cancelled) {
					setCurrentGuardLimit(null);
				}
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [safe.guard, rpcUrl]);

	useEffect(() => {
		if (safe.guard && safe.guard !== ZERO_ADDRESS) {
			setDeployedGuardAddress(null);
		}
	}, [safe.guard]);

	useEffect(() => {
		if (!safe.safeAddress) {
			setDeployedModuleAddress(null);
			return;
		}
		try {
			const persistedAddress = localStorage.getItem(
				getAllowanceModuleKey(safe.safeAddress),
			);
			setDeployedModuleAddress(persistedAddress);
		} catch {
			setDeployedModuleAddress(null);
		}
	}, [safe.safeAddress]);

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

	const refreshSafeState = async () => {
		if (!safe.safeAddress) return;
		await safe.connectSafe(safe.safeAddress, rpcUrl, resolveSigner());
	};

	const handleDisableGuard = async () => {
		if (!safe.safeInstance) return;
		setGuardLoading(true);
		setGuardError(null);
		try {
			const tx = await safe.safeInstance.createDisableGuardTx();
			const signed = await signTransaction(safe.safeInstance, tx);
			await executeTransaction(safe.safeInstance, signed);
			await refreshSafeState();
		} catch (err) {
			setGuardError(err instanceof Error ? err.message : "Failed to disable guard");
		} finally {
			setGuardLoading(false);
		}
	};

	const handleDeployGuard = async () => {
		if (!safe.safeAddress) return;
		setGuardLoading(true);
		setGuardError(null);
		try {
			const result = await deploySpendingLimitGuard(
				{ provider: rpcUrl, signer: resolveSigner() },
				safe.safeAddress,
				parseEther(guardSpendingLimit),
			);
			setDeployedGuardAddress(result.address);
		} catch (err) {
			setGuardError(err instanceof Error ? err.message : "Failed to deploy guard");
		} finally {
			setGuardLoading(false);
		}
	};

	const handleEnableGuard = async () => {
		if (!safe.safeInstance || !deployedGuardAddress) return;
		setGuardLoading(true);
		setGuardError(null);
		try {
			const tx = await safe.safeInstance.createEnableGuardTx(
				deployedGuardAddress,
			);
			const signed = await signTransaction(safe.safeInstance, tx);
			await executeTransaction(safe.safeInstance, signed);
			await refreshSafeState();
		} catch (err) {
			setGuardError(err instanceof Error ? err.message : "Failed to enable guard");
		} finally {
			setGuardLoading(false);
		}
	};

	const handleDeployModule = async () => {
		if (!safe.safeAddress) return;
		setModuleLoading(true);
		setModuleError(null);
		try {
			const result = await deployAllowanceModule(
				{ provider: rpcUrl, signer: resolveSigner() },
				safe.safeAddress,
			);
			setDeployedModuleAddress(result.address);
			try {
				localStorage.setItem(getAllowanceModuleKey(safe.safeAddress), result.address);
			} catch {
				// ignore localStorage errors in private browsing contexts
			}
		} catch (err) {
			setModuleError(err instanceof Error ? err.message : "Failed to deploy module");
		} finally {
			setModuleLoading(false);
		}
	};

	const handleEnableModule = async () => {
		if (!safe.safeInstance || !deployedModuleAddress) return;
		setModuleLoading(true);
		setModuleError(null);
		try {
			const tx = await safe.safeInstance.createEnableModuleTx(deployedModuleAddress);
			const signed = await signTransaction(safe.safeInstance, tx);
			await executeTransaction(safe.safeInstance, signed);
			await refreshSafeState();
		} catch (err) {
			setModuleError(err instanceof Error ? err.message : "Failed to enable module");
		} finally {
			setModuleLoading(false);
		}
	};

	const handleDisableModule = async () => {
		if (!safe.safeInstance || safe.modules.length === 0) return;
		setModuleLoading(true);
		setModuleError(null);
		try {
			const targetModule = safe.modules[0];
			const tx = await safe.safeInstance.createDisableModuleTx(targetModule);
			const signed = await signTransaction(safe.safeInstance, tx);
			await executeTransaction(safe.safeInstance, signed);
			await refreshSafeState();
		} catch (err) {
			setModuleError(err instanceof Error ? err.message : "Failed to disable module");
		} finally {
			setModuleLoading(false);
		}
	};

	const safeBalanceEth = formatEthMaybeWei(safe.balance);
	const thresholdLabel = `${safe.threshold} of ${safe.owners.length}`;
	const guardActive = Boolean(safe.guard && safe.guard !== ZERO_ADDRESS);
	const activeNavItem = navItemForScreen(activeScreen);

	const navSections = commandCenterSidebarSections.map((section) => ({
		...section,
		items: section.items.map((item) => {
			const baseActive = item.id === activeNavItem;
			if (item.id === "transactions") {
				return {
					...item,
					active: baseActive,
					badge: pendingTxs.length > 0 ? String(pendingTxs.length) : undefined,
				};
			}
			if (item.id === "modules") {
				return {
					...item,
					active: baseActive,
					badge:
						safe.modules.length > 0 ? String(safe.modules.length) : undefined,
				};
			}
			return {
				...item,
				active: baseActive,
			};
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

	const guardScreen = mapGuardScreen({
		guardAddress: safe.guard,
		currentLimitEth: currentGuardLimit,
		spendingLimitEth: guardSpendingLimit,
		deployedGuardAddress,
	});
	const moduleIsEnabled = deployedModuleAddress
		? safe.modules.some((moduleAddress) =>
				addressEq(moduleAddress, deployedModuleAddress),
			)
		: false;
	const moduleScreen = mapModulesScreen({
		modules: safe.modules,
		deployedModuleAddress:
			deployedModuleAddress && !moduleIsEnabled ? deployedModuleAddress : null,
	});

	const ownersScreen = mapOwnersScreen({
		owners: safe.owners,
		currentAddress: address,
	});

	const transactionsScreen = mapTransactionsScreen({
		pendingTxs,
		executedTxs,
		onConfirm: handleConfirm,
		onExecute: handleExecute,
	});

	if (activeScreen === "guard") {
		return (
			<div className="mb-6 overflow-hidden rounded-xl border border-gray-700">
				<CommandCenterGuard
					active={guardScreen.active}
					address={address}
					chainLabel={chain?.name ?? "gnosis chain"}
					deployedGuardAddress={deployedGuardAddress}
					embedded
					errorMessage={guardError}
					guardAddress={guardScreen.guardAddress}
					guardName={guardScreen.guardName}
					isBusy={guardLoading}
					limitSummary={guardScreen.limitSummary}
					navSections={navSections}
					onDeployGuard={handleDeployGuard}
					onDisableGuard={handleDisableGuard}
					onEnableGuard={handleEnableGuard}
					onSpendingLimitChange={setGuardSpendingLimit}
					safeAddress={safe.safeAddress ?? "0x..."}
					safeBalanceLabel={safeBalanceEth}
					spendingLimitValue={guardSpendingLimit}
					statusBalanceLabel={`${safeBalanceEth} ETH`}
					thresholdLabel={thresholdLabel}
				/>
			</div>
		);
	}

	if (activeScreen === "modules") {
		return (
			<div className="mb-6 overflow-hidden rounded-xl border border-gray-700">
				<CommandCenterModules
					address={address}
					chainLabel={chain?.name ?? "gnosis chain"}
					delegates={moduleScreen.delegates}
					embedded
					errorMessage={moduleError}
					isBusy={moduleLoading}
					mode={moduleScreen.mode}
					moduleAddress={moduleScreen.moduleAddress}
					moduleName={moduleScreen.moduleName}
					navSections={navSections}
					onPrimaryAction={() => {
						if (moduleScreen.mode === "active") {
							void handleDisableModule();
							return;
						}
						if (moduleScreen.mode === "deploy-ready") {
							void handleEnableModule();
							return;
						}
						void handleDeployModule();
					}}
					primaryActionLabel={moduleScreen.primaryActionLabel}
					safeAddress={safe.safeAddress ?? "0x..."}
					safeBalanceLabel={safeBalanceEth}
					statusBalanceLabel={`${safeBalanceEth} ETH`}
					statusDescription={moduleScreen.statusDescription}
					thresholdLabel={thresholdLabel}
				/>
			</div>
		);
	}

	if (activeScreen === "owners") {
		return (
			<div className="mb-6 overflow-hidden rounded-xl border border-gray-700">
				<CommandCenterOwners
					address={address}
					chainLabel={chain?.name ?? "gnosis chain"}
					embedded
					navSections={navSections}
					onAddOwner={handleAddOwner}
					onChangeThreshold={handleChangeThreshold}
					onRemoveOwner={handleRemoveOwner}
					ownerActionBusy={operationLoading}
					ownerActionError={operationError}
					ownerCount={ownersScreen.ownerCount}
					owners={ownersScreen.owners}
					safeAddress={safe.safeAddress ?? "0x..."}
					safeBalanceLabel={safeBalanceEth}
					statusBalanceLabel={`${safeBalanceEth} ETH`}
					threshold={safe.threshold}
					thresholdLabel={thresholdLabel}
				/>
			</div>
		);
	}

	if (activeScreen === "transactions") {
		return (
			<div className="mb-6 overflow-hidden rounded-xl border border-gray-700">
				<CommandCenterTransactions
					address={address}
					chainLabel={chain?.name ?? "gnosis chain"}
					embedded
					historyEntries={transactionsScreen.historyEntries}
					modeHelpText={txModeHelpText}
					modeLabel={txModeLabel}
					navSections={navSections}
					onBuildTransaction={async (tx) => {
						await handleBuild({
							to: tx.to,
							value: tx.value,
							data: tx.data,
						});
					}}
					pendingTransactions={transactionsScreen.pendingTransactions}
					safeAddress={safe.safeAddress ?? "0x..."}
					safeBalanceLabel={safeBalanceEth}
					statusBalanceLabel={`${safeBalanceEth} ETH`}
					thresholdLabel={thresholdLabel}
					txBusy={txBusy}
					txError={txError}
				/>
			</div>
		);
	}

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

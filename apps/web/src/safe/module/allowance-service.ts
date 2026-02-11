import {
	createPublicClient,
	createWalletClient,
	defineChain,
	encodeFunctionData,
	http,
	parseAbiItem,
	parseEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { AllowanceModuleABI } from "../contracts/abis";
import type {
	AllowanceDelegateState,
	AllowanceModuleState,
	ExecuteAllowanceInput,
	SetAllowanceInput,
} from "./types";

const ALLOWANCE_SET_EVENT = parseAbiItem(
	"event AllowanceSet(address indexed delegate, uint256 amount, uint256 resetPeriod)",
);

function normalizeAddress(address: string) {
	return address.toLowerCase();
}

function parseAllowanceTuple(
	value: unknown,
): { amount: bigint; spent: bigint; resetPeriod: bigint; lastReset: bigint } {
	if (Array.isArray(value)) {
		const [amount, spent, resetPeriod, lastReset] = value;
		return {
			amount: BigInt(amount ?? 0),
			spent: BigInt(spent ?? 0),
			resetPeriod: BigInt(resetPeriod ?? 0),
			lastReset: BigInt(lastReset ?? 0),
		};
	}

	if (value && typeof value === "object") {
		const allowance = value as {
			amount?: bigint;
			spent?: bigint;
			resetPeriod?: bigint;
			lastReset?: bigint;
		};
		return {
			amount: BigInt(allowance.amount ?? 0),
			spent: BigInt(allowance.spent ?? 0),
			resetPeriod: BigInt(allowance.resetPeriod ?? 0),
			lastReset: BigInt(allowance.lastReset ?? 0),
		};
	}

	return {
		amount: 0n,
		spent: 0n,
		resetPeriod: 0n,
		lastReset: 0n,
	};
}

export function encodeSetAllowanceCalldata({
	amountEth,
	delegateAddress,
	resetPeriodSeconds,
}: SetAllowanceInput) {
	return encodeFunctionData({
		abi: AllowanceModuleABI,
		functionName: "setAllowance",
		args: [
			delegateAddress as `0x${string}`,
			parseEther(amountEth),
			resetPeriodSeconds,
		],
	});
}

export async function loadAllowanceModuleState({
	moduleAddress,
	rpcUrl,
}: {
	moduleAddress: string;
	rpcUrl: string;
}): Promise<AllowanceModuleState> {
	const client = createPublicClient({ transport: http(rpcUrl) });
	const logs = await client.getLogs({
		address: moduleAddress as `0x${string}`,
		event: ALLOWANCE_SET_EVENT,
		fromBlock: "earliest",
	});

	const delegateAddresses = Array.from(
		new Set(
			logs
				.map((log) => log.args.delegate)
				.filter((delegate): delegate is string => Boolean(delegate))
				.map(normalizeAddress),
		),
	).sort();

	const delegates = await Promise.all(
		delegateAddresses.map(async (delegateAddress): Promise<AllowanceDelegateState> => {
			const allowanceResult = await client.readContract({
				address: moduleAddress as `0x${string}`,
				abi: AllowanceModuleABI,
				functionName: "allowances",
				args: [delegateAddress as `0x${string}`],
			});
			const availableResult = await client.readContract({
				address: moduleAddress as `0x${string}`,
				abi: AllowanceModuleABI,
				functionName: "getAvailableAllowance",
				args: [delegateAddress as `0x${string}`],
			});
			const allowance = parseAllowanceTuple(allowanceResult);

			return {
				address: delegateAddress,
				amountWei: allowance.amount,
				spentWei: allowance.spent,
				resetPeriodSeconds: allowance.resetPeriod,
				lastResetTimestamp: allowance.lastReset,
				availableWei: BigInt(availableResult as bigint),
			};
		}),
	);

	return {
		moduleAddress: normalizeAddress(moduleAddress),
		delegates,
	};
}

export async function executeAllowanceAsDelegate(
	{
		amountEth,
		signerPrivateKey,
		to,
	}: ExecuteAllowanceInput,
	{
		moduleAddress,
		rpcUrl,
	}: {
		moduleAddress: string;
		rpcUrl: string;
	},
) {
	const transport = http(rpcUrl);
	const publicClient = createPublicClient({ transport });
	const chainId = await publicClient.getChainId();
	const chain = defineChain({
		id: chainId,
		name: `Chain ${chainId}`,
		nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
		rpcUrls: { default: { http: [rpcUrl] } },
	});
	const account = privateKeyToAccount(signerPrivateKey);
	const walletClient = createWalletClient({ account, chain, transport });

	const hash = await walletClient.writeContract({
		address: moduleAddress as `0x${string}`,
		abi: AllowanceModuleABI,
		functionName: "executeAllowance",
		args: [to as `0x${string}`, parseEther(amountEth)],
	});
	await publicClient.waitForTransactionReceipt({ hash });
	return hash;
}

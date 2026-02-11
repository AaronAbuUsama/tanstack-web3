import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	confirmTransaction as confirmServiceTransaction,
	getPendingTransactions as getServicePendingTransactions,
	getTransaction as getServiceTransaction,
	isTxServiceSupportedChain,
	proposeTransaction,
} from "../core/api";
import { sendTransactions } from "../core/iframe";
import { executeTransaction } from "../core/standalone";
import { useTransactions } from "./use-transactions";

vi.mock("../core/api", () => ({
	isTxServiceSupportedChain: vi.fn(() => false),
	proposeTransaction: vi.fn(async () => undefined),
	getTransaction: vi.fn(async () => ({})),
	confirmTransaction: vi.fn(async () => undefined),
	getPendingTransactions: vi.fn(async () => []),
}));

vi.mock("../core/standalone", () => ({
	createTransaction: vi.fn(async () => ({
		data: {
			to: "0x0000000000000000000000000000000000000001",
			value: "0",
			data: "0x",
			operation: 0,
			safeTxGas: "0",
			baseGas: "0",
			gasPrice: "0",
			gasToken: "0x0000000000000000000000000000000000000000",
			refundReceiver: "0x0000000000000000000000000000000000000000",
			nonce: 0,
		},
		signatures: new Map([
			["0xownera", { signer: "0xownera", data: "0xownersig" }],
		]),
		getSignature: () => ({ signer: "0xownera", data: "0xownersig" }),
	})),
	signTransaction: vi.fn(async () => ({
		signatures: new Map([
			["0xownera", { signer: "0xownera", data: "0xownersig" }],
			["0xownerb", { signer: "0xownerb", data: "0xownerbsig" }],
		]),
		getSignature: (signer: string) => {
			const normalizedSigner = signer.toLowerCase();
			if (normalizedSigner === "0xownerb") {
				return { signer: "0xownerb", data: "0xownerbsig" };
			}
			return { signer: "0xownera", data: "0xownersig" };
		},
	})),
	executeTransaction: vi.fn(async () => ({ hash: "0xexecuted" })),
}));

vi.mock("../core/iframe", () => ({
	sendTransactions: vi.fn(async () => "0xiframehash"),
}));

function mockServiceTx(confirmations: string[], confirmationsRequired = 2) {
	return {
		safe: "0xsafe",
		to: "0x0000000000000000000000000000000000000001",
		value: "0",
		data: "0x",
		operation: 0,
		gasToken: "0x0000000000000000000000000000000000000000",
		safeTxGas: "0",
		baseGas: "0",
		gasPrice: "0",
		nonce: "0",
		executionDate: null,
		submissionDate: "2026-02-10T00:00:00Z",
		modified: "2026-02-10T00:00:00Z",
		blockNumber: null,
		transactionHash: null,
		safeTxHash: "0xservice-hash",
		executor: null,
		proposer: "0xownera",
		proposedByDelegate: null,
		isExecuted: false,
		isSuccessful: null,
		ethGasPrice: null,
		maxFeePerGas: null,
		maxPriorityFeePerGas: null,
		gasUsed: null,
		fee: null,
		origin: "",
		confirmationsRequired,
		confirmations: confirmations.map((owner) => ({
			owner,
			submissionDate: "2026-02-10T00:00:00Z",
			signature: "0xsig",
			signatureType: "EOA",
		})),
		trusted: true,
		signatures: null,
	} as any;
}

describe("useTransactions", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	it("proposes transactions via Safe Transaction Service when service mode is active", async () => {
		vi.mocked(isTxServiceSupportedChain).mockReturnValue(true);
		vi.mocked(getServicePendingTransactions).mockResolvedValue([]);

		const safeInstance = {
			getTransactionHash: vi.fn(async () => "0xservice-hash"),
		} as any;

		const { result } = renderHook(() =>
			useTransactions({
				safeAddress: "0xsafe",
				safeInstance,
				threshold: 2,
				mode: "standalone",
				chainId: 10200,
				rpcUrl: "https://rpc.chiadochain.net",
				currentAddress: "0xownera",
			}),
		);

		await act(async () => {
			await result.current.handleBuild({
				to: "0x0000000000000000000000000000000000000001",
				value: "0",
				data: "0x",
			});
		});

		expect(vi.mocked(proposeTransaction)).toHaveBeenCalledTimes(1);
		expect(vi.mocked(proposeTransaction).mock.calls[0]?.[0]).toMatchObject({
			chainId: 10200,
			safeAddress: "0xsafe",
			safeTxHash: "0xservice-hash",
			senderAddress: "0xownera",
			origin: "intent:transfer",
		});
	});

	it("queues governance proposals in pending state for local threshold > 1", async () => {
		vi.mocked(isTxServiceSupportedChain).mockReturnValue(false);

		const safeInstance = {
			getTransactionHash: vi.fn(async () => "0xgovernance-hash"),
			getOwnersWhoApprovedTx: vi.fn(async () => []),
		} as any;

		const { result } = renderHook(() =>
			useTransactions({
				safeAddress: "0xsafe",
				safeInstance,
				threshold: 2,
				mode: "standalone",
				chainId: 31337,
				rpcUrl: "http://127.0.0.1:8545",
				currentAddress: "0xownera",
			}),
		);

		await act(async () => {
			await result.current.handleProposeSafeTransaction({
				safeTransaction: {
					data: {
						to: "0xsafe",
						value: "0",
						data: "0x694e80c30000000000000000000000000000000000000000000000000000000000000002",
						nonce: 3,
						safeTxGas: "0",
						baseGas: "0",
						gasPrice: "0",
						gasToken: "0x0000000000000000000000000000000000000000",
						refundReceiver: "0x0000000000000000000000000000000000000000",
					},
				} as any,
				intent: "governance:change-threshold",
			});
		});

		expect(result.current.pendingTxs).toHaveLength(1);
		expect(result.current.pendingTxs[0].intent).toBe(
			"governance:change-threshold",
		);
		expect(result.current.pendingTxs[0].isReady).toBe(false);
		expect(result.current.executedTxs).toHaveLength(0);

		await act(async () => {
			await result.current.handleExecute("0xgovernance-hash");
		});

		expect(result.current.txError).toBe("Not enough confirmations: 0/2");
		expect(vi.mocked(executeTransaction)).not.toHaveBeenCalled();
	});

	it("tags governance proposals with intent origin in transaction service mode", async () => {
		vi.mocked(isTxServiceSupportedChain).mockReturnValue(true);
		vi.mocked(getServicePendingTransactions).mockResolvedValue([]);

		const safeInstance = {
			getTransactionHash: vi.fn(async () => "0xservice-governance-hash"),
		} as any;

		const { result } = renderHook(() =>
			useTransactions({
				safeAddress: "0xsafe",
				safeInstance,
				threshold: 2,
				mode: "standalone",
				chainId: 10200,
				rpcUrl: "https://rpc.chiadochain.net",
				currentAddress: "0xownera",
			}),
		);

		await act(async () => {
			await result.current.handleProposeSafeTransaction({
				safeTransaction: {
					data: {
						to: "0xsafe",
						value: "0",
						data: "0x0d582f130000000000000000000000000000000000000000000000000000000000000002",
						nonce: 7,
						safeTxGas: "0",
						baseGas: "0",
						gasPrice: "0",
						gasToken: "0x0000000000000000000000000000000000000000",
						refundReceiver: "0x0000000000000000000000000000000000000000",
					},
				} as any,
				intent: "governance:change-threshold",
			});
		});

		expect(vi.mocked(proposeTransaction)).toHaveBeenCalledWith(
			expect.objectContaining({
				safeTxHash: "0xservice-governance-hash",
				origin: "intent:governance:change-threshold",
			}),
		);
	});

	it("submits confirmations through Safe Transaction Service", async () => {
		vi.mocked(isTxServiceSupportedChain).mockReturnValue(true);
		vi.mocked(getServicePendingTransactions).mockResolvedValue([
			mockServiceTx([]),
		]);
		vi.mocked(getServiceTransaction).mockResolvedValue(mockServiceTx([]));

		const safeInstance = {
			getTransactionHash: vi.fn(async () => "0xservice-hash"),
		} as any;

		const { result } = renderHook(() =>
			useTransactions({
				safeAddress: "0xsafe",
				safeInstance,
				threshold: 2,
				mode: "standalone",
				chainId: 10200,
				rpcUrl: "https://rpc.chiadochain.net",
				currentAddress: "0xownerb",
			}),
		);

		await waitFor(() => {
			expect(result.current.pendingTxs).toHaveLength(1);
		});

		await act(async () => {
			await result.current.handleConfirm("0xservice-hash");
		});

		expect(vi.mocked(confirmServiceTransaction)).toHaveBeenCalledWith({
			chainId: 10200,
			safeTxHash: "0xservice-hash",
			signature: "0xownerbsig",
		});
	});

	it("enforces execute gating from service confirmations", async () => {
		vi.mocked(isTxServiceSupportedChain).mockReturnValue(true);
		vi.mocked(getServicePendingTransactions).mockResolvedValue([
			mockServiceTx(["0xownera"]),
		]);
		vi.mocked(getServiceTransaction).mockResolvedValue(
			mockServiceTx(["0xownera"]),
		);

		const safeInstance = {
			getTransactionHash: vi.fn(async () => "0xservice-hash"),
		} as any;

		const { result } = renderHook(() =>
			useTransactions({
				safeAddress: "0xsafe",
				safeInstance,
				threshold: 2,
				mode: "standalone",
				chainId: 10200,
				rpcUrl: "https://rpc.chiadochain.net",
				currentAddress: "0xownera",
			}),
		);

		await waitFor(() => {
			expect(result.current.pendingTxs).toHaveLength(1);
		});

		await act(async () => {
			await result.current.handleExecute("0xservice-hash");
		});

		expect(result.current.txError).toBe("Not enough confirmations: 1/2");
		expect(vi.mocked(executeTransaction)).not.toHaveBeenCalled();

		vi.mocked(getServiceTransaction).mockResolvedValue(
			mockServiceTx(["0xownera", "0xownerb"]),
		);

		await act(async () => {
			await result.current.handleExecute("0xservice-hash");
		});

		expect(vi.mocked(executeTransaction)).toHaveBeenCalledTimes(1);
		expect(result.current.executedTxs).toHaveLength(1);
	});

	it("keeps local fallback honest for threshold > 1", async () => {
		vi.mocked(isTxServiceSupportedChain).mockReturnValue(false);

		const getOwnersWhoApprovedTx = vi
			.fn()
			.mockResolvedValueOnce([])
			.mockResolvedValue(["0xownerb"]);

		const safeInstance = {
			getTransactionHash: vi.fn(async () => "0xlocal-hash"),
			approveTransactionHash: vi.fn(async () => ({ hash: "0xapprove" })),
			getOwnersWhoApprovedTx,
		} as any;

		const { result } = renderHook(() =>
			useTransactions({
				safeAddress: "0xsafe",
				safeInstance,
				threshold: 2,
				mode: "standalone",
				chainId: 31337,
				rpcUrl: "http://127.0.0.1:8545",
				currentAddress: "0xownerb",
			}),
		);

		await act(async () => {
			await result.current.handleBuild({
				to: "0x0000000000000000000000000000000000000001",
				value: "0",
				data: "0x",
			});
		});

		expect(result.current.pendingTxs).toHaveLength(1);
		expect(result.current.pendingTxs[0].confirmations).toBeGreaterThanOrEqual(
			0,
		);

		await act(async () => {
			await result.current.handleConfirm("0xlocal-hash");
		});

		expect(result.current.pendingTxs[0].confirmations).toBe(1);
		expect(result.current.pendingTxs[0].confirmedBy).toContain("0xownerb");

		await act(async () => {
			await result.current.handleExecute("0xlocal-hash");
		});

		expect(result.current.txError).toBe("Not enough confirmations: 1/2");
	});

	it("marks iframe submissions as pending", async () => {
		const { result } = renderHook(() =>
			useTransactions({
				safeAddress: "0xsafe",
				safeInstance: null,
				threshold: 2,
				mode: "iframe",
				chainId: 10200,
				rpcUrl: "https://rpc.chiadochain.net",
				currentAddress: undefined,
			}),
		);

		await act(async () => {
			await result.current.handleBuild({
				to: "0x0000000000000000000000000000000000000002",
				value: "0.1",
				data: "0x",
			});
		});

		expect(vi.mocked(sendTransactions)).toHaveBeenCalledTimes(1);
		expect(result.current.pendingTxs).toHaveLength(1);
		expect(result.current.executedTxs).toHaveLength(0);
		expect(result.current.pendingTxs[0].safeTxHash).toBe("0xiframehash");
		expect(result.current.pendingTxs[0].intent).toBe("transfer");
	});
});

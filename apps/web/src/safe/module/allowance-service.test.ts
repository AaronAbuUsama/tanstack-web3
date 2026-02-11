import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetLogs = vi.fn();
const mockReadContract = vi.fn();
const mockGetChainId = vi.fn();
const mockWaitForReceipt = vi.fn();
const mockWriteContract = vi.fn();

vi.mock("viem", async (importOriginal) => {
	const actual = await importOriginal<typeof import("viem")>();
	return {
		...actual,
		createPublicClient: vi.fn(() => ({
			getLogs: mockGetLogs,
			readContract: mockReadContract,
			getChainId: mockGetChainId,
			waitForTransactionReceipt: mockWaitForReceipt,
		})),
		createWalletClient: vi.fn(() => ({
			writeContract: mockWriteContract,
		})),
	};
});

vi.mock("viem/accounts", () => ({
	privateKeyToAccount: vi.fn(() => ({
		address: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
	})),
}));

import {
	encodeSetAllowanceCalldata,
	executeAllowanceAsDelegate,
	loadAllowanceModuleState,
} from "./allowance-service";

describe("allowance-service", () => {
	beforeEach(() => {
		mockGetLogs.mockReset();
		mockReadContract.mockReset();
		mockGetChainId.mockReset();
		mockWaitForReceipt.mockReset();
		mockWriteContract.mockReset();
	});

	it("loads delegate allowance state from AllowanceSet logs + contract reads", async () => {
		mockGetLogs.mockResolvedValue([
			{ args: { delegate: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" } },
			{ args: { delegate: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" } },
			{ args: { delegate: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" } },
		]);
		mockReadContract.mockImplementation(async ({ functionName, args }) => {
			const delegate = String(args?.[0] ?? "").toLowerCase();
			if (functionName === "allowances") {
				if (
					delegate === "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
				) {
					return [1000000000000000000n, 250000000000000000n, 86400n, 1700000000n];
				}
				return [500000000000000000n, 100000000000000000n, 0n, 1700000000n];
			}
			if (functionName === "getAvailableAllowance") {
				if (
					delegate === "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
				) {
					return 750000000000000000n;
				}
				return 400000000000000000n;
			}
			return 0n;
		});

		const state = await loadAllowanceModuleState({
			moduleAddress: "0x1111111111111111111111111111111111111111",
			rpcUrl: "http://127.0.0.1:8545",
		});

		expect(state.moduleAddress).toBe(
			"0x1111111111111111111111111111111111111111",
		);
		expect(state.delegates).toHaveLength(2);
		expect(state.delegates[0].address).toBe(
			"0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
		);
		expect(state.delegates[1].address).toBe(
			"0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
		);
		expect(state.delegates[1].amountWei).toBe(1000000000000000000n);
		expect(state.delegates[1].availableWei).toBe(750000000000000000n);
	});

	it("encodes setAllowance calldata", () => {
		const data = encodeSetAllowanceCalldata({
			delegateAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			amountEth: "0.5",
			resetPeriodSeconds: 86400n,
		});

		expect(data.startsWith("0x")).toBe(true);
		expect(data.length).toBeGreaterThan(10);
	});

	it("executes delegate spend through module contract", async () => {
		mockGetChainId.mockResolvedValue(10200);
		mockWriteContract.mockResolvedValue(
			"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		);
		mockWaitForReceipt.mockResolvedValue({});

		const hash = await executeAllowanceAsDelegate(
			{
				signerPrivateKey:
					"0x59c6995e998f97a5a0044966f094538e4f824e7f0ca73f0fd95f6fd16f0f2f40",
				to: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
				amountEth: "0.1",
			},
			{
				moduleAddress: "0x1111111111111111111111111111111111111111",
				rpcUrl: "http://127.0.0.1:8545",
			},
		);

		expect(hash).toBe(
			"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		);
		expect(mockWriteContract).toHaveBeenCalledTimes(1);
		expect(mockWaitForReceipt).toHaveBeenCalledTimes(1);
	});
});

import { describe, expect, it, vi } from "vitest";
import type {
	ExecutedTx,
	PendingTx,
} from "../../transactions/use-transactions";
import { mapTransactionsScreen } from "./transactions";

function makePendingTx(overrides: Partial<PendingTx> = {}): PendingTx {
	return {
		safeTxHash:
			"0xaaaabbbbccccddddeeeeffff1111222233334444555566667777888899990000",
		to: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
		value: "0.75",
		data: "0x",
		confirmations: 1,
		confirmedBy: ["0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"],
		threshold: 2,
		isReady: false,
		source: "local",
		intent: "transfer",
		...overrides,
	};
}

function makeExecutedTx(overrides: Partial<ExecutedTx> = {}): ExecutedTx {
	return {
		safeTxHash:
			"0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
		to: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
		value: "1.25",
		transactionHash:
			"0xffffeeee1111222233334444555566667777888899990000aaaabbbbccccdddd",
		source: "transaction-service",
		intent: "transfer",
		...overrides,
	};
}

describe("mapTransactionsScreen", () => {
	it("maps pending rows with confirm and execute actions", () => {
		const onConfirm = vi.fn();
		const onExecute = vi.fn();
		const pending = [
			makePendingTx(),
			makePendingTx({
				safeTxHash:
					"0xbbbbaaaaccccddddeeeeffff1111222233334444555566667777888899990000",
				confirmations: 2,
				isReady: true,
			}),
		];

		const mapped = mapTransactionsScreen({
			pendingTxs: pending,
			executedTxs: [],
			onConfirm,
			onExecute,
		});

		expect(mapped.pendingTransactions).toHaveLength(2);
		expect(mapped.pendingTransactions[0].state).toBe("pending");
		expect(mapped.pendingTransactions[0].idLabel).toBe("#aaaa");
		expect(mapped.pendingTransactions[1].state).toBe("ready");
		expect(mapped.pendingTransactions[1].idLabel).toBe("#bbbb");

		mapped.pendingTransactions[0].onAction?.();
		mapped.pendingTransactions[1].onAction?.();

		expect(onConfirm).toHaveBeenCalledWith(pending[0].safeTxHash);
		expect(onExecute).toHaveBeenCalledWith(pending[1].safeTxHash);
	});

	it("returns empty activity when there are no transactions", () => {
		const mapped = mapTransactionsScreen({
			pendingTxs: [],
			executedTxs: [],
		});

		expect(mapped.pendingTransactions).toEqual([]);
		expect(mapped.historyEntries).toEqual([]);
	});

	it("builds activity entries from pending and executed transactions", () => {
		const mapped = mapTransactionsScreen({
			pendingTxs: [makePendingTx()],
			executedTxs: [makeExecutedTx()],
		});

		expect(mapped.historyEntries).toHaveLength(2);
		expect(mapped.historyEntries[0].title).toBe("Pending owner signatures");
		expect(mapped.historyEntries[1].title).toBe("Transaction executed");
		expect(mapped.historyEntries[0].amountLabel).toContain("ETH");
		expect(mapped.historyEntries[1].amountLabel).toContain("ETH");
	});

	it("labels governance proposals as proposed until threshold is met", () => {
		const mapped = mapTransactionsScreen({
			pendingTxs: [
				makePendingTx({
					intent: "governance:change-threshold",
					confirmations: 1,
					threshold: 2,
					isReady: false,
				}),
			],
			executedTxs: [],
		});

		expect(mapped.historyEntries[0].title).toBe("Threshold update proposed");
	});

	it("labels guard and module intents with explicit activity titles", () => {
		const mapped = mapTransactionsScreen({
			pendingTxs: [
				makePendingTx({
					intent: "guard:update-limit",
					isReady: false,
				}),
				makePendingTx({
					safeTxHash:
						"0xddddaaaaccccddddeeeeffff1111222233334444555566667777888899990000",
					intent: "module:set-allowance",
					isReady: true,
					confirmations: 2,
				}),
			],
			executedTxs: [
				makeExecutedTx({
					intent: "module:execute-allowance",
				}),
			],
		});

		expect(mapped.historyEntries[0].title).toBe("Guard limit update proposed");
		expect(mapped.historyEntries[1].title).toBe("Allowance update ready");
		expect(mapped.historyEntries[2].title).toBe("Delegate spend executed");
	});
});

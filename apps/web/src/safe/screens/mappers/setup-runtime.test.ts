import { describe, expect, it } from "vitest";
import type { RuntimePolicy } from "../../runtime";
import { mapSetupRuntimeScreen } from "./setup-runtime";

const basePolicy: RuntimePolicy = {
	appContext: "standalone",
	signerProvider: "dev-mnemonic-account",
	txSubmissionPath: "protocol-kit-direct",
	canSign: true,
	canSubmit: true,
};

describe("mapSetupRuntimeScreen", () => {
	it("maps dev accounts and active selections", () => {
		const mapped = mapSetupRuntimeScreen({
			activeChainLabel: "Chiado (Anvil Fork)",
			activeDevIndex: 1,
			devAccountCount: 3,
			policy: basePolicy,
		});

		expect(mapped.activeChainLabel).toBe("Chiado (Anvil Fork)");
		expect(mapped.activeDevIndex).toBe(1);
		expect(mapped.devAccounts).toHaveLength(3);
		expect(mapped.devAccounts[1].index).toBe(1);
		expect(mapped.devAccounts[1].address).toMatch(/^0x/i);
	});

	it("preserves runtime policy summary fields", () => {
		const mapped = mapSetupRuntimeScreen({
			activeChainLabel: "Ethereum Mainnet",
			activeDevIndex: 0,
			policy: {
				...basePolicy,
				appContext: "safe-app-iframe",
				signerProvider: "none",
				txSubmissionPath: "safe-apps-sdk",
				canSign: false,
				canSubmit: true,
			},
		});

		expect(mapped.policy).toEqual({
			appContext: "safe-app-iframe",
			signerProvider: "none",
			txSubmissionPath: "safe-apps-sdk",
		});
	});

	it("supports transaction-service submission mode", () => {
		const mapped = mapSetupRuntimeScreen({
			activeChainLabel: "Ethereum Mainnet",
			activeDevIndex: 0,
			policy: {
				...basePolicy,
				txSubmissionPath: "transaction-service",
			},
		});

		expect(mapped.policy.txSubmissionPath).toBe("transaction-service");
	});
});

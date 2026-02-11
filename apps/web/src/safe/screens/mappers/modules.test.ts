import { describe, expect, it } from "vitest";
import { mapModulesScreen } from "./modules";

describe("mapModulesScreen", () => {
	it("maps empty module state", () => {
		const mapped = mapModulesScreen({
			activeModuleAddress: null,
			allowanceDelegates: [],
			deployedModuleAddress: null,
		});

		expect(mapped.mode).toBe("inactive");
		expect(mapped.moduleAddress).toBe("not deployed");
		expect(mapped.primaryActionLabel).toBe("Deploy AllowanceModule");
		expect(mapped.delegates).toEqual([]);
	});

	it("maps deploy-ready module state", () => {
		const mapped = mapModulesScreen({
			activeModuleAddress: null,
			allowanceDelegates: [],
			deployedModuleAddress: "0x1234567890123456789012345678901234567890",
		});

		expect(mapped.mode).toBe("deploy-ready");
		expect(mapped.moduleAddress).toMatch(/^0x1234/i);
		expect(mapped.primaryActionLabel).toBe("Enable Module");
		expect(mapped.statusDescription).toContain("Deployed");
	});

	it("maps active module state with real delegate allowance labels", () => {
		const mapped = mapModulesScreen({
			activeModuleAddress: "0x1234567890123456789012345678901234567890",
			allowanceDelegates: [
				{
					address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
					amountWei: 1000000000000000000n,
					spentWei: 250000000000000000n,
					availableWei: 750000000000000000n,
					resetPeriodSeconds: 86400n,
					lastResetTimestamp: 1700000000n,
				},
			],
			deployedModuleAddress: "0xfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed",
		});

		expect(mapped.mode).toBe("active");
		expect(mapped.primaryActionLabel).toBe("Disable");
		expect(mapped.delegates).toHaveLength(1);
		expect(mapped.delegates[0].address).toMatch(/^0x7099/i);
		expect(mapped.delegates[0].usedLabel).toBe("0.25 / 1 ETH");
		expect(mapped.delegates[0].availableLabel).toBe("0.75 ETH available");
	});
});

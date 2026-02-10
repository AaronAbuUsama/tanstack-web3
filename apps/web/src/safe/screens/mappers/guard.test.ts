import { describe, expect, it } from "vitest";
import { mapGuardScreen } from "./guard";

describe("mapGuardScreen", () => {
	it("maps active guard state with disable action", () => {
		const mapped = mapGuardScreen({
			guardAddress: "0x1234567890123456789012345678901234567890",
			currentLimitEth: "0.50",
			spendingLimitEth: "1.00",
			deployedGuardAddress: null,
		});

		expect(mapped.mode).toBe("active");
		expect(mapped.active).toBe(true);
		expect(mapped.primaryActionLabel).toBe("Disable Guard");
		expect(mapped.limitSummary.maxLabel).toBe("0.50 ETH");
		expect(mapped.limitSummary.utilizationPercent).toBe(100);
	});

	it("maps inactive guard state with deploy action", () => {
		const mapped = mapGuardScreen({
			guardAddress: "0x0000000000000000000000000000000000000000",
			currentLimitEth: null,
			spendingLimitEth: "0.75",
			deployedGuardAddress: null,
		});

		expect(mapped.mode).toBe("inactive");
		expect(mapped.active).toBe(false);
		expect(mapped.guardAddress).toBe("not deployed");
		expect(mapped.primaryActionLabel).toBe("Deploy Guard");
		expect(mapped.guardDescription).toContain("No guard enabled");
	});

	it("maps deploy-ready state with enable action", () => {
		const mapped = mapGuardScreen({
			guardAddress: "0x0000000000000000000000000000000000000000",
			currentLimitEth: null,
			spendingLimitEth: "1.25",
			deployedGuardAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
		});

		expect(mapped.mode).toBe("deploy-ready");
		expect(mapped.primaryActionLabel).toBe("Enable Guard");
		expect(mapped.guardDescription).toContain("Deployed");
		expect(mapped.guardAddress).toMatch(/^0xabc/i);
	});
});

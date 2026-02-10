import { describe, expect, it } from "vitest";
import { mapModulesScreen } from "./modules";

describe("mapModulesScreen", () => {
	it("maps empty module state", () => {
		const mapped = mapModulesScreen({
			modules: [],
			deployedModuleAddress: null,
		});

		expect(mapped.mode).toBe("inactive");
		expect(mapped.moduleAddress).toBe("not deployed");
		expect(mapped.primaryActionLabel).toBe("Deploy AllowanceModule");
		expect(mapped.delegates).toEqual([]);
	});

	it("maps deploy-ready module state", () => {
		const mapped = mapModulesScreen({
			modules: [],
			deployedModuleAddress: "0x1234567890123456789012345678901234567890",
		});

		expect(mapped.mode).toBe("deploy-ready");
		expect(mapped.moduleAddress).toMatch(/^0x1234/i);
		expect(mapped.primaryActionLabel).toBe("Enable Module");
		expect(mapped.statusDescription).toContain("Deployed");
	});

	it("maps active module state with module chips", () => {
		const mapped = mapModulesScreen({
			modules: [
				"0x1234567890123456789012345678901234567890",
				"0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
			],
			deployedModuleAddress: "0xfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed",
		});

		expect(mapped.mode).toBe("active");
		expect(mapped.primaryActionLabel).toBe("Disable");
		expect(mapped.delegates).toHaveLength(2);
		expect(mapped.delegates[0].address).toMatch(/^0x1234/i);
	});
});

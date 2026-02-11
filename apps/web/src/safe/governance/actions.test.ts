import { describe, expect, it, vi } from "vitest";
import {
	createAddOwnerGovernanceAction,
	createChangeThresholdGovernanceAction,
	createRemoveOwnerGovernanceAction,
	governanceOrigin,
} from "./actions";
import {
	createAddOwnerTx,
	createChangeThresholdTx,
	createRemoveOwnerTx,
} from "../core/standalone";

vi.mock("../core/standalone", () => ({
	createAddOwnerTx: vi.fn(async () => ({ id: "add-owner-tx" })),
	createRemoveOwnerTx: vi.fn(async () => ({ id: "remove-owner-tx" })),
	createChangeThresholdTx: vi.fn(async () => ({ id: "threshold-tx" })),
}));

describe("governance actions", () => {
	it("builds add owner governance proposal metadata", async () => {
		const safeInstance = { id: "safe-instance" } as any;

		const proposal = await createAddOwnerGovernanceAction(
			safeInstance,
			"0x00000000000000000000000000000000000000aa",
		);

		expect(vi.mocked(createAddOwnerTx)).toHaveBeenCalledWith(
			safeInstance,
			"0x00000000000000000000000000000000000000aa",
		);
		expect(proposal.intent).toBe("governance:add-owner");
		expect(proposal.origin).toBe("intent:governance:add-owner");
		expect(proposal.safeTransaction).toEqual({ id: "add-owner-tx" });
	});

	it("builds remove owner governance proposal metadata", async () => {
		const safeInstance = { id: "safe-instance" } as any;

		const proposal = await createRemoveOwnerGovernanceAction(
			safeInstance,
			"0x00000000000000000000000000000000000000bb",
			2,
		);

		expect(vi.mocked(createRemoveOwnerTx)).toHaveBeenCalledWith(
			safeInstance,
			"0x00000000000000000000000000000000000000bb",
			2,
		);
		expect(proposal.intent).toBe("governance:remove-owner");
		expect(proposal.origin).toBe("intent:governance:remove-owner");
		expect(proposal.safeTransaction).toEqual({ id: "remove-owner-tx" });
	});

	it("builds threshold governance proposal metadata", async () => {
		const safeInstance = { id: "safe-instance" } as any;

		const proposal = await createChangeThresholdGovernanceAction(
			safeInstance,
			3,
		);

		expect(vi.mocked(createChangeThresholdTx)).toHaveBeenCalledWith(
			safeInstance,
			3,
		);
		expect(proposal.intent).toBe("governance:change-threshold");
		expect(proposal.origin).toBe("intent:governance:change-threshold");
		expect(proposal.safeTransaction).toEqual({ id: "threshold-tx" });
	});

	it("formats governance origin labels", () => {
		expect(governanceOrigin("governance:add-owner")).toBe(
			"intent:governance:add-owner",
		);
	});
});

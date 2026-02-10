import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SafeInstance } from "../core/types";
import GuardPanel from "./GuardPanel";

function makeSafeInstanceMock(): SafeInstance {
	return {
		createDisableGuardTx: vi.fn(),
		createEnableGuardTx: vi.fn(),
	} as unknown as SafeInstance;
}

describe("GuardPanel", () => {
	it("renders deploy controls when guard is inactive", () => {
		render(
			<GuardPanel
				guard=""
				onRefresh={vi.fn().mockResolvedValue(undefined)}
				rpcUrl="http://127.0.0.1:8545"
				safeAddress="0x1234567890123456789012345678901234567890"
				safeInstance={makeSafeInstanceMock()}
				signer="0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
			/>,
		);

		expect(screen.getByRole("heading", { name: "Transaction Guard (0)" })).toBeInTheDocument();
		expect(screen.getByText("No guard enabled")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Deploy Guard" })).toBeInTheDocument();
	});

	it("renders disable controls when guard is active", () => {
		render(
			<GuardPanel
				guard="0x1234567890123456789012345678901234567890"
				onRefresh={vi.fn().mockResolvedValue(undefined)}
				rpcUrl="http://127.0.0.1:8545"
				safeAddress="0x1234567890123456789012345678901234567890"
				safeInstance={makeSafeInstanceMock()}
				signer="0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
			/>,
		);

		expect(screen.getByRole("heading", { name: "Transaction Guard (1)" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Disable Guard" })).toBeInTheDocument();
	});
});

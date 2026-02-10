import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SafeInstance } from "../core/types";
import ModulePanel from "./ModulePanel";

function makeSafeInstanceMock(): SafeInstance {
	return {
		createDisableModuleTx: vi.fn(),
		createEnableModuleTx: vi.fn(),
	} as unknown as SafeInstance;
}

describe("ModulePanel", () => {
	it("renders deploy controls when no modules are enabled", () => {
		render(
			<ModulePanel
				modules={[]}
				onRefresh={vi.fn().mockResolvedValue(undefined)}
				rpcUrl="http://127.0.0.1:8545"
				safeAddress="0x1234567890123456789012345678901234567890"
				safeInstance={makeSafeInstanceMock()}
				signer="0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
			/>,
		);

		expect(screen.getByRole("heading", { name: "Modules (0)" })).toBeInTheDocument();
		expect(screen.getByText("No modules enabled")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Deploy AllowanceModule" }),
		).toBeInTheDocument();
	});

	it("renders module rows and disable actions when modules are enabled", () => {
		render(
			<ModulePanel
				modules={["0x1234567890123456789012345678901234567890"]}
				onRefresh={vi.fn().mockResolvedValue(undefined)}
				rpcUrl="http://127.0.0.1:8545"
				safeAddress="0x1234567890123456789012345678901234567890"
				safeInstance={makeSafeInstanceMock()}
				signer="0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"
			/>,
		);

		expect(screen.getByRole("heading", { name: "Modules (1)" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Disable" })).toBeInTheDocument();
	});
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
	commandCenterChrome,
	getCommandCenterNavSections,
	ownersFixture,
} from "../../fixtures/command-center-screens";
import { CommandCenterOwners } from "./CommandCenterOwners";

describe("CommandCenterOwners", () => {
	it("submits owner additions through explicit inline input (no prompt path)", async () => {
		const onAddOwner = vi.fn(async () => {});
		const promptSpy = vi.spyOn(window, "prompt");

		render(
			<CommandCenterOwners
				{...commandCenterChrome}
				navSections={getCommandCenterNavSections("owners")}
				onAddOwner={onAddOwner}
				ownerCount={ownersFixture.length}
				owners={ownersFixture}
				threshold={2}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Owner address"), {
			target: { value: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" },
		});
		fireEvent.click(screen.getByRole("button", { name: "+ Add Owner" }));

		await waitFor(() => {
			expect(onAddOwner).toHaveBeenCalledWith(
				"0x90F79bf6EB2c4f870365E785982E1f101E93b906",
			);
		});
		expect(promptSpy).not.toHaveBeenCalled();

		promptSpy.mockRestore();
	});

	it("shows inline validation for invalid owner address input", async () => {
		const onAddOwner = vi.fn(async () => {});

		render(
			<CommandCenterOwners
				{...commandCenterChrome}
				navSections={getCommandCenterNavSections("owners")}
				onAddOwner={onAddOwner}
				ownerCount={ownersFixture.length}
				owners={ownersFixture}
				threshold={2}
			/>,
		);

		fireEvent.change(screen.getByLabelText("Owner address"), {
			target: { value: "not-an-address" },
		});
		fireEvent.click(screen.getByRole("button", { name: "+ Add Owner" }));

		await waitFor(() => {
			expect(screen.getByText("Enter a valid owner address.")).toBeInTheDocument();
		});
		expect(onAddOwner).not.toHaveBeenCalled();
	});

	it("keeps remove-owner controls available when operation handlers are enabled", () => {
		render(
			<CommandCenterOwners
				{...commandCenterChrome}
				navSections={getCommandCenterNavSections("owners")}
				onRemoveOwner={vi.fn(async () => {})}
				ownerCount={ownersFixture.length}
				owners={ownersFixture}
				threshold={2}
			/>,
		);

		const removeButtons = screen.getAllByRole("button", {
			name: /Remove owner/i,
		});
		expect(removeButtons).toHaveLength(ownersFixture.length);
		expect(removeButtons.every((button) => !button.hasAttribute("disabled"))).toBe(
			true,
		);
	});
});

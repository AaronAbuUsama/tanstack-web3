import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanelShell } from "./PanelShell";
import { SidebarShell } from "./SidebarShell";
import { StatusBarShell } from "./StatusBarShell";

describe("reference shell components", () => {
	it("renders status bar chain and wallet regions", () => {
		render(
			<StatusBarShell
				address="0xAbCdEf1234567890AbCdEf1234567890AbCdEf12"
				balanceLabel="12.50 ETH"
				chainLabel="gnosis chain"
				connected
			/>,
		);

		expect(screen.getByTestId("status-bar-chain-region")).toBeInTheDocument();
		expect(screen.getByTestId("status-bar-wallet-region")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /disconnect/i }),
		).toBeInTheDocument();
	});

	it("renders sidebar active nav affordance", () => {
		render(
			<SidebarShell
				navSections={[
					{
						id: "section-main",
						label: "Main",
						items: [
							{ id: "overview", icon: "◆", label: "Overview", active: true },
							{ id: "tx", icon: "→", label: "Transactions" },
						],
					},
				]}
				safeAddress="0x4f3e...cd5e"
				safeBalanceLabel="42.2"
				thresholdLabel="2 of 3"
			/>,
		);

		const activeLink = screen.getByRole("link", { name: /overview/i });
		expect(activeLink).toHaveClass("is-active");
		expect(activeLink).toHaveAttribute("aria-current", "page");
	});

	it("renders panel shell heading, action, and body regions", () => {
		render(
			<PanelShell
				actions={<button type="button">Refresh</button>}
				tagLabel="overview"
				title="Safe Overview"
			>
				<p>Body Content</p>
			</PanelShell>,
		);

		expect(
			screen.getByRole("heading", { name: "Safe Overview" }),
		).toBeInTheDocument();
		expect(screen.getByTestId("panel-shell-actions")).toBeInTheDocument();
		expect(screen.getByText("Body Content")).toBeInTheDocument();
	});
});

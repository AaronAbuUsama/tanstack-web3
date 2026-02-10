import type { Meta, StoryObj } from "@storybook/react-vite";
import { SidebarShell } from "./SidebarShell";

const navSections = [
	{
		id: "main",
		label: "Main",
		items: [
			{ id: "overview", icon: "◆", label: "Overview", active: true },
			{ id: "transactions", icon: "→", label: "Transactions", badge: "3" },
		],
	},
	{
		id: "security",
		label: "Security",
		items: [
			{ id: "guard", icon: "🛡", label: "Guard" },
			{ id: "modules", icon: "⚙", label: "Modules", badge: "1" },
		],
	},
];

const meta = {
	title: "Design System/Shells/SidebarShell",
	component: SidebarShell,
} satisfies Meta<typeof SidebarShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
	render: () => (
		<div style={{ minHeight: "760px" }}>
			<SidebarShell
				navSections={navSections}
				safeAddress="0x4f3edf983ac636a65a842ce7c78d9aa706d3b113"
				safeBalanceLabel="42.2"
				thresholdLabel="2 of 3"
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: .sidebar + .safe-identity + .sidebar-nav + .nav-item + .sidebar-footer",
			},
		},
	},
};

export const Mobile: Story = {
	render: () => (
		<div style={{ maxWidth: "390px", minHeight: "740px" }}>
			<SidebarShell
				navSections={navSections}
				safeAddress="0x4f3e...b113"
				safeBalanceLabel="42.2"
				thresholdLabel="2 of 3"
			/>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: sidebar shell constrained for mobile viewport checks in visual harness",
			},
		},
	},
};

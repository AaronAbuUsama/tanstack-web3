import type { Meta, StoryObj } from "@storybook/react-vite";
import { commandCenterSidebarSections } from "../fixtures/command-center";
import { SidebarNav } from "./SidebarNav";

const meta = {
	title: "Design System/Patterns/SidebarNav",
	component: SidebarNav,
} satisfies Meta<typeof SidebarNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
	render: () => (
		<div style={{ minHeight: "760px" }}>
			<SidebarNav
				navSections={commandCenterSidebarSections}
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
					"Reference map: sidebar block from layout-1 command-center (identity, nav sections, footer action).",
			},
		},
	},
};

export const Mobile: Story = {
	render: () => (
		<div style={{ maxWidth: "390px", minHeight: "760px" }}>
			<SidebarNav
				navSections={commandCenterSidebarSections}
				safeAddress="0x4f3e...b113"
				safeBalanceLabel="42.2"
				thresholdLabel="2 of 3"
			/>
		</div>
	),
};

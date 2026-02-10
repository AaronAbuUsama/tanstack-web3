import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	commandCenterActivity,
	commandCenterSidebarSections,
	commandCenterStats,
} from "../../fixtures/command-center";
import { CommandCenterOverview } from "./CommandCenterOverview";

const meta = {
	title: "Design System/Compositions/Command Center/CommandCenterOverview",
	component: CommandCenterOverview,
} satisfies Meta<typeof CommandCenterOverview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FullLayout: Story = {
	args: {
		activity: commandCenterActivity,
		address: "0xf39F...2266",
		chainLabel: "gnosis chain",
		guardActive: true,
		guardDescription: "Daily limit is 5 ETH and currently at 35% utilization.",
		guardTitle: "Daily spending guard active",
		navSections: commandCenterSidebarSections,
		safeAddress: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113",
		safeBalanceLabel: "42.2",
		stats: commandCenterStats,
		statusBalanceLabel: "12.5 ETH",
		thresholdLabel: "2 of 3",
		pendingPreview: {
			confirmations: 1,
			idLabel: "#12",
			state: "pending",
			threshold: 2,
			toLabel: "0x6ecb...1dcf",
			valueLabel: "0.75 ETH",
		},
	},
	parameters: {
		docs: {
			description: {
				story:
					"Reference composition map: status-bar + sidebar + stat cards + activity feed + pending row from layout-1.",
			},
		},
	},
};

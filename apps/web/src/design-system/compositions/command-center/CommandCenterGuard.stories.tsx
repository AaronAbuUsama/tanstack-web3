import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	commandCenterChrome,
	getCommandCenterNavSections,
} from "../../fixtures/command-center-screens";
import { CommandCenterGuard } from "./CommandCenterGuard";

const meta = {
	title: "Design System/Compositions/Command Center/GuardScreen",
	component: CommandCenterGuard,
} satisfies Meta<typeof CommandCenterGuard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {
	args: {
		...commandCenterChrome,
		guardAddress: "0xGrd1...2345",
		guardName: "SpendingLimitGuard",
		limitSummary: {
			currentLabel: "0.15 ETH",
			maxLabel: "0.5 ETH",
			utilizationPercent: 30,
		},
		navSections: getCommandCenterNavSections("guard"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: section-guard in layout-1 (active guard banner, limit meter, how-it-works and change-limit cards).",
			},
		},
	},
};

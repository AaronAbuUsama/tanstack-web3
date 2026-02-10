import type { Meta, StoryObj } from "@storybook/react-vite";
import { GuardStatusBanner } from "./GuardStatusBanner";

const meta = {
	title: "Design System/Domains/Safe/GuardStatusBanner",
	component: GuardStatusBanner,
} satisfies Meta<typeof GuardStatusBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {
	args: {
		active: true,
		title: "Daily spending guard active",
		description: "Daily limit is 5 ETH and currently at 35% utilization.",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: .guard-status-banner.active with shield icon and action controls.",
			},
		},
	},
};

export const Inactive: Story = {
	args: {
		active: false,
		title: "Guard is disabled",
		description: "No daily limit checks are enforced for outgoing transfers.",
	},
};

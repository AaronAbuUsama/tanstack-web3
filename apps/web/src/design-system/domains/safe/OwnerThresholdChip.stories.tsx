import type { Meta, StoryObj } from "@storybook/react-vite";
import { OwnerThresholdChip } from "./OwnerThresholdChip";

const meta = {
	title: "Design System/Domains/Safe/OwnerThresholdChip",
	component: OwnerThresholdChip,
} satisfies Meta<typeof OwnerThresholdChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OneOfOne: Story = {
	args: {
		ownersLabel: "Threshold",
		valueLabel: "1 of 1",
	},
};

export const TwoOfThree: Story = {
	args: {
		ownersLabel: "Threshold",
		valueLabel: "2 of 3",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: threshold chip language from .threshold-badge and threshold controls.",
			},
		},
	},
};

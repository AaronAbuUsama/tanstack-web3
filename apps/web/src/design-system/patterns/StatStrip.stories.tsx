import type { Meta, StoryObj } from "@storybook/react-vite";
import { commandCenterStats } from "../fixtures/command-center";
import { StatStrip } from "./StatStrip";

const meta = {
	title: "Design System/Patterns/StatStrip",
	component: StatStrip,
} satisfies Meta<typeof StatStrip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
	render: () => (
		<div style={{ padding: "var(--ds-space-24)" }}>
			<StatStrip items={commandCenterStats} />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: .overview-grid + .stat-card (+ highlighted variants).",
			},
		},
	},
};

export const Mobile: Story = {
	render: () => (
		<div style={{ maxWidth: "420px", padding: "var(--ds-space-16)" }}>
			<StatStrip items={commandCenterStats} />
		</div>
	),
};

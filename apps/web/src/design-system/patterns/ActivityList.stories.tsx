import type { Meta, StoryObj } from "@storybook/react-vite";
import { commandCenterActivity } from "../fixtures/command-center";
import { ActivityList } from "./ActivityList";

const meta = {
	title: "Design System/Patterns/ActivityList",
	component: ActivityList,
} satisfies Meta<typeof ActivityList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
	render: () => (
		<div style={{ maxWidth: "860px", padding: "var(--ds-space-24)" }}>
			<ActivityList entries={commandCenterActivity} />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: activity feed list item block (.activity-item + icon + title/meta/amount).",
			},
		},
	},
};

export const Mobile: Story = {
	render: () => (
		<div style={{ maxWidth: "420px", padding: "var(--ds-space-16)" }}>
			<ActivityList entries={commandCenterActivity} />
		</div>
	),
};

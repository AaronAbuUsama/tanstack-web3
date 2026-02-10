import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta = {
	title: "Design System/Primitives/Badge",
	component: Badge,
	args: {
		children: "status",
	},
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ToneMatrix: Story = {
	render: () => (
		<div
			style={{
				display: "flex",
				flexWrap: "wrap",
				gap: "var(--ds-space-3)",
				padding: "var(--ds-space-6)",
			}}
		>
			<Badge tone="neutral">neutral</Badge>
			<Badge tone="accent">accent</Badge>
			<Badge tone="success">success</Badge>
			<Badge tone="warning">warning</Badge>
			<Badge tone="danger">danger</Badge>
		</div>
	),
};

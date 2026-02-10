import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";

const meta = {
	title: "Design System/Primitives/Badge",
	component: Badge,
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ReferenceVariants: Story = {
	render: () => (
		<div
			style={{
				display: "flex",
				flexWrap: "wrap",
				gap: "var(--ds-space-12)",
				padding: "var(--ds-space-24)",
			}}
		>
			<Badge variant="header">overview</Badge>
			<Badge variant="nav">3</Badge>
			<Badge variant="inverse">2 of 3</Badge>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: .header-tag, .nav-badge, .threshold-badge / inverse chip pattern",
			},
		},
	},
};

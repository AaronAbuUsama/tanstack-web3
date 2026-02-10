import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
	title: "Design System/Primitives/Button",
	component: Button,
} satisfies Meta<typeof Button>;

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
			<Button variant="primary">Deploy Safe</Button>
			<Button variant="success">Execute</Button>
			<Button variant="danger">Remove Owner</Button>
			<Button variant="outline">Edit</Button>
			<Button variant="ghost">Dismiss</Button>
			<Button disabled>Disabled</Button>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: .btn + .btn-primary + .btn-danger + .btn-success + .btn-outline + .btn-ghost",
			},
		},
	},
};

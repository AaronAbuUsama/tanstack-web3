import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./Input";

const meta = {
	title: "Design System/Primitives/Input",
	component: Input,
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ReferenceField: Story = {
	render: () => (
		<div
			style={{
				display: "grid",
				gap: "var(--ds-space-16)",
				maxWidth: 520,
				padding: "var(--ds-space-24)",
			}}
		>
			<Input label="Recipient address" placeholder="0x..." />
			<Input label="Amount" placeholder="0.0" />
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: .form-group label + input/textarea/select mono form controls",
			},
		},
	},
};

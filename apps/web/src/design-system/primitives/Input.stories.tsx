import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./Input";

const meta = {
	title: "Design System/Primitives/Input",
	component: Input,
	args: {
		label: "Safe address",
		placeholder: "0x...",
		hint: "Paste owner or target address",
	},
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StateMatrix: Story = {
	render: () => (
		<div
			style={{
				display: "grid",
				gap: "var(--ds-space-4)",
				maxWidth: 520,
				padding: "var(--ds-space-6)",
			}}
		>
			<Input label="Default" placeholder="0x..." hint="Ready" />
			<Input
				forceFocus
				label="Focused"
				placeholder="0x..."
				hint="Focus ring enabled"
			/>
			<Input
				label="Error"
				placeholder="0x..."
				error="Must be a checksummed address"
				defaultValue="invalid-value"
			/>
			<Input
				label="Disabled"
				placeholder="0x..."
				disabled
				defaultValue="0x1234...abcd"
			/>
		</div>
	),
};

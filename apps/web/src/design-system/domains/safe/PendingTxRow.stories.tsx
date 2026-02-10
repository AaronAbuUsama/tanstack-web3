import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { PendingTxRow } from "./PendingTxRow";

const meta = {
	title: "Design System/Domains/Safe/PendingTxRow",
	component: PendingTxRow,
} satisfies Meta<typeof PendingTxRow>;

export default meta;

type Story = StoryObj<typeof meta>;

function frame(children: ReactNode) {
	return (
		<div
			style={{
				background: "var(--ds-color-white)",
				border: "var(--ds-border-regular)",
				boxShadow: "var(--ds-shadow-md)",
				maxWidth: "900px",
				padding: 0,
			}}
		>
			{children}
		</div>
	);
}

export const Pending: Story = {
	render: () =>
		frame(
			<PendingTxRow
				confirmations={1}
				idLabel="#12"
				state="pending"
				threshold={2}
				toLabel="0x6ecb...1dcf"
				valueLabel="0.75 ETH"
			/>,
		),
};

export const Ready: Story = {
	render: () =>
		frame(
			<PendingTxRow
				confirmations={2}
				idLabel="#13"
				state="ready"
				threshold={2}
				toLabel="0x4f3e...b113"
				valueLabel="1.00 ETH"
			/>,
		),
};

export const Executed: Story = {
	render: () =>
		frame(
			<PendingTxRow
				confirmations={2}
				idLabel="#14"
				state="executed"
				threshold={2}
				toLabel="0x91d1...44ac"
				valueLabel="0.20 ETH"
			/>,
		),
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: .pending-tx row with signature dot progress and state affordances.",
			},
		},
	},
};

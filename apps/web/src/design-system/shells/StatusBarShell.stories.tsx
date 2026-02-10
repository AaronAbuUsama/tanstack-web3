import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusBarShell } from "./StatusBarShell";

const meta = {
	title: "Design System/Shells/StatusBarShell",
	component: StatusBarShell,
} satisfies Meta<typeof StatusBarShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Connected: Story = {
	render: () => (
		<StatusBarShell
			address="0xAbCd...Ef12"
			balanceLabel="12.50 ETH"
			chainLabel="gnosis chain"
			connected
		/>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: .status-bar + .chain-badge + .wallet-info + .balance-pill + .disconnect-btn",
			},
		},
	},
};

export const Disconnected: Story = {
	render: () => <StatusBarShell chainLabel="gnosis chain" connected={false} />,
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: status bar shell with disconnected wallet state messaging",
			},
		},
	},
};

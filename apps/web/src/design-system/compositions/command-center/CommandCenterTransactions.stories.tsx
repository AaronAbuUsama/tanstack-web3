import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	commandCenterChrome,
	getCommandCenterNavSections,
	transactionsHistoryEntries,
	transactionsPendingRows,
} from "../../fixtures/command-center-screens";
import { CommandCenterTransactions } from "./CommandCenterTransactions";

const meta = {
	title: "Design System/Compositions/Command Center/TransactionsScreen",
	component: CommandCenterTransactions,
} satisfies Meta<typeof CommandCenterTransactions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...commandCenterChrome,
		navSections: getCommandCenterNavSections("transactions"),
		historyEntries: transactionsHistoryEntries,
		pendingTransactions: transactionsPendingRows,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: section-transactions in layout-1 (tabs, builder form, pending queue, history feed).",
			},
		},
	},
};

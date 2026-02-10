import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	commandCenterChrome,
	devAccountsFixture,
	getCommandCenterNavSections,
	runtimePolicyFixture,
} from "../../fixtures/command-center-screens";
import { CommandCenterSetupRuntime } from "./CommandCenterSetupRuntime";

const meta = {
	title: "Design System/Compositions/Command Center/SetupRuntimeScreen",
	component: CommandCenterSetupRuntime,
} satisfies Meta<typeof CommandCenterSetupRuntime>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...commandCenterChrome,
		activeChainLabel: "Chiado (Anvil Fork)",
		activeDevIndex: 1,
		devAccounts: devAccountsFixture,
		navSections: getCommandCenterNavSections("overview"),
		policy: runtimePolicyFixture,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Runtime and setup screen for dev flows: account switcher, chain selector, and runtime policy visibility alongside Safe setup controls.",
			},
		},
	},
};

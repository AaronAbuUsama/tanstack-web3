import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	commandCenterChrome,
	getCommandCenterNavSections,
	moduleDelegatesFixture,
} from "../../fixtures/command-center-screens";
import { CommandCenterModules } from "./CommandCenterModules";

const meta = {
	title: "Design System/Compositions/Command Center/ModulesScreen",
	component: CommandCenterModules,
} satisfies Meta<typeof CommandCenterModules>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {
	args: {
		...commandCenterChrome,
		delegates: moduleDelegatesFixture,
		moduleAddress: "0xMod1...6789",
		moduleName: "AllowanceModule",
		navSections: getCommandCenterNavSections("modules"),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: section-module in layout-1 (module banner, delegate cards, allowance form, delegate execute panel).",
			},
		},
	},
};

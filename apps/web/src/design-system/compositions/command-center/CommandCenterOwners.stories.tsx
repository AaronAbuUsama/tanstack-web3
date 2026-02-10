import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	commandCenterChrome,
	getCommandCenterNavSections,
	ownersFixture,
} from "../../fixtures/command-center-screens";
import { CommandCenterOwners } from "./CommandCenterOwners";

const meta = {
	title: "Design System/Compositions/Command Center/OwnersScreen",
	component: CommandCenterOwners,
} satisfies Meta<typeof CommandCenterOwners>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		...commandCenterChrome,
		navSections: getCommandCenterNavSections("owners"),
		ownerCount: ownersFixture.length,
		owners: ownersFixture,
		threshold: 2,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Reference map: section-owners in layout-1 (threshold selector + owners list with add/remove affordances).",
			},
		},
	},
};

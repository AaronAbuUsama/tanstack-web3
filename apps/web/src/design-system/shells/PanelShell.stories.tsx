import type { Meta, StoryObj } from "@storybook/react-vite";
import { PanelShell } from "./PanelShell";

const meta = {
	title: "Design System/Shells/PanelShell",
	component: PanelShell,
} satisfies Meta<typeof PanelShell>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div style={{ maxWidth: "780px", padding: "var(--ds-space-24)" }}>
			<PanelShell
				actions={<button type="button">Refresh</button>}
				tagLabel="overview"
				title="Safe Overview"
			>
				<div style={{ display: "grid", gap: "var(--ds-space-12)" }}>
					<p style={{ fontSize: "var(--ds-type-14)", margin: 0 }}>
						Reference map: .card + .card-header + .header-tag + .card-body.
					</p>
					<p style={{ fontSize: "var(--ds-type-13)", margin: 0 }}>
						This panel shell is the base container for summary, queue, and owner
						sections.
					</p>
				</div>
			</PanelShell>
		</div>
	),
};

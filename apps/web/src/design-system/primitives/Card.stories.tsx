import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";
import { Card } from "./Card";

const meta = {
	title: "Design System/Primitives/Card",
	component: Card,
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<div style={{ maxWidth: 560, padding: "var(--ds-space-6)" }}>
			<Card
				eyebrow="Queue"
				title="Pending approvals"
				actions={
					<Button size="sm" variant="secondary">
						Refresh
					</Button>
				}
			>
				<p className="ds-type-body">
					Three transactions are waiting for second-owner confirmations.
				</p>
			</Card>
		</div>
	),
};

export const ToneMatrix: Story = {
	render: () => (
		<div
			style={{
				display: "grid",
				gap: "var(--ds-space-4)",
				maxWidth: 720,
				padding: "var(--ds-space-6)",
			}}
		>
			<Card title="Default tone">
				<p className="ds-type-body">
					Neutral card shell for most dashboard panels.
				</p>
			</Card>
			<Card title="Accent tone" tone="accent">
				<p className="ds-type-body">
					Highlight a priority metric or callout card.
				</p>
			</Card>
			<Card title="Muted tone" tone="muted">
				<p className="ds-type-body">
					Use for low-emphasis informational containers.
				</p>
			</Card>
		</div>
	),
};

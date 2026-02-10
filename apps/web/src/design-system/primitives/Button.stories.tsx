import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
	title: "Design System/Primitives/Button",
	component: Button,
	args: {
		children: "Execute",
	},
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

function sectionStyle() {
	return {
		display: "grid",
		gap: "var(--ds-space-3)",
	} as const;
}

export const VariantMatrix: Story = {
	render: () => (
		<div
			style={{
				display: "grid",
				gap: "var(--ds-space-5)",
				padding: "var(--ds-space-6)",
			}}
		>
			<section style={sectionStyle()}>
				<p className="ds-type-caption">Variants</p>
				<div
					style={{
						display: "flex",
						flexWrap: "wrap",
						gap: "var(--ds-space-3)",
					}}
				>
					<Button variant="primary">Primary</Button>
					<Button variant="secondary">Secondary</Button>
					<Button variant="ghost">Ghost</Button>
					<Button variant="danger">Danger</Button>
				</div>
			</section>

			<section style={sectionStyle()}>
				<p className="ds-type-caption">Sizes</p>
				<div
					style={{
						alignItems: "center",
						display: "flex",
						flexWrap: "wrap",
						gap: "var(--ds-space-3)",
					}}
				>
					<Button size="sm">Small</Button>
					<Button size="md">Medium</Button>
					<Button size="lg">Large</Button>
				</div>
			</section>
		</div>
	),
};

export const States: Story = {
	render: () => (
		<div
			style={{
				display: "flex",
				flexWrap: "wrap",
				gap: "var(--ds-space-3)",
				padding: "var(--ds-space-6)",
			}}
		>
			<Button>Default</Button>
			<Button disabled>Disabled</Button>
			<Button loading>Submitting</Button>
			<Button variant="secondary">Hover target</Button>
		</div>
	),
};

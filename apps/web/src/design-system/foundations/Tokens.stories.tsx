import type { Meta, StoryObj } from "@storybook/react-vite";

const colorTokens = [
	"--ds-color-bg-canvas",
	"--ds-color-bg-surface",
	"--ds-color-bg-elevated",
	"--ds-color-fg-default",
	"--ds-color-fg-muted",
	"--ds-color-border-subtle",
	"--ds-color-border-strong",
	"--ds-color-accent",
	"--ds-color-accent-strong",
	"--ds-color-success",
	"--ds-color-warning",
	"--ds-color-danger",
];

const spacingTokens = [
	"--ds-space-0",
	"--ds-space-1",
	"--ds-space-2",
	"--ds-space-3",
	"--ds-space-4",
	"--ds-space-5",
	"--ds-space-6",
	"--ds-space-8",
	"--ds-space-10",
	"--ds-space-12",
	"--ds-space-16",
];

const typographyScale = [
	{ className: "ds-type-display-xl", label: "Display XL" },
	{ className: "ds-type-display-lg", label: "Display LG" },
	{ className: "ds-type-title", label: "Title" },
	{ className: "ds-type-body-lg", label: "Body LG" },
	{ className: "ds-type-body", label: "Body" },
	{ className: "ds-type-label", label: "Label" },
	{ className: "ds-type-caption", label: "Caption" },
];

const meta = {
	title: "Design System/Foundations/Tokens",
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function sectionGrid() {
	return {
		display: "grid",
		gap: "var(--ds-space-4)",
	} as const;
}

export const Reference: Story = {
	render: () => (
		<div
			style={{
				background: "var(--ds-color-bg-canvas)",
				color: "var(--ds-color-fg-default)",
				display: "grid",
				gap: "var(--ds-space-8)",
				maxWidth: 980,
				minHeight: "100vh",
				padding: "var(--ds-space-8)",
			}}
		>
			<section style={sectionGrid()}>
				<h2 className="ds-type-title">Color Tokens</h2>
				<div
					style={{
						display: "grid",
						gap: "var(--ds-space-3)",
						gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
					}}
				>
					{colorTokens.map((token) => (
						<div
							key={token}
							style={{
								background: "var(--ds-color-bg-surface)",
								border:
									"var(--ds-border-1) solid var(--ds-color-border-subtle)",
								borderRadius: "var(--ds-radius-md)",
								boxShadow: "var(--ds-shadow-xs)",
								display: "grid",
								gap: "var(--ds-space-2)",
								padding: "var(--ds-space-3)",
							}}
						>
							<div
								aria-hidden
								style={{
									background: `var(${token})`,
									border:
										"var(--ds-border-1) solid var(--ds-color-border-subtle)",
									borderRadius: "var(--ds-radius-sm)",
									height: 56,
								}}
							/>
							<p className="ds-type-caption">{token}</p>
						</div>
					))}
				</div>
			</section>

			<section style={sectionGrid()}>
				<h2 className="ds-type-title">Spacing Tokens</h2>
				<div style={{ display: "grid", gap: "var(--ds-space-3)" }}>
					{spacingTokens.map((token) => (
						<div
							key={token}
							style={{
								alignItems: "center",
								display: "grid",
								gap: "var(--ds-space-3)",
								gridTemplateColumns: "200px 1fr",
							}}
						>
							<p className="ds-type-caption">{token}</p>
							<div
								aria-hidden
								style={{
									background: "var(--ds-color-accent)",
									borderRadius: "var(--ds-radius-pill)",
									height: 10,
									width: `max(var(${token}), 2px)`,
								}}
							/>
						</div>
					))}
				</div>
			</section>

			<section style={sectionGrid()}>
				<h2 className="ds-type-title">Typography Tokens</h2>
				<div style={{ display: "grid", gap: "var(--ds-space-4)" }}>
					{typographyScale.map((item) => (
						<div
							key={item.className}
							style={{
								borderBottom:
									"var(--ds-border-1) solid var(--ds-color-border-subtle)",
								display: "grid",
								gap: "var(--ds-space-2)",
								paddingBottom: "var(--ds-space-4)",
							}}
						>
							<p className="ds-type-caption">{item.className}</p>
							<p className={item.className}>
								{item.label}: Safe command-center typography should remain
								readable at all thresholds.
							</p>
						</div>
					))}
				</div>
			</section>
		</div>
	),
};

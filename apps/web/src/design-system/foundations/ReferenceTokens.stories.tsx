import type { Meta, StoryObj } from "@storybook/react-vite";

const paletteTokens = [
	"--ds-color-black",
	"--ds-color-white",
	"--ds-color-yellow",
	"--ds-color-pink",
	"--ds-color-blue",
	"--ds-color-purple",
	"--ds-color-orange",
	"--ds-color-green",
	"--ds-color-red",
	"--ds-color-lavender",
	"--ds-color-cream",
	"--ds-color-sky",
];

const borderAndShadow = [
	{
		label: "Regular border (3px)",
		value: "var(--ds-border-regular)",
		reference: ".card, .btn, .form-group input",
	},
	{
		label: "Thick border (4px)",
		value: "var(--ds-border-thick)",
		reference: ".status-bar border-bottom, .sidebar border-right",
	},
	{
		label: "Small shadow",
		value: "var(--ds-shadow-sm)",
		reference: ".btn-primary, .fund-btn, .nav-icon active",
	},
	{
		label: "Main shadow",
		value: "var(--ds-shadow-md)",
		reference: ".card, .stat-card, .delegate-card",
	},
];

const typographyScale = [
	{ token: "--ds-type-11", usage: "meta labels: .label, .form-group label" },
	{ token: "--ds-type-13", usage: "buttons and control text" },
	{ token: "--ds-type-14", usage: "addresses and nav items" },
	{ token: "--ds-type-28", usage: "page title" },
	{ token: "--ds-type-32", usage: "stat value" },
	{ token: "--ds-type-48", usage: "limit-display value" },
];

const meta = {
	title: "Design System/Foundations/Reference Tokens",
	parameters: {
		layout: "fullscreen",
	},
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function grid(columns = "repeat(auto-fit, minmax(200px, 1fr))") {
	return {
		display: "grid",
		gap: "var(--ds-space-12)",
		gridTemplateColumns: columns,
	} as const;
}

const frameStyle = {
	background: "var(--ds-color-cream)",
	color: "var(--ds-color-black)",
	display: "grid",
	fontFamily: "var(--ds-font-primary)",
	gap: "var(--ds-space-24)",
	minHeight: "100vh",
	padding: "var(--ds-space-24)",
} as const;

export const Overview: Story = {
	render: () => (
		<div style={frameStyle}>
			<section style={{ display: "grid", gap: "var(--ds-space-8)" }}>
				<h1 style={{ fontSize: "var(--ds-type-28)", margin: 0 }}>
					Reference Token Contract
				</h1>
				<p style={{ fontSize: "var(--ds-type-14)", margin: 0, maxWidth: 860 }}>
					All tokens below are mapped from
					<code> mockups/layout-1-command-center.html</code>. This story is the
					traceability gate for Task 2.
				</p>
			</section>

			<section style={{ display: "grid", gap: "var(--ds-space-10)" }}>
				<h2 style={{ fontSize: "var(--ds-type-18)", margin: 0 }}>
					Palette Mapping
				</h2>
				<div style={grid()}>
					{paletteTokens.map((token) => (
						<div
							key={token}
							style={{
								background: "var(--ds-color-white)",
								border: "var(--ds-border-regular)",
								boxShadow: "var(--ds-shadow-sm)",
								display: "grid",
								gap: "var(--ds-space-8)",
								padding: "var(--ds-space-12)",
							}}
						>
							<div
								aria-hidden
								style={{
									background: `var(${token})`,
									border: "var(--ds-border-inline)",
									height: 56,
								}}
							/>
							<p
								style={{
									fontFamily: "var(--ds-font-mono)",
									fontSize: "var(--ds-type-12)",
									margin: 0,
								}}
							>
								{token}
							</p>
						</div>
					))}
				</div>
			</section>

			<section style={{ display: "grid", gap: "var(--ds-space-10)" }}>
				<h2 style={{ fontSize: "var(--ds-type-18)", margin: 0 }}>
					Border and Shadow Mapping
				</h2>
				<div style={grid("repeat(auto-fit, minmax(280px, 1fr))")}>
					{borderAndShadow.map((item) => (
						<div
							key={item.label}
							style={{
								background: "var(--ds-color-white)",
								border: "var(--ds-border-regular)",
								boxShadow: "var(--ds-shadow-sm)",
								display: "grid",
								gap: "var(--ds-space-8)",
								padding: "var(--ds-space-12)",
							}}
						>
							<p
								style={{
									fontSize: "var(--ds-type-14)",
									fontWeight: "var(--ds-font-weight-bold)",
									margin: 0,
								}}
							>
								{item.label}
							</p>
							<div
								aria-hidden
								style={{
									background: "var(--ds-color-yellow)",
									border:
										item.label === "Thick border (4px)"
											? "var(--ds-border-thick)"
											: "var(--ds-border-regular)",
									boxShadow:
										item.label === "Main shadow"
											? "var(--ds-shadow-md)"
											: item.label === "Small shadow"
												? "var(--ds-shadow-sm)"
												: "none",
									height: 52,
								}}
							/>
							<p
								style={{
									fontFamily: "var(--ds-font-mono)",
									fontSize: "var(--ds-type-12)",
									margin: 0,
								}}
							>
								Token: {item.value}
							</p>
							<p
								style={{
									fontSize: "var(--ds-type-11)",
									margin: 0,
									opacity: 0.75,
								}}
							>
								Reference map: {item.reference}
							</p>
						</div>
					))}
				</div>
			</section>

			<section style={{ display: "grid", gap: "var(--ds-space-10)" }}>
				<h2 style={{ fontSize: "var(--ds-type-18)", margin: 0 }}>
					Typography Mapping
				</h2>
				<div style={{ display: "grid", gap: "var(--ds-space-8)" }}>
					{typographyScale.map((row) => (
						<div
							key={row.token}
							style={{
								background: "var(--ds-color-white)",
								border: "var(--ds-border-regular)",
								boxShadow: "var(--ds-shadow-sm)",
								display: "grid",
								gap: "var(--ds-space-6)",
								padding: "var(--ds-space-12)",
							}}
						>
							<p
								style={{
									fontFamily: "var(--ds-font-mono)",
									fontSize: "var(--ds-type-11)",
									margin: 0,
								}}
							>
								{row.token}
							</p>
							<p
								style={{
									fontFamily: "var(--ds-font-primary)",
									fontSize: `var(${row.token})`,
									fontWeight: "var(--ds-font-weight-bold)",
									lineHeight: 1.2,
									margin: 0,
								}}
							>
								Command-center reference sample text
							</p>
							<p style={{ fontSize: "var(--ds-type-12)", margin: 0 }}>
								Reference map: {row.usage}
							</p>
						</div>
					))}
				</div>
			</section>
		</div>
	),
};

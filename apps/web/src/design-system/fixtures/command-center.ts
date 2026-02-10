import type { SidebarNavSection } from "../shells";

export interface StatStripItem {
	backgroundToken?: string;
	id: string;
	label: string;
	subLabel: string;
	value: string;
}

export interface ActivityListItem {
	amountLabel: string;
	direction: "incoming" | "outgoing" | "config";
	id: string;
	meta: string;
	title: string;
}

export const commandCenterSidebarSections: SidebarNavSection[] = [
	{
		id: "main",
		label: "Main",
		items: [
			{
				id: "overview",
				icon: "◆",
				label: "Overview",
				active: true,
				href: "#overview",
			},
			{
				id: "transactions",
				icon: "→",
				label: "Transactions",
				badge: "3",
				href: "#transactions",
			},
			{ id: "owners", icon: "👥", label: "Owners", href: "#owners" },
		],
	},
	{
		id: "security",
		label: "Security",
		items: [
			{ id: "guard", icon: "🛡", label: "Guard", href: "#guard" },
			{
				id: "modules",
				icon: "⚙",
				label: "Modules",
				badge: "1",
				href: "#modules",
			},
		],
	},
];

export const commandCenterStats: StatStripItem[] = [
	{
		id: "pending",
		label: "pending tx",
		value: "3",
		subLabel: "awaiting signatures",
		backgroundToken: "var(--ds-color-white)",
	},
	{
		id: "guard-status",
		label: "guard",
		value: "active",
		subLabel: "daily limit enabled",
		backgroundToken: "var(--ds-color-sky)",
	},
	{
		id: "module-count",
		label: "modules",
		value: "1",
		subLabel: "allowance module live",
		backgroundToken: "var(--ds-color-lavender)",
	},
];

export const commandCenterActivity: ActivityListItem[] = [
	{
		id: "a1",
		direction: "outgoing",
		title: "Treasury transfer proposed",
		meta: "2 minutes ago • 0x4f3e...b113",
		amountLabel: "-0.75 ETH",
	},
	{
		id: "a2",
		direction: "incoming",
		title: "Safe funded from owner wallet",
		meta: "18 minutes ago • 0x6ecb...1dcf",
		amountLabel: "+2.00 ETH",
	},
	{
		id: "a3",
		direction: "config",
		title: "Threshold updated to 2 of 3",
		meta: "1 hour ago • governance event",
		amountLabel: "config",
	},
];

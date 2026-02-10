import type { PendingTxRowProps } from "../domains/safe";
import type { SidebarNavSection } from "../shells";
import {
	commandCenterActivity,
	commandCenterSidebarSections,
} from "./command-center";

export interface CommandCenterChromeFixture {
	address: string;
	chainLabel: string;
	safeAddress: string;
	safeBalanceLabel: string;
	statusBalanceLabel: string;
	thresholdLabel: string;
}

export const commandCenterChrome: CommandCenterChromeFixture = {
	address: "0xf39F...2266",
	chainLabel: "gnosis chain",
	safeAddress: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113",
	safeBalanceLabel: "42.2",
	statusBalanceLabel: "12.5 ETH",
	thresholdLabel: "2 of 3",
};

export function getCommandCenterNavSections(
	activeItemId: string,
): SidebarNavSection[] {
	return commandCenterSidebarSections.map((section) => ({
		...section,
		items: section.items.map((item) => ({
			...item,
			active: item.id === activeItemId,
		})),
	}));
}

export const transactionsPendingRows: PendingTxRowProps[] = [
	{
		confirmations: 2,
		idLabel: "#12",
		state: "ready",
		threshold: 3,
		toLabel: "0x6ecb...1dcf",
		valueLabel: "0.75 ETH",
	},
	{
		confirmations: 1,
		idLabel: "#13",
		state: "pending",
		threshold: 3,
		toLabel: "0xfa32...8bc1",
		valueLabel: "0.25 ETH",
	},
];

export const transactionsHistoryEntries = [
	{
		id: "tx-1",
		direction: "outgoing" as const,
		title: "Transfer proposed to treasury ops",
		meta: "5 minutes ago • 0xf39f...2266",
		amountLabel: "-0.75 ETH",
	},
	{
		id: "tx-2",
		direction: "config" as const,
		title: "Threshold set to 2 of 3",
		meta: "40 minutes ago • governance event",
		amountLabel: "config",
	},
	{
		id: "tx-3",
		direction: "incoming" as const,
		title: "Owner funded safe",
		meta: "2 hours ago • 0x6ecb...1dcf",
		amountLabel: "+2.00 ETH",
	},
];

export interface OwnerFixture {
	address: string;
	id: string;
	isCurrentSigner?: boolean;
}

export const ownersFixture: OwnerFixture[] = [
	{
		id: "owner-1",
		address: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
		isCurrentSigner: true,
	},
	{ id: "owner-2", address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8" },
	{ id: "owner-3", address: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc" },
];

export interface DelegateFixture {
	address: string;
	id: string;
	resetLabel: string;
	resetPeriod: string;
	usedLabel: string;
	utilizationPercent: number;
}

export const moduleDelegatesFixture: DelegateFixture[] = [
	{
		id: "delegate-1",
		address: "0xBe22...9aF7",
		usedLabel: "0.12 / 0.20 ETH",
		utilizationPercent: 60,
		resetLabel: "Resets in 18h 24m",
		resetPeriod: "daily",
	},
	{
		id: "delegate-2",
		address: "0x4521...cDe3",
		usedLabel: "0.05 / 0.50 ETH",
		utilizationPercent: 10,
		resetLabel: "Resets in 5d 12h",
		resetPeriod: "weekly",
	},
];

export interface DevAccountFixture {
	address: string;
	balanceLabel: string;
	id: string;
	index: number;
}

export const devAccountsFixture: DevAccountFixture[] = [
	{
		id: "dev-account-0",
		index: 0,
		address: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
		balanceLabel: "10,000 ETH",
	},
	{
		id: "dev-account-1",
		index: 1,
		address: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
		balanceLabel: "10,000 ETH",
	},
	{
		id: "dev-account-2",
		index: 2,
		address: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
		balanceLabel: "10,000 ETH",
	},
];

export const runtimePolicyFixture = {
	appContext: "standalone" as const,
	signerProvider: "dev-mnemonic-account" as const,
	txSubmissionPath: "protocol-kit-direct" as const,
};

export const overviewActivityFixture = commandCenterActivity;

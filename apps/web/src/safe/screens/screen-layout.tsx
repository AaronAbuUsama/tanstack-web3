import type { ReactNode } from "react";
import { buildSafeScreenSearch } from "./screen-state";
import type { SafeScreenId } from "./types";

const NAV_ITEM_BY_SCREEN: Record<
	SafeScreenId,
	"overview" | "transactions" | "owners" | "guard" | "modules"
> = {
	overview: "overview",
	transactions: "transactions",
	owners: "owners",
	guard: "guard",
	modules: "modules",
	"setup-runtime": "overview",
};

const SCREEN_BY_NAV_ITEM = {
	overview: "overview",
	transactions: "transactions",
	owners: "owners",
	guard: "guard",
	modules: "modules",
} as const satisfies Record<
	"overview" | "transactions" | "owners" | "guard" | "modules",
	Exclude<SafeScreenId, "setup-runtime">
>;

export function navItemForScreen(
	screen: SafeScreenId,
): "overview" | "transactions" | "owners" | "guard" | "modules" {
	return NAV_ITEM_BY_SCREEN[screen];
}

export function safeHrefForNavItem(itemId: string): string {
	const screen =
		SCREEN_BY_NAV_ITEM[itemId as keyof typeof SCREEN_BY_NAV_ITEM] ?? null;
	if (!screen) return "/safe";
	const search = buildSafeScreenSearch(screen);
	return search.screen ? `/safe?screen=${search.screen}` : "/safe";
}

interface SafeScreenSectionProps {
	activeScreen: SafeScreenId;
	children: ReactNode;
	screen: SafeScreenId;
}

export function SafeScreenSection({
	activeScreen,
	children,
	screen,
}: SafeScreenSectionProps) {
	if (activeScreen !== screen) return null;
	return <>{children}</>;
}

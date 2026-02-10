import type { ReactNode } from "react";
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

export function navItemForScreen(
	screen: SafeScreenId,
): "overview" | "transactions" | "owners" | "guard" | "modules" {
	return NAV_ITEM_BY_SCREEN[screen];
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

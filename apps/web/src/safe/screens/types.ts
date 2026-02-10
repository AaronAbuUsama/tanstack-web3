export const SAFE_SCREEN_IDS = [
	"overview",
	"transactions",
	"owners",
	"guard",
	"modules",
	"setup-runtime",
] as const;

export type SafeScreenId = (typeof SAFE_SCREEN_IDS)[number];

export const DEFAULT_SAFE_SCREEN: SafeScreenId = "overview";

export interface SafeScreenSearch {
	screen: SafeScreenId;
}

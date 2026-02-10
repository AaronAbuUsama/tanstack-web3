import {
	DEFAULT_SAFE_SCREEN,
	SAFE_SCREEN_IDS,
	type SafeScreenId,
	type SafeScreenSearch,
} from "./types";

const safeScreenIdSet = new Set<string>(SAFE_SCREEN_IDS);

export function isSafeScreenId(value: unknown): value is SafeScreenId {
	return typeof value === "string" && safeScreenIdSet.has(value);
}

export function parseSafeScreen(
	value: unknown,
	fallback: SafeScreenId = DEFAULT_SAFE_SCREEN,
): SafeScreenId {
	if (isSafeScreenId(value)) return value;
	return fallback;
}

export function normalizeSafeScreenSearch(
	search: Record<string, unknown>,
): SafeScreenSearch {
	return {
		screen: parseSafeScreen(search.screen),
	};
}

export function buildSafeScreenSearch(
	screen: SafeScreenId,
): { screen?: SafeScreenId } {
	if (screen === DEFAULT_SAFE_SCREEN) {
		return {};
	}
	return { screen };
}

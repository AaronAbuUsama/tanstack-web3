import { describe, expect, it } from "vitest";
import {
	buildSafeScreenSearch,
	isSafeScreenId,
	normalizeSafeScreenSearch,
	parseSafeScreen,
} from "./screen-state";

describe("screen-state", () => {
	it("accepts known screen ids", () => {
		expect(isSafeScreenId("overview")).toBe(true);
		expect(isSafeScreenId("transactions")).toBe(true);
		expect(isSafeScreenId("owners")).toBe(true);
		expect(isSafeScreenId("guard")).toBe(true);
		expect(isSafeScreenId("modules")).toBe(true);
		expect(isSafeScreenId("setup-runtime")).toBe(true);
	});

	it("rejects unknown screen ids", () => {
		expect(isSafeScreenId("wallet")).toBe(false);
		expect(isSafeScreenId("")).toBe(false);
		expect(isSafeScreenId(null)).toBe(false);
		expect(isSafeScreenId(123)).toBe(false);
	});

	it("falls back to overview for invalid screen values", () => {
		expect(parseSafeScreen("wallet")).toBe("overview");
		expect(parseSafeScreen(undefined)).toBe("overview");
		expect(parseSafeScreen(["overview"])).toBe("overview");
	});

	it("normalizes route search into a valid screen state", () => {
		expect(normalizeSafeScreenSearch({ screen: "guard" })).toEqual({
			screen: "guard",
		});
		expect(normalizeSafeScreenSearch({ screen: "not-real" })).toEqual({
			screen: "overview",
		});
		expect(normalizeSafeScreenSearch({})).toEqual({
			screen: "overview",
		});
	});

	it("builds compact search params with overview omitted", () => {
		expect(buildSafeScreenSearch("overview")).toEqual({});
		expect(buildSafeScreenSearch("transactions")).toEqual({
			screen: "transactions",
		});
	});
});

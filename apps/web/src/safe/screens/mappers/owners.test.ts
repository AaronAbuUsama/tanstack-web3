import { describe, expect, it } from "vitest";
import { mapOwnersScreen } from "./owners";

describe("mapOwnersScreen", () => {
	it("maps a 2-of-3 owner set and marks the current signer", () => {
		const owners = [
			"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
			"0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
			"0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
		];
		const mapped = mapOwnersScreen({
			owners,
			currentAddress: owners[1].toLowerCase(),
		});

		expect(mapped.ownerCount).toBe(3);
		expect(mapped.owners).toHaveLength(3);
		expect(mapped.owners[1].isCurrentSigner).toBe(true);
		expect(mapped.owners[0].isCurrentSigner).toBe(false);
	});

	it("maps a 1-of-1 owner set without current signer flag when disconnected", () => {
		const owner = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
		const mapped = mapOwnersScreen({
			owners: [owner],
		});

		expect(mapped.ownerCount).toBe(1);
		expect(mapped.owners).toEqual([
			{
				address: owner,
				id: `0:${owner.toLowerCase()}`,
				isCurrentSigner: false,
			},
		]);
	});

	it("creates stable ids for duplicate-looking mixed-case addresses", () => {
		const base = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
		const mapped = mapOwnersScreen({
			owners: [base, base.toLowerCase()],
			currentAddress: base,
		});

		expect(mapped.owners[0].id).not.toBe(mapped.owners[1].id);
		expect(mapped.owners[0].isCurrentSigner).toBe(true);
		expect(mapped.owners[1].isCurrentSigner).toBe(true);
	});
});

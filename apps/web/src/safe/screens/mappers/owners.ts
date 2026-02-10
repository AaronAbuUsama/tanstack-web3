import type { CommandCenterOwner } from "../../../design-system/compositions/command-center";

export interface MapOwnersScreenInput {
	currentAddress?: string;
	owners: string[];
}

export interface MapOwnersScreenOutput {
	ownerCount: number;
	owners: CommandCenterOwner[];
}

function normalizeAddress(address?: string) {
	return address ? address.toLowerCase() : null;
}

export function mapOwnersScreen({
	currentAddress,
	owners,
}: MapOwnersScreenInput): MapOwnersScreenOutput {
	const normalizedCurrentAddress = normalizeAddress(currentAddress);

	return {
		ownerCount: owners.length,
		owners: owners.map((ownerAddress, index) => ({
			address: ownerAddress,
			id: `${index}:${ownerAddress.toLowerCase()}`,
			isCurrentSigner:
				normalizedCurrentAddress !== null &&
				ownerAddress.toLowerCase() === normalizedCurrentAddress,
		})),
	};
}

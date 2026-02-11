import {
	createAddOwnerTx,
	createChangeThresholdTx,
	createRemoveOwnerTx,
} from "../core/standalone";
import type { SafeInstance, SafeTransaction } from "../core/types";

export type GovernanceIntent =
	| "governance:add-owner"
	| "governance:remove-owner"
	| "governance:change-threshold";

export interface GovernanceAction {
	intent: GovernanceIntent;
	origin: string;
	safeTransaction: SafeTransaction;
}

export function governanceOrigin(intent: GovernanceIntent) {
	return `intent:${intent}`;
}

export async function createAddOwnerGovernanceAction(
	safeInstance: SafeInstance,
	ownerAddress: string,
): Promise<GovernanceAction> {
	const safeTransaction = await createAddOwnerTx(safeInstance, ownerAddress);
	return {
		intent: "governance:add-owner",
		origin: governanceOrigin("governance:add-owner"),
		safeTransaction,
	};
}

export async function createRemoveOwnerGovernanceAction(
	safeInstance: SafeInstance,
	ownerAddress: string,
	newThreshold?: number,
): Promise<GovernanceAction> {
	const safeTransaction = await createRemoveOwnerTx(
		safeInstance,
		ownerAddress,
		newThreshold,
	);
	return {
		intent: "governance:remove-owner",
		origin: governanceOrigin("governance:remove-owner"),
		safeTransaction,
	};
}

export async function createChangeThresholdGovernanceAction(
	safeInstance: SafeInstance,
	newThreshold: number,
): Promise<GovernanceAction> {
	const safeTransaction = await createChangeThresholdTx(
		safeInstance,
		newThreshold,
	);
	return {
		intent: "governance:change-threshold",
		origin: governanceOrigin("governance:change-threshold"),
		safeTransaction,
	};
}

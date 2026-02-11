export interface AllowanceDelegateState {
	address: string;
	amountWei: bigint;
	availableWei: bigint;
	lastResetTimestamp: bigint;
	resetPeriodSeconds: bigint;
	spentWei: bigint;
}

export interface AllowanceModuleState {
	delegates: AllowanceDelegateState[];
	moduleAddress: string;
}

export interface SetAllowanceInput {
	amountEth: string;
	delegateAddress: string;
	resetPeriodSeconds: bigint;
}

export interface ExecuteAllowanceInput {
	amountEth: string;
	signerPrivateKey: `0x${string}`;
	to: string;
}

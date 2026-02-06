export const SpendingLimitGuardABI = [
  { type: "constructor", inputs: [{ name: "_safe", type: "address", internalType: "address" }, { name: "_spendingLimit", type: "uint256", internalType: "uint256" }], stateMutability: "nonpayable" },
  { type: "function", name: "checkAfterExecution", inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }, { name: "", type: "bool", internalType: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "checkAfterModuleExecution", inputs: [{ name: "", type: "bytes32", internalType: "bytes32" }, { name: "", type: "bool", internalType: "bool" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "checkModuleTransaction", inputs: [{ name: "", type: "address", internalType: "address" }, { name: "value", type: "uint256", internalType: "uint256" }, { name: "", type: "bytes", internalType: "bytes" }, { name: "", type: "uint8", internalType: "uint8" }, { name: "", type: "address", internalType: "address" }], outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }], stateMutability: "nonpayable" },
  { type: "function", name: "checkTransaction", inputs: [{ name: "to", type: "address", internalType: "address" }, { name: "value", type: "uint256", internalType: "uint256" }, { name: "", type: "bytes", internalType: "bytes" }, { name: "", type: "uint8", internalType: "uint8" }, { name: "", type: "uint256", internalType: "uint256" }, { name: "", type: "uint256", internalType: "uint256" }, { name: "", type: "uint256", internalType: "uint256" }, { name: "", type: "address", internalType: "address" }, { name: "", type: "address payable", internalType: "address payable" }, { name: "", type: "bytes", internalType: "bytes" }, { name: "", type: "address", internalType: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "safe", inputs: [], outputs: [{ name: "", type: "address", internalType: "address" }], stateMutability: "view" },
  { type: "function", name: "spendingLimit", inputs: [], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "supportsInterface", inputs: [{ name: "interfaceId", type: "bytes4", internalType: "bytes4" }], outputs: [{ name: "", type: "bool", internalType: "bool" }], stateMutability: "pure" },
  { type: "event", name: "TransactionChecked", inputs: [{ name: "to", type: "address", indexed: true, internalType: "address" }, { name: "value", type: "uint256", indexed: false, internalType: "uint256" }, { name: "allowed", type: "bool", indexed: false, internalType: "bool" }], anonymous: false },
  { type: "error", name: "ExceedsSpendingLimit", inputs: [{ name: "value", type: "uint256", internalType: "uint256" }, { name: "limit", type: "uint256", internalType: "uint256" }] },
] as const

export const AllowanceModuleABI = [
  { type: "constructor", inputs: [{ name: "_safe", type: "address", internalType: "address" }], stateMutability: "nonpayable" },
  { type: "function", name: "allowances", inputs: [{ name: "", type: "address", internalType: "address" }], outputs: [{ name: "amount", type: "uint256", internalType: "uint256" }, { name: "spent", type: "uint256", internalType: "uint256" }, { name: "resetPeriod", type: "uint256", internalType: "uint256" }, { name: "lastReset", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "executeAllowance", inputs: [{ name: "to", type: "address", internalType: "address" }, { name: "value", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "getAvailableAllowance", inputs: [{ name: "delegate", type: "address", internalType: "address" }], outputs: [{ name: "", type: "uint256", internalType: "uint256" }], stateMutability: "view" },
  { type: "function", name: "safe", inputs: [], outputs: [{ name: "", type: "address", internalType: "address" }], stateMutability: "view" },
  { type: "function", name: "setAllowance", inputs: [{ name: "delegate", type: "address", internalType: "address" }, { name: "amount", type: "uint256", internalType: "uint256" }, { name: "resetPeriod", type: "uint256", internalType: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "event", name: "AllowanceSet", inputs: [{ name: "delegate", type: "address", indexed: true, internalType: "address" }, { name: "amount", type: "uint256", internalType: "uint256" }, { name: "resetPeriod", type: "uint256", internalType: "uint256" }], anonymous: false },
  { type: "event", name: "AllowanceUsed", inputs: [{ name: "delegate", type: "address", indexed: true, internalType: "address" }, { name: "to", type: "address", indexed: true, internalType: "address" }, { name: "value", type: "uint256", internalType: "uint256" }], anonymous: false },
  { type: "error", name: "ExceedsAllowance", inputs: [{ name: "requested", type: "uint256", internalType: "uint256" }, { name: "available", type: "uint256", internalType: "uint256" }] },
  { type: "error", name: "OnlySafe", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
] as const

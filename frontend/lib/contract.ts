export const escrowAddress = process.env.NEXT_PUBLIC_ESCROW_ADDRESS as `0x${string}` | undefined;
export const escrowAbi = [
  { type: "function", name: "client", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "freelancer", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "arbitrator", stateMutability: "view", inputs: [], outputs: [{ type: "address" }] },
  { type: "function", name: "totalAmount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "remainingBalance", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "funded", stateMutability: "view", inputs: [], outputs: [{ type: "bool" }] },
  { type: "function", name: "milestoneCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "getMilestone", stateMutability: "view", inputs: [{ name: "milestoneId", type: "uint256" }], outputs: [{ type: "tuple", components: [{ name: "amount", type: "uint256" }, { name: "status", type: "uint8" }, { name: "deliverableHash", type: "bytes32" }] }] },
  { type: "function", name: "fund", stateMutability: "payable", inputs: [], outputs: [] },
  { type: "function", name: "approveMilestone", stateMutability: "nonpayable", inputs: [{ name: "milestoneId", type: "uint256" }], outputs: [] },
] as const;

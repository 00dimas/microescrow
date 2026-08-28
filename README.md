# MicroEscrow

A smart contract escrow for freelance payments — not a speculative token.

> Testnet only. Not independently audited — do not deploy to mainnet with real funds.

## What it does

An escrow contract that locks funds deposited by a client and releases them to a freelancer
as milestones are approved, or splits them through arbitration if a dispute is raised. It's
built for real payment use cases, not a coin/token launch.

- **Deposit & lock** — the client deposits funds once; they are locked in the contract.
- **Milestone-based release** — payment is released incrementally as each milestone is approved.
- **Dispute flow** — a dedicated arbitrator role resolves disputes between client and freelancer.
- **On-chain event log** — every action (deposit, release, dispute) is recorded on-chain for transparency.
- **Simple frontend** — client and freelancer can connect a wallet and see escrow status.

## Architecture

```text
Client (deposit) → Escrow Contract (lock funds, track milestones)
  → Freelancer (submit deliverable) → Client approves / Arbitrator resolves
  → Funds released
```

## Stack

| Layer | Component |
|---|---|
| Language | Solidity |
| Framework | Hardhat |
| Testnet | Sepolia (free faucet) |
| Frontend | Next.js + wagmi/viem |
| Wallet | MetaMask |

## Contract flow

1. The client deploys the contract with the freelancer, arbitrator, and milestone values.
2. The client calls `fund()` with ETH exactly equal to the sum of all milestones.
3. The freelancer submits a deliverable hash via `submitWork()`.
4. The client calls `approveMilestone()` to release that milestone, or either party can open a
   dispute via `raiseDispute()`.
5. The arbitrator splits the disputed milestone's value via `resolveDispute()`.

## Security

- Client, freelancer, and arbitrator permissions are checked on every fund-related mutation.
- Release and dispute resolution follow the checks-effects-interactions pattern.
- Every transfer path is protected by `nonReentrant`.
- Deposits are one-shot, from the client only, and must exactly match the milestone total.
- Direct ETH transfers via `receive`/`fallback` are rejected.
- Milestone values must be non-zero; party addresses must be non-zero, distinct, and not the client.
- State transitions prevent double release and double resolution.
- An arbitrator's award can never exceed a milestone's value.
- Unit tests cover the happy path, access control, invalid input, and invalid transitions.

Known limitations: there's no timeout, so funds can be stuck if a party or the arbitrator goes
unresponsive; the arbitrator is a single trusted role; deliverables are represented only as a
hash, with content storage/verification handled off-chain; and there's no sweep function, so
forced ETH sent to the contract by other means cannot be withdrawn by any privileged party.
Independent audit, external fuzz/invariant testing, and static analysis (e.g. Slither) have not
been done — see `docs/AUDIT_CHECKLIST.md` for the full internal checklist.

## Replicating this project

Requirements: Node.js 20+, and a wallet dedicated to testnet use only.

```bash
npm install
npm test
npm run coverage
```

### Running the frontend

```bash
cp frontend/.env.example frontend/.env.local
npm --prefix frontend install
npm run frontend:dev
```

The frontend reads the contract address from `NEXT_PUBLIC_ESCROW_ADDRESS`. The wallet must be
on Sepolia. The UI supports connecting a wallet, viewing escrow status, depositing as the
client, and approving submitted milestones.

### Deploying to Sepolia

Copy `.env.example` to `.env` and fill in an RPC URL and the private key of a **dedicated
testnet wallet** — never a key that holds mainnet assets.

```bash
npm run compile
npm run deploy:sepolia -- \
  --parameters ignition/parameters.example.json
```

Adjust the party addresses and milestone values (in wei) in the parameters file before
deploying. After deployment, put the contract address into `frontend/.env.local`.

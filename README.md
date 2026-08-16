# MicroEscrow

Smart contract escrow sederhana untuk pembayaran freelance — bukan token spekulatif.

> Status: **Blueprint** — belum ada kode.

## Ringkasan

Escrow contract yang mengunci dana dari client, lalu merilisnya ke freelancer berdasarkan
milestone yang disetujui — atau lewat arbitrase kalau ada dispute. Fokus ke use case pembayaran
nyata, bukan proyek token/koin.

## Fitur utama

- **Deposit & lock**: client deposit dana, dana terkunci di contract
- **Milestone-based release**: pembayaran dicairkan bertahap sesuai milestone yang di-approve
- **Dispute flow**: role arbitrator buat resolve sengketa antara client dan freelancer
- **Event log**: semua aksi (deposit, release, dispute) tercatat on-chain buat transparency
- **Frontend sederhana**: client & freelancer bisa connect wallet dan lihat status escrow

## Arsitektur

```
Client (deposit) → Escrow Contract (lock funds, track milestone)
  → Freelancer (submit deliverable) → Client approve / Arbitrator resolve
  → Release funds
```

## Stack (free-tier)

| Layer | Komponen |
|---|---|
| Bahasa | Solidity |
| Framework | Foundry / Hardhat |
| Testnet | Sepolia (faucet gratis) |
| Frontend | Next.js + wagmi/viem |
| Wallet | MetaMask |

## Roadmap

| # | Milestone |
|---|---|
| M0 | Contract dasar: deposit + release manual |
| M1 | Milestone-based partial release |
| M2 | Dispute flow + arbitrator role |
| M3 | Frontend integrasi wallet (connect, deposit, approve) |
| M4 | Audit checklist + test coverage lengkap |

## Catatan

Ini bukan proyek token spekulatif — fokusnya ke use case pembayaran nyata dan security dasar
(reentrancy, access control). Selalu test di testnet; jangan pernah deploy ke mainnet dengan
dana asli tanpa audit.

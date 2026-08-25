# MicroEscrow

Smart contract escrow sederhana untuk pembayaran freelance — bukan token spekulatif.

> Status: **M0–M4 selesai untuk testnet** — belum diaudit independen dan tidak untuk mainnet.

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

## Menjalankan proyek

Prasyarat: Node.js 20+ dan wallet khusus testnet.

```bash
npm install
npm test
npm run coverage

cp frontend/.env.example frontend/.env.local
npm --prefix frontend install
npm run frontend:dev
```

Frontend membaca alamat kontrak dari `NEXT_PUBLIC_ESCROW_ADDRESS`. Wallet harus berada di
Sepolia. UI menyediakan connect wallet, ringkasan escrow, deposit oleh client, dan approval
milestone yang sudah disubmit.

## Deploy ke Sepolia

Salin `.env.example` menjadi `.env`, isi RPC dan private key **wallet testnet khusus**. Jangan
gunakan key yang memegang aset mainnet.

```bash
npm run compile
npm run deploy:sepolia -- \
  --parameters ignition/parameters.example.json
```

Sesuaikan alamat pihak serta nilai milestone (wei) di file parameter sebelum deploy. Setelah
deploy, masukkan alamat kontrak ke `frontend/.env.local`.

## Alur kontrak

1. Client deploy kontrak dengan freelancer, arbitrator, dan daftar nilai milestone.
2. Client memanggil `fund()` dengan ETH tepat sebesar total seluruh milestone.
3. Freelancer mengirim hash deliverable melalui `submitWork()`.
4. Client memanggil `approveMilestone()` untuk mencairkan milestone, atau salah satu pihak
   membuka dispute melalui `raiseDispute()`.
5. Arbitrator membagi nilai milestone disputed melalui `resolveDispute()`.

Lihat [checklist audit](docs/AUDIT_CHECKLIST.md) untuk kontrol yang sudah diuji dan risiko yang
masih diketahui.

## Catatan

Ini bukan proyek token spekulatif — fokusnya ke use case pembayaran nyata dan security dasar
(reentrancy, access control). Selalu test di testnet; jangan pernah deploy ke mainnet dengan
dana asli tanpa audit.

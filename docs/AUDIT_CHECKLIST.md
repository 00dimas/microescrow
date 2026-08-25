# Checklist audit MicroEscrow

Dokumen ini adalah pemeriksaan internal, **bukan audit independen**. Kontrak hanya boleh
digunakan di testnet sampai audit profesional selesai.

## Model ancaman

- Client mencoba menarik dana tanpa membayar pekerjaan yang sudah disetujui.
- Freelancer mencoba mencairkan milestone tanpa persetujuan.
- Pihak ketiga mencoba memanggil fungsi yang memiliki hak khusus.
- Penerima dana mencoba reentrancy ketika menerima ETH.
- Arbitrator mencoba membagi lebih dari nilai milestone.
- ETH dikirim langsung sehingga accounting internal berbeda dari saldo kontrak.

## Pemeriksaan

- [x] Hak client, freelancer, party, dan arbitrator diperiksa pada setiap mutasi terkait dana.
- [x] Release dan resolusi memakai checks-effects-interactions.
- [x] Seluruh jalur transfer dilindungi `nonReentrant`.
- [x] Deposit hanya sekali, dari client, dan harus sama dengan total milestone.
- [x] Transfer ETH langsung melalui `receive` dan `fallback` ditolak.
- [x] Nilai milestone tidak nol; alamat pihak tidak nol, berbeda, dan bukan client.
- [x] Transisi status membatasi double release dan double resolution.
- [x] Award arbitrator tidak dapat melebihi nilai milestone.
- [x] Compiler dipin ke Solidity 0.8.28 dan optimizer aktif.
- [x] Unit test mencakup happy path, access control, input invalid, dan transisi invalid.
- [ ] Audit independen dan review mekanisme ekonomi.
- [ ] Fuzz/invariant test eksternal dan analisis statis Slither di CI.
- [ ] Deployment production/mainnet—dilarang sebelum dua butir di atas selesai.

## Risiko yang diketahui

- Tidak ada timeout. Jika salah satu pihak atau arbitrator tidak aktif, dana dapat tertahan.
- Arbitrator adalah trusted role tunggal dan dapat menentukan pembagian milestone disputed.
- Deliverable hanya direpresentasikan sebagai hash; penyimpanan dan verifikasi konten ada di luar chain.
- Forced ETH (misalnya melalui mekanisme protokol lain) dapat membuat saldo aktual lebih besar dari
  accounting. Tidak ada fungsi sweep agar pihak privileged tidak bisa mengambil dana tak terduga.
- Audit dependency frontend masih melaporkan advisory transitif pada ekosistem Next.js/wagmi.
  Production build lulus, tetapi advisory harus ditinjau dan dependency diperbarui sebelum hosting publik.

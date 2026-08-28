# MicroEscrow — instruksi untuk AI coding agent

Baca `README.md` dulu untuk konteks produk (fitur, arsitektur, stack, roadmap).

## Status saat ini

Semua milestone di tabel Roadmap README (M0–M4) sudah selesai untuk testnet — belum diaudit
independen dan tidak untuk mainnet. Lihat `docs/AUDIT_CHECKLIST.md` untuk kontrol yang sudah
diuji dan risiko yang masih terbuka (audit independen, fuzz/invariant test eksternal, Slither
di CI). Kalau diminta "bantu bangun sistemnya" tanpa instruksi spesifik, tanya milestone/fitur
baru apa yang dimaksud — jangan asumsikan mulai dari nol.

## Prinsip kerja

- **Security dulu, fitur belakangan.** Setiap fungsi yang handle fund wajib dicek reentrancy,
  access control, dan checks-effects-interactions pattern sebelum dianggap selesai.
- **Test coverage tinggi itu wajib.** Contract yang pegang uang tidak boleh punya jalur yang
  belum ditest — jangan skip test demi cepat selesai.
- **Testnet only sampai ada audit.** Jangan pernah sugestikan atau bantu deploy ke mainnet
  dengan dana asli tanpa audit — ini batas keras.
- **Ikuti stack yang sudah dipilih** di README kecuali user minta ganti secara eksplisit.
- **Bahasa**: kode dan commit message dalam Bahasa Inggris; dokumentasi produk dalam
  Bahasa Indonesia.

## Kalau diminta ubah arsitektur

Blueprint adalah rencana awal, bukan aturan mati. Kalau ada alasan teknis kuat untuk beda
pendekatan, jelaskan tradeoff-nya ke user dulu sebelum mengubah.

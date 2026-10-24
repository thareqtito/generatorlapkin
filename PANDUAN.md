# Generator Laporan Capaian Kinerja — Panduan

Generator ini menyusun **Laporan Monitoring dan Evaluasi Capaian Kinerja** versi **Ketua (KPU)** dan versi **Sekretaris** dalam format Word (.docx). Sumber datanya:

- data capaian dari spreadsheet,
- data anggaran dan rapat yang diisi di aplikasi,
- narasi yang dikembangkan di aplikasi.

## Isi folder

| File / folder | Fungsi |
|---|---|
| `index.html` | Aplikasi generator (dibuka di browser) |
| `generator-core.js` | Logika perhitungan, pemeriksaan, dan penyusunan laporan |
| `templates/template-ketua.docx` | Template Word Laporan Ketua |
| `templates/template-sekretaris.docx` | Template Word Laporan Sekretaris |
| `contoh/capaian-kinerja-2026-TW3.json` | Proyek contoh berisi data dan narasi laporan TW III 2026 |
| `apps-script/ApiSpreadsheet.gs` | Script untuk membaca Google Sheet capaian kinerja |
| `lib/` | Pustaka pendukung (PizZip, Docxtemplater, SheetJS). Disertakan agar tidak bergantung pada CDN |

---

## A. Pemasangan (sekali saja)

### 1. Upload ke GitHub Pages
1. Buat repository, misalnya `generator-capaian-kinerja`.
2. Upload **seluruh isi folder ini**, dengan struktur subfolder tetap sama.
3. Buka **Settings → Pages → Branch: main → / (root) → Save**.
4. Aplikasi bisa dibuka di `https://<username>.github.io/generator-capaian-kinerja/`.

> Jika `index.html` dibuka langsung dari folder komputer (alamatnya diawali `file://`), browser memblokir pemuatan template. Template bisa dipilih manual lewat tombol **Pakai template lain**, tetapi cara paling praktis tetap lewat GitHub Pages.

### 2. Hubungkan Google Sheet capaian kinerja
1. Buka spreadsheet **CAPAIAN KINERJA TAHUN …** yang biasa dipakai.
2. Buka **Ekstensi → Apps Script**. Tempel isi `apps-script/ApiSpreadsheet.gs`.
3. Ganti nilai `KUNCI` dengan kata sandi bebas, lalu klik **Simpan**.
4. Pilih **Terapkan → Deployment baru → Aplikasi web**, dengan pengaturan:
   - Jalankan sebagai: **Saya**
   - Akses: **Siapa saja**

   Lalu klik **Terapkan** dan salin URL yang diakhiri `/exec`.
5. Di generator, buka menu **Data Capaian**. Isi URL dan kunci, lalu klik **Hubungkan**. URL dan kunci tersimpan di browser masing-masing laptop.

Script ini **hanya membaca**, tidak mengubah apa pun di spreadsheet. Jika koneksi belum siap, gunakan **Impor file .xlsx**: di Google Sheets pilih **File → Download → Microsoft Excel**, lalu pilih file hasil download di generator.

> Untuk spreadsheet tahun berikutnya (file baru), ulangi langkah 2 di file tersebut.

---

## B. Alur kerja tiap triwulan

1. **Buka proyek triwulan lalu.** Klik **Buka**, pilih file `.json` di folder OneDrive.
   - Untuk pertama kali, pakai **Buka contoh TW III 2026** di menu Proyek.
2. **Lanjutkan ke triwulan berikutnya.** Di menu **Proyek**, klik **Buat proyek Triwulan … dari proyek ini**, lalu simpan sebagai file baru di OneDrive. Yang disalin:
   - narasi, dengan sebutan "Triwulan III" otomatis menjadi "Triwulan IV",
   - data anggaran, tempat dan peserta rapat, kesimpulan, saran.
3. **Data Capaian.** Pilih sheet `KPU TW …` dan `SEKRETARIAT TW …` (dipilih otomatis sesuai triwulan), lalu klik **Ambil data**.
4. **Anggaran.**
   - Perbarui pagu dan realisasi per kegiatan.
   - Tambahkan baris revisi DIPA baru dan isi nomor revisinya.
   - Centang **Sudah diperbarui**.
5. **Rapat & Penutup.**
   - Isi tanggal rapat monev dan poin penegasan Ketua (dari notula).
   - Isi tanggal laporan.
   - Sesuaikan kesimpulan dan saran.
   - Centang **Sudah diperbarui**.
6. **Narasi.** Pilih sasaran satu per satu dan sunting narasinya. Arti titik warna:
   - 🟢 sudah dikembangkan,
   - 🟡 masih salinan triwulan lalu (belum disunting),
   - ⚪ belum diisi, memakai teks ringkas dari spreadsheet.
7. **Periksa & Unduh.** Tindak lanjuti temuan pemeriksaan, lalu unduh kedua laporan.
8. **Simpan** (Ctrl+S) agar file proyek di OneDrive ikut diperbarui.

### Sentuhan akhir di Word
- Saat file dibuka, Word bertanya *"update the fields?"*. Pilih **Yes** agar daftar isi diperbarui.
- Ganti setiap tulisan berlatar **kuning** dengan gambar: halaman DIPA, nota dinas, daftar hadir, foto dokumentasi, notula.
- Sampul adalah gambar (teks triwulan ada di dalam gambar). Unggah sampul baru di menu **Periksa & Unduh**, atau ganti di Word.
- **Perbaikan angka atau isi dilakukan di generator, lalu unduh ulang.** Word hanya untuk sentuhan akhir.

---

## C. Editor narasi

| Blok | Hasil di Word |
|---|---|
| Paragraf | Paragraf biasa dengan indentasi baris pertama |
| Sub-poin (judul + isi) | `a. Judul` diikuti paragraf isi yang menjorok. Huruf a, b, c berurutan otomatis |
| Daftar | Butir `a.` `b.` `c.` / `1.` `2.` / `1)` `2)`, satu butir per baris |
| Tabel | Tabel bergaris. Baris pertama menjadi judul kolom. Bisa ditempel langsung dari Excel |

Format teks: `**tebal**` dan `*miring*`.

Bagian yang dikosongkan otomatis memakai teks ringkas dari spreadsheet. Jika teks ringkas berisi daftar bernomor, generator mengubahnya menjadi daftar a, b, c.

---

## D. Pemeriksaan otomatis

| Jenis | Yang diperiksa |
|---|---|
| Capaian | Target TW lebih besar dari target tahunan; realisasi di bawah target TW; realisasi jauh melampaui target; satuan target berbeda |
| Narasi | Menyebut triwulan lain (ada tombol perbaikan otomatis); masih sama persis dengan triwulan lalu |
| Anggaran | Realisasi melebihi pagu; pagu revisi terakhir tidak sama dengan jumlah pagu kegiatan; nomor revisi DIPA tidak cocok |
| Rapat & umum | Tanggal kosong; tanggal laporan lebih awal dari rapat; penegasan, kesimpulan, atau peserta kosong |

---

## E. Mengubah format laporan (template)

Template adalah file Word biasa. Bagian yang diisi otomatis ditandai dengan kurung kurawal ganda, misalnya `{{tahun}}`. Teks lain (pendahuluan, dasar hukum, margin, kop, font) boleh diubah langsung di Word. Setelah itu, upload ulang ke folder `templates/` di GitHub dengan nama file yang sama.

Penanda yang tersedia:

| Penanda | Isi |
|---|---|
| `{{tw}}` `{{tahun}}` `{{tgl_akhir_tw}}` | III · 2026 · 30 September 2026 |
| `{{tgl_pk}}` `{{jml_indikator}}` | Tanggal Perjanjian Kinerja · jumlah indikator |
| `{{dipa_revisi}}` `{{pagu_total}}` `{{pagu_terbilang}}` `{{realisasi_total}}` `{{realisasi_terbilang}}` `{{sisa_total}}` `{{persen_total}}` | Anggaran |
| `{{rapat_waktu}}` `{{rapat_tempat}}` `{{rapat_hari}}` `{{rapat_tanggal}}` | Rapat monev |
| `{{tgl_laporan}}` `{{nama_ttd}}` | Penutup |
| `{{#program}}…{{/program}}` | Baris tabel ringkasan anggaran per program |
| `{{#iku}}…{{/iku}}` | Baris tabel pengukuran (Bab B) |
| `{{#peserta}}{{.}}{{/peserta}}`, `{{#penegasan}}…`, `{{#kesimpulan}}…`, `{{#saran}}…` | Daftar/paragraf berulang |
| `{{#pk}}…{{/pk}}` | Satu "Pernyataan Kinerja" per sasaran (Bab C), berisi `{{no}}` `{{sasaran}}` `{{#ind}}…{{/ind}}` dan narasi `{{@n_kegiatan}}` `{{@n_kendala}}` `{{@n_upaya}}` |
| `{{#revisi}}…{{/revisi}}` | Tabel riwayat revisi DIPA |
| `{{#keg_program}}…{{#kegiatan}}…{{/kegiatan}}{{/keg_program}}` | Tabel realisasi per kegiatan |
| `{{#lamp}}…{{/lamp}}` | Tabel pengukuran di lampiran (semua kolom) |

Gaya tulisan narasi diatur lewat style Word **Narasi Paragraf**, **Narasi Sub Judul**, **Narasi Isi Sub**, **Narasi Poin**, dan **Narasi Tabel** di dalam template. Ubah style tersebut jika ingin mengganti indentasi atau spasi narasi.

> `${ttd_pengirim}` di bagian tanda tangan sengaja dibiarkan apa adanya (penanda tanda tangan elektronik).

---

## F. Catatan

- Kalimat pendahuluan versi Sekretaris *"…telah menjalani lebih dari separuh perjalanan…"* adalah teks tetap di template. Sesuaikan di template jika dipakai untuk Triwulan I.
- Template dibuat dari laporan TW III 2026. Gambar Perjanjian Kinerja, struktur organisasi, dan rumus tetap dipakai apa adanya.
- File proyek berisi narasi, anggaran, dan cuplikan data spreadsheet. Simpan satu file per triwulan di OneDrive sebagai arsip.

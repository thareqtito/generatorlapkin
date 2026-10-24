/**
 * ============================================================
 *  API BACA SPREADSHEET CAPAIAN KINERJA (hanya baca)
 *  untuk Generator Laporan Capaian Kinerja — Rendatin KPU Kab. Pacitan
 * ============================================================
 *  Pasang di spreadsheet CAPAIAN KINERJA yang biasa dipakai:
 *  1. Buka spreadsheet → Ekstensi → Apps Script
 *  2. Tempel seluruh isi file ini, ganti KUNCI di bawah, lalu Simpan
 *  3. Terapkan → Deployment baru → Jenis: Aplikasi web
 *       Jalankan sebagai : Saya
 *       Akses            : Siapa saja
 *  4. Salin URL (diakhiri /exec) dan KUNCI ke menu "Data Capaian" di generator
 *
 *  Script ini TIDAK mengubah isi spreadsheet sama sekali.
 * ============================================================
 */

const KUNCI = 'ganti-dengan-kunci-rahasia';   // samakan dengan isian "Kunci akses" di generator

function doGet(e) {
  const p = (e && e.parameter) || {};
  let out;
  try {
    if (!KUNCI || p.key !== KUNCI) throw new Error('Kunci akses salah.');
    const ss = SpreadsheetApp.getActive();
    if (p.action === 'list') {
      out = { ok: true, data: { judul: ss.getName(), sheets: ss.getSheets().map(function (s) { return s.getName(); }) } };
    } else if (p.action === 'read') {
      const sh = ss.getSheetByName(p.sheet || '');
      if (!sh) throw new Error('Sheet "' + p.sheet + '" tidak ditemukan.');
      out = { ok: true, data: { sheet: sh.getName(), values: sh.getDataRange().getDisplayValues() } };
    } else {
      throw new Error('Aksi tidak dikenal.');
    }
  } catch (err) {
    out = { ok: false, error: err.message || String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

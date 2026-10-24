/* ============================================================
 *  GENERATOR LAPORAN CAPAIAN KINERJA — LOGIKA INTI
 *  Subbagian Rendatin KPU Kabupaten Pacitan
 *  (dipakai oleh index.html; tidak bergantung pada tampilan)
 * ============================================================ */
(function (root) {
  'use strict';

  const ROMAWI = ['I', 'II', 'III', 'IV'];
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const AKHIR_TW = [[3, 31], [6, 30], [9, 30], [12, 31]];
  const JENIS = {
    KPU: { label: 'Laporan Ketua (KPU)', pendek: 'Ketua', file: 'KETUA', templat: 'templates/template-ketua.docx' },
    SEK: { label: 'Laporan Sekretaris', pendek: 'Sekretaris', file: 'SEKRETARIS', templat: 'templates/template-sekretaris.docx' }
  };
  const VMR = '⟦VMR⟧', VMC = '⟦VMC⟧';

  /* ---------------- format angka & tanggal ---------------- */
  function rupiah(n) {
    n = Math.round(Number(n) || 0);
    const neg = n < 0; n = Math.abs(n);
    return (neg ? '-' : '') + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function persen(a, b) {
    if (!b) return '0%';
    return (Math.round(a / b * 10000) / 100).toFixed(2).replace('.', ',') + '%';
  }
  function terbilang(n) {
    n = Math.floor(Math.abs(Number(n) || 0));
    const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    function t(x) {
      if (x < 12) return s[x];
      if (x < 20) return t(x - 10) + ' belas';
      if (x < 100) return t(Math.floor(x / 10)) + ' puluh ' + t(x % 10);
      if (x < 200) return 'seratus ' + t(x - 100);
      if (x < 1000) return t(Math.floor(x / 100)) + ' ratus ' + t(x % 100);
      if (x < 2000) return 'seribu ' + t(x - 1000);
      if (x < 1e6) return t(Math.floor(x / 1000)) + ' ribu ' + t(x % 1000);
      if (x < 1e9) return t(Math.floor(x / 1e6)) + ' juta ' + t(x % 1e6);
      if (x < 1e12) return t(Math.floor(x / 1e9)) + ' miliar ' + t(x % 1e9);
      return t(Math.floor(x / 1e12)) + ' triliun ' + t(x % 1e12);
    }
    if (n === 0) return 'Nol rupiah';
    const r = t(n).replace(/\s+/g, ' ').trim() + ' rupiah';
    return r.charAt(0).toUpperCase() + r.slice(1);
  }
  function parseRupiah(v) {
    if (typeof v === 'number') return v;
    const d = String(v || '').replace(/[^\d-]/g, '');
    return d ? Number(d) : 0;
  }
  function tglPanjang(iso) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return d + ' ' + BULAN[m - 1] + ' ' + y;
  }
  function namaHari(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return HARI[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  }
  function tglAkhirTw(tahun, tw) {
    const [m, d] = AKHIR_TW[tw - 1];
    return d + ' ' + BULAN[m - 1] + ' ' + tahun;
  }

  /* ---------------- parsing grid spreadsheet ---------------- */
  const KOLOM = [
    ['no', /^NO$/],
    ['sasaran', /^SASARAN/],
    ['indikator', /^INDIKATOR/],
    ['target_tw', /^TARGET\s*(S\.?\s*D\.?|TRIWULAN|TW)/],
    ['target', /^TARGET/],
    ['realisasi', /^TOTAL\s*REALISASI|^REALISASI\s*TARGET/],
    ['real_anggaran', /^REALISASI\s*ANGGARAN/],
    ['kendala', /^PERMASALAHAN/],
    ['kegiatan', /^KEGIATAN/],
    ['upaya', /^UPAYA/],
    ['link', /^LINK/],
    ['waktu', /^WAKTU/],
    ['pj', /^PENANGGUNG/]
  ];
  function bersih(v) {
    let s = (v === null || v === undefined) ? '' : String(v);
    s = s.replace(/\r/g, '').replace(/ /g, ' ');
    s = s.split('\n').map(x => x.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n{2,}/g, '\n').trim();
    if (/^".*"$/s.test(s)) s = s.slice(1, -1).trim();
    return s;
  }
  function parseGrid(grid) {
    const hr = grid.findIndex(r => r && String(r[0] || '').trim().toUpperCase() === 'NO');
    if (hr < 0) throw new Error('Baris judul kolom ("NO") tidak ditemukan di sheet.');
    const head = grid[hr].map(h => String(h || '').replace(/\s+/g, ' ').trim().toUpperCase());
    const col = {};
    head.forEach((h, i) => {
      if (!h) return;
      for (const [k, re] of KOLOM) {
        if (col[k] === undefined && re.test(h)) { col[k] = i; break; }
      }
    });
    ['sasaran', 'indikator', 'target', 'realisasi'].forEach(k => {
      if (col[k] === undefined) throw new Error('Kolom ' + k.toUpperCase() + ' tidak ditemukan di sheet.');
    });
    const twHead = head[col.target_tw] || '';
    const mTw = twHead.match(/TRIWULAN\s+(IV|III|II|I)\b/);
    const res = { sasaran: [], tw_header: mTw ? ROMAWI.indexOf(mTw[1]) + 1 : 0 };
    let cur = null;
    for (let r = hr + 1; r < grid.length; r++) {
      const row = grid[r] || [];
      const g = k => (col[k] === undefined ? '' : bersih(row[col[k]]));
      const ind = g('indikator');
      if (!ind) continue;
      const no = g('no').replace(/\.0+$/, '').replace(/\.$/, '');
      const sas = g('sasaran');
      if (no || sas || !cur) {
        cur = { no: no || String(res.sasaran.length + 1), sasaran: sas, indikator: [] };
        res.sasaran.push(cur);
      }
      cur.indikator.push({
        indikator: ind, target: g('target'), target_tw: g('target_tw'), realisasi: g('realisasi'),
        real_anggaran: g('real_anggaran'), kendala: g('kendala'), kegiatan: g('kegiatan'), upaya: g('upaya'),
        link: g('link'), waktu: g('waktu'), pj: g('pj')
      });
    }
    if (!res.sasaran.length) throw new Error('Tidak ada baris indikator yang terbaca di sheet.');
    return res;
  }
  function jumlahIndikator(sheet) {
    return sheet ? sheet.sasaran.reduce((s, x) => s + x.indikator.length, 0) : 0;
  }
  /* tebak nama sheet: "KPU TW III", "SEKRETARIAT_TW I", dll. */
  function tebakSheet(names, jenis, tw) {
    const kata = jenis === 'KPU' ? 'KPU' : 'SEKRETARIAT';
    const re = new RegExp('^' + kata + '[\\s_]*TW[\\s_]*(IV|III|II|I)\\s*$', 'i');
    const cocok = names.filter(n => re.test(n.trim()));
    return cocok.find(n => n.trim().match(re)[1].toUpperCase() === ROMAWI[tw - 1]) || '';
  }

  /* ---------------- narasi: blok -> teks bawaan ---------------- */
  const RE_NOMOR = /^\s*(\d{1,2}|[a-zA-Z])\s*[\.\),]+\)?\s*/;
  function blokDariTeks(text) {
    const lines = bersih(text).split('\n').map(s => s.trim()).filter(Boolean);
    if (!lines.length) return [];
    const bernomor = lines.filter(l => RE_NOMOR.test(l) && l.replace(RE_NOMOR, '').length > 3);
    if (lines.length > 1 && bernomor.length >= Math.ceil(lines.length * 0.6)) {
      return [{ t: 'list', gaya: 'huruf', items: lines.map(l => l.replace(RE_NOMOR, '').trim()) }];
    }
    if (lines.length === 1) return [{ t: 'p', text: lines[0].replace(RE_NOMOR, '') }];
    return lines.map(l => ({ t: 'p', text: l }));
  }
  function narasiBawaan(jenis, sas, bagian, tw) {
    const twR = ROMAWI[tw - 1];
    const inds = sas.indikator;
    if (inds.length > 1) {
      return inds.filter(i => bersih(i[bagian])).map(i => ({ t: 'sub', judul: i.indikator, isi: bersih(i[bagian]).split('\n').map(l => l.replace(RE_NOMOR, '')).join('\n') }));
    }
    const blocks = blokDariTeks(inds[0] ? inds[0][bagian] : '');
    if (bagian === 'kegiatan' && blocks.length && blocks[0].t === 'list') {
      const intro = jenis === 'KPU'
        ? 'Selama Triwulan ' + twR + ', KPU Kabupaten Pacitan telah melaksanakan berbagai kegiatan dalam mendukung pencapaian target kinerja, di antaranya:'
        : 'Dalam rangka mencapai target kinerja, Sekretariat KPU Kabupaten Pacitan telah melakukan beberapa upaya, di antaranya:';
      blocks.unshift({ t: 'p', text: intro });
    }
    return blocks;
  }
  function blokKosong(blocks) {
    return !blocks || !blocks.length || blocks.every(b => {
      if (b.t === 'p') return !String(b.text || '').trim();
      if (b.t === 'sub') return !String(b.judul || '').trim() && !String(b.isi || '').trim();
      if (b.t === 'list') return !(b.items || []).some(x => String(x).trim());
      if (b.t === 'tabel') return !(b.rows || []).some(r => r.some(c => String(c).trim()));
      return true;
    });
  }
  function teksBlok(blocks) {
    return (blocks || []).map(b => b.t === 'p' ? b.text : b.t === 'sub' ? b.judul + '\n' + b.isi
      : b.t === 'list' ? (b.items || []).join('\n') : b.t === 'tabel' ? (b.rows || []).map(r => r.join(' | ')).join('\n') : '').join('\n');
  }
  function hashBlok(blocks) {
    const s = JSON.stringify(blocks || []);
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return String(h >>> 0);
  }

  /* ---------------- narasi: blok -> WordprocessingML ---------------- */
  function xe(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function runs(text, extraRpr) {
    // dukung **tebal** dan *miring*
    const out = [];
    const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;
    let last = 0, m;
    const str = String(text || '');
    const push = (t, rpr) => {
      if (!t) return;
      t.split('\t').forEach((part, i) => {
        if (i > 0) out.push('<w:r>' + (rpr || extraRpr ? '<w:rPr>' + (extraRpr || '') + (rpr || '') + '</w:rPr>' : '') + '<w:tab/></w:r>');
        if (part) out.push('<w:r>' + (rpr || extraRpr ? '<w:rPr>' + (extraRpr || '') + (rpr || '') + '</w:rPr>' : '') + '<w:t xml:space="preserve">' + xe(part) + '</w:t></w:r>');
      });
    };
    while ((m = re.exec(str))) {
      push(str.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith('**')) push(tok.slice(2, -2), '<w:b/><w:bCs/>');
      else push(tok.slice(1, -1), '<w:i/><w:iCs/>');
      last = m.index + tok.length;
    }
    push(str.slice(last));
    return out.join('');
  }
  function para(style, text, extra) {
    return '<w:p><w:pPr><w:pStyle w:val="' + style + '"/>' + (extra || '') + '</w:pPr>' + runs(text) + '</w:p>';
  }
  const HURUF = 'abcdefghijklmnopqrstuvwxyz';
  function penanda(i, gaya) {
    if (gaya === 'angka') return (i + 1) + '.';
    if (gaya === 'angka_kurung') return (i + 1) + ')';
    return (i < 26 ? HURUF[i] : HURUF[Math.floor(i / 26) - 1] + HURUF[i % 26]) + '.';
  }
  function tabelXml(rows) {
    rows = (rows || []).filter(r => r && r.some(c => String(c || '').trim()));
    if (!rows.length) return '';
    const ncol = Math.max(...rows.map(r => r.length));
    const total = 7640;
    // lebar kolom proporsional terhadap panjang isi (min 500)
    const len = Array.from({ length: ncol }, (_, c) => Math.max(4, ...rows.map(r => String(r[c] || '').length)));
    const sum = len.reduce((a, b) => a + Math.min(b, 40), 0);
    let widths = len.map(l => Math.max(700, Math.round(total * Math.min(l, 40) / sum)));
    const diff = total - widths.reduce((a, b) => a + b, 0);
    widths[widths.indexOf(Math.max(...widths))] += diff;
    const border = '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(b => '<w:' + b + ' w:val="single" w:sz="4" w:space="0" w:color="auto"/>').join('') + '</w:tblBorders>';
    let x = '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="' + total + '" w:type="dxa"/><w:tblInd w:w="1271" w:type="dxa"/>' + border +
      '<w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="1" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>' +
      widths.map(wd => '<w:gridCol w:w="' + wd + '"/>').join('') + '</w:tblGrid>';
    rows.forEach((r, ri) => {
      x += '<w:tr>' + (ri === 0 ? '<w:trPr><w:tblHeader/></w:trPr>' : '');
      for (let c = 0; c < ncol; c++) {
        const val = String(r[c] === undefined ? '' : r[c]);
        const lines = val.split('\n');
        x += '<w:tc><w:tcPr><w:tcW w:w="' + widths[c] + '" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>' +
          lines.map(l => para(ri === 0 ? 'NarasiTabelJudul' : 'NarasiTabel', l, (ri > 0 && /^\s*[\d.,%]+\s*$/.test(val) && c > 0) ? '<w:jc w:val="center"/>' : '')).join('') + '</w:tc>';
      }
      x += '</w:tr>';
    });
    x += '</w:tbl>';
    x += '<w:p><w:pPr><w:pStyle w:val="NarasiTabel"/></w:pPr></w:p>';
    return x;
  }
  function blokKeXml(blocks) {
    let sub = 0;
    const out = [];
    (blocks || []).forEach(b => {
      if (b.t === 'p') {
        bersih(b.text).split('\n').filter(Boolean).forEach(l => out.push(para('NarasiParagraf', l)));
      } else if (b.t === 'sub') {
        const j = bersih(b.judul);
        if (j) out.push(para('NarasiSubjudul', penanda(sub++, 'huruf') + '\t' + j));
        bersih(b.isi).split('\n').filter(Boolean).forEach(l => out.push(para('NarasiIsiSub', l)));
      } else if (b.t === 'list') {
        (b.items || []).map(bersih).filter(Boolean).forEach((it, i) => out.push(para('NarasiPoin', penanda(i, b.gaya) + '\t' + it)));
      } else if (b.t === 'tabel') {
        out.push(tabelXml(b.rows));
      }
    });
    return out.join('');
  }

  /* ---------------- proyek ---------------- */
  function proyekBaru(tahun, tw) {
    return {
      app: 'generator-capaian-kinerja-rendatin', versi: 1,
      tahun: tahun, tw: tw,
      umum: { tgl_pk: '', tgl_laporan: '', ttd_KPU: 'Aswika Budhi Arfandy', ttd_SEK: 'Suharto (Totok)' },
      anggaran: {
        dipa_revisi: '', diperbarui: false,
        program: [
          { kode: 'CQ', nama: 'Penyelenggaraan Pemilu dalam Proses Konsolidasi Demokrasi', nama_dipa: 'Penyelenggaraan Pemilihan Umum', kegiatan: [] },
          { kode: 'WA', nama: 'Dukungan Manajemen', nama_dipa: 'Dukungan Manajemen', kegiatan: [] }
        ],
        revisi: []
      },
      rapat: { tanggal: '', jam: '09.00', tempat: 'Rumah Pintar Pemilu (RPP) KPU Kabupaten Pacitan', peserta_KPU: [], peserta_SEK: [], penegasan: [], diperbarui: false },
      penutup: { kesimpulan_KPU: [], saran_KPU: [], kesimpulan_SEK: [], saran_SEK: [] },
      sheet: { KPU: null, SEK: null },
      narasi: { KPU: {}, SEK: {} },
      sampul: { KPU: null, SEK: null }
    };
  }
  function gantiTw(teks, dari, ke) {
    const a = ROMAWI[dari - 1], b = ROMAWI[ke - 1];
    const re1 = new RegExp('(Triwulan|TRIWULAN|TW)(\\s+)' + a + '(?![IV])', 'g');
    return String(teks).replace(re1, (m, k, sp) => k + sp + b);
  }
  function mapTeksBlok(blocks, fn) {
    return (blocks || []).map(b => {
      const n = JSON.parse(JSON.stringify(b));
      if (n.t === 'p') n.text = fn(n.text);
      if (n.t === 'sub') { n.judul = fn(n.judul); n.isi = fn(n.isi); }
      if (n.t === 'list') n.items = (n.items || []).map(fn);
      if (n.t === 'tabel') n.rows = (n.rows || []).map(r => r.map(fn));
      return n;
    });
  }
  function proyekTriwulanBerikut(p) {
    const tw = p.tw === 4 ? 1 : p.tw + 1;
    const tahun = p.tw === 4 ? p.tahun + 1 : p.tahun;
    const n = JSON.parse(JSON.stringify(p));
    n.tahun = tahun; n.tw = tw;
    n.umum.tgl_laporan = '';
    if (tahun !== p.tahun) n.umum.tgl_pk = '';
    n.anggaran.diperbarui = false;
    n.rapat.tanggal = ''; n.rapat.penegasan = []; n.rapat.diperbarui = false;
    n.sheet = { KPU: null, SEK: null };
    ['KPU', 'SEK'].forEach(j => {
      ['kesimpulan_' + j, 'saran_' + j].forEach(k => { n.penutup[k] = (n.penutup[k] || []).map(t => gantiTw(t, p.tw, tw)); });
      const src = p.narasi[j] || {};
      const dst = {};
      Object.keys(src).forEach(no => {
        dst[no] = {};
        ['kegiatan', 'kendala', 'upaya'].forEach(b => {
          const blocks = mapTeksBlok(src[no][b] && src[no][b].blocks, t => gantiTw(t, p.tw, tw));
          if (!blokKosong(blocks)) dst[no][b] = { blocks, asal: 'tw_lalu', hash_asal: hashBlok(blocks) };
        });
      });
      n.narasi[j] = dst;
    });
    return n;
  }

  /* ---------------- anggaran ---------------- */
  function hitungAnggaran(a) {
    const prog = (a.program || []).map(p => {
      const pagu = (p.kegiatan || []).reduce((s, k) => s + parseRupiah(k.pagu), 0);
      const real = (p.kegiatan || []).reduce((s, k) => s + parseRupiah(k.realisasi), 0);
      return { kode: p.kode, nama: p.nama, nama_dipa: p.nama_dipa, pagu, realisasi: real, sisa: pagu - real, kegiatan: p.kegiatan || [] };
    });
    const pagu = prog.reduce((s, p) => s + p.pagu, 0), real = prog.reduce((s, p) => s + p.realisasi, 0);
    return { program: prog, pagu, realisasi: real, sisa: pagu - real };
  }

  /* ---------------- data untuk template ---------------- */
  function nilai(v) { return v === undefined || v === null ? '' : String(v); }
  function dataLaporan(p, jenis) {
    const sheet = p.sheet[jenis];
    if (!sheet) throw new Error('Data capaian ' + JENIS[jenis].pendek + ' belum diambil dari spreadsheet.');
    const twR = ROMAWI[p.tw - 1];
    const ag = hitungAnggaran(p.anggaran);
    const iku = [], lamp = [], pk = [];
    sheet.sasaran.forEach(s => {
      const multi = s.indikator.length > 1;
      s.indikator.forEach((i, k) => {
        const vm = multi ? (k === 0 ? VMR : VMC) : '';
        const base = { vm_no: vm, vm_sas: vm, no: k === 0 ? s.no : '', sasaran: k === 0 ? s.sasaran : '',
          indikator: i.indikator, target: i.target, target_tw: i.target_tw, realisasi: i.realisasi };
        iku.push(base);
        lamp.push(Object.assign({}, base, { kendala: i.kendala, kegiatan: i.kegiatan, upaya: i.upaya, link: i.link, waktu: i.waktu, pj: i.pj }));
      });
      const nar = (p.narasi[jenis] || {})[s.no] || {};
      const xml = b => {
        const blocks = nar[b] && !blokKosong(nar[b].blocks) ? nar[b].blocks : narasiBawaan(jenis, s, b, p.tw);
        return blokKeXml(blocks);
      };
      pk.push({
        no: s.no, sasaran: s.sasaran,
        ind: s.indikator.map((i, k) => ({ no: String(k + 1), indikator: i.indikator, target: i.target, target_tw: i.target_tw, realisasi: i.realisasi })),
        n_kegiatan: xml('kegiatan'), n_kendala: xml('kendala'), n_upaya: xml('upaya')
      });
    });
    const r = p.rapat || {};
    const tglRapat = tglPanjang(r.tanggal);
    return {
      tw: twR, tahun: String(p.tahun), tgl_akhir_tw: tglAkhirTw(p.tahun, p.tw),
      tgl_pk: tglPanjang(p.umum.tgl_pk), jml_indikator: String(jumlahIndikator(sheet)),
      dipa_revisi: nilai(p.anggaran.dipa_revisi),
      pagu_total: rupiah(ag.pagu), pagu_terbilang: terbilang(ag.pagu),
      realisasi_total: rupiah(ag.realisasi), realisasi_terbilang: terbilang(ag.realisasi),
      sisa_total: rupiah(ag.sisa), persen_total: persen(ag.realisasi, ag.pagu),
      program: ag.program.map(x => ({ nama: x.nama, kode: x.kode, pagu: rupiah(x.pagu), realisasi: rupiah(x.realisasi), sisa: rupiah(x.sisa), persen: persen(x.realisasi, x.pagu) })),
      iku: iku,
      rapat_waktu: (namaHari(r.tanggal) ? namaHari(r.tanggal) + ', ' : '') + tglRapat + (r.jam ? ' pukul ' + r.jam + ' WIB' : ''),
      rapat_tempat: nilai(r.tempat), rapat_hari: namaHari(r.tanggal), rapat_tanggal: tglRapat,
      peserta: (r['peserta_' + jenis] || []).filter(Boolean),
      penegasan: (r.penegasan || []).filter(Boolean),
      pk: pk,
      revisi: (p.anggaran.revisi || []).map((x, i) => ({ no: String(i + 1), label: x.label, tanggal: tglPanjang(x.tanggal) || nilai(x.tanggal), pagu: rupiah(parseRupiah(x.pagu)) })),
      keg_program: ag.program.map(x => ({ kode: x.kode, nama_upper: String(x.nama_dipa || x.nama).toUpperCase(),
        kegiatan: x.kegiatan.map((k, i) => ({ no: String(i + 1), kode: nilai(k.kode), nama: nilai(k.nama), pagu: rupiah(parseRupiah(k.pagu)), realisasi: rupiah(parseRupiah(k.realisasi)) })) })),
      kesimpulan: (p.penutup['kesimpulan_' + jenis] || []).filter(Boolean),
      saran: (p.penutup['saran_' + jenis] || []).filter(Boolean),
      tgl_laporan: tglPanjang(p.umum.tgl_laporan),
      nama_ttd: nilai(p.umum['ttd_' + jenis]),
      lamp: lamp
    };
  }

  /* ---------------- pasca-proses: gabung sel vertikal ---------------- */
  function terapkanVMerge(xml) {
    let guard = 0;
    while (guard++ < 5000) {
      const iR = xml.indexOf(VMR), iC = xml.indexOf(VMC);
      if (iR < 0 && iC < 0) break;
      const pos = (iR < 0) ? iC : (iC < 0 ? iR : Math.min(iR, iC));
      const restart = pos === iR;
      const marker = restart ? VMR : VMC;
      let start = Math.max(xml.lastIndexOf('<w:tc>', pos), xml.lastIndexOf('<w:tc ', pos));
      const end = xml.indexOf('</w:tc>', pos);
      if (start < 0 || end < 0) { xml = xml.slice(0, pos) + xml.slice(pos + marker.length); continue; }
      let tc = xml.slice(start, end);
      tc = tc.replace(marker, '');
      tc = tc.replace(/<w:vMerge[^>]*\/>/g, '');
      const vm = restart ? '<w:vMerge w:val="restart"/>' : '<w:vMerge/>';
      if (/<w:tcPr>/.test(tc)) {
        if (/<w:tcW[^>]*\/>/.test(tc)) tc = tc.replace(/(<w:tcW[^>]*\/>)/, '$1' + (/<w:gridSpan[^>]*\/>/.test(tc) ? '' : vm));
        else tc = tc.replace('<w:tcPr>', '<w:tcPr>' + vm);
        if (/<w:gridSpan[^>]*\/>/.test(tc) && tc.indexOf(vm) < 0) tc = tc.replace(/(<w:gridSpan[^>]*\/>)/, '$1' + vm);
      } else {
        tc = tc.replace(/^(<w:tc[^>]*>)/, '$1<w:tcPr>' + vm + '</w:tcPr>');
      }
      if (!restart) {
        // kosongkan isi sel lanjutan (teks), pertahankan satu paragraf
        tc = tc.replace(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g, '<w:t></w:t>');
      }
      xml = xml.slice(0, start) + tc + xml.slice(end);
    }
    return xml;
  }

  /* ---------------- render docx ---------------- */
  function render(libs, templateBuf, data, opts) {
    opts = opts || {};
    const zip = new libs.PizZip(templateBuf);
    const doc = new libs.Docxtemplater(zip, {
      paragraphLoop: true, linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
      nullGetter: function () { return ''; }
    });
    try {
      doc.render(data);
    } catch (e) {
      const errs = (e.properties && e.properties.errors) || [];
      const msg = errs.length ? errs.map(x => (x.properties && (x.properties.explanation || x.properties.id)) || x.message).join('; ') : e.message;
      throw new Error('Template tidak valid: ' + msg);
    }
    const out = doc.getZip();
    let xml = out.file('word/document.xml').asText();
    xml = terapkanVMerge(xml);
    out.file('word/document.xml', xml);
    if (opts.sampul) gantiSampul(out, opts.sampul);
    return out.generate({ type: opts.type || 'blob', compression: 'DEFLATE',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  function gantiSampul(zip, bytes) {
    const xml = zip.file('word/document.xml').asText();
    const m = xml.match(/<a:blip[^>]*r:embed="([^"]+)"/);
    if (!m) return;
    const rels = zip.file('word/_rels/document.xml.rels').asText();
    const re = new RegExp('<Relationship[^>]*Id="' + m[1] + '"[^>]*>');
    const rel = rels.match(re);
    if (!rel) return;
    const target = (rel[0].match(/Target="([^"]+)"/) || [])[1];
    if (!target || !/\.jpe?g$/i.test(target)) return;
    zip.file('word/' + target.replace(/^\/?word\//, ''), bytes);
  }

  /* ---------------- pemeriksaan ---------------- */
  function urai(v) {
    const s = String(v || '').trim();
    const m = s.match(/^(-?[\d.,]+)\s*(%|[A-Za-z].*)?$/);
    if (!m) return null;
    let num = m[1];
    if (/^\d{1,3}(\.\d{3})+$/.test(num)) num = num.replace(/\./g, '');
    num = Number(num.replace(',', '.'));
    if (isNaN(num)) return null;
    const unit = (m[2] || '').trim().toLowerCase();
    return { num, unit, pct: unit === '%' };
  }
  function satuanSama(a, b) {
    const ua = a.unit.split(/\s+/)[0], ub = b.unit.split(/\s+/)[0];
    if (ua === ub) return true;
    return (!ua && ub !== '%') || (!ub && ua !== '%');
  }
  function periksa(p) {
    const hasil = [];
    const add = (level, bagian, pesan, lokasi, perbaikan) => hasil.push({ level, bagian, pesan, lokasi: lokasi || null, perbaikan: perbaikan || null });
    const twR = ROMAWI[p.tw - 1];
    ['KPU', 'SEK'].forEach(j => {
      const nm = JENIS[j].pendek;
      const sh = p.sheet[j];
      if (!sh) { add('error', 'Data capaian', 'Data capaian ' + nm + ' belum diambil.', { langkah: 'data' }); return; }
      if (sh.tw_header && sh.tw_header !== p.tw) add('warning', 'Data capaian', 'Sheet ' + nm + ' (' + (sh.nama_sheet || '') + ') berisi data Triwulan ' + ROMAWI[sh.tw_header - 1] + ', sedangkan laporan ini Triwulan ' + twR + '.', { langkah: 'data' });
      sh.sasaran.forEach(s => {
        s.indikator.forEach((i, k) => {
          const lok = { langkah: 'narasi', jenis: j, no: s.no };
          const label = nm + ' sasaran ' + s.no + (s.indikator.length > 1 ? ' (indikator ' + (k + 1) + ')' : '');
          const T = urai(i.target), TW = urai(i.target_tw), R = urai(i.realisasi);
          if (!i.target || !i.target_tw || !i.realisasi) add('warning', 'Capaian', label + ': target/target TW/realisasi ada yang kosong.', lok);
          if (T && TW && satuanSama(T, TW) && TW.num > T.num) add('warning', 'Capaian', label + ': target TW (' + i.target_tw + ') lebih besar dari target tahunan (' + i.target + ').', lok);
          if (T && TW && !satuanSama(T, TW)) add('info', 'Capaian', label + ': satuan target tahunan (' + i.target + ') berbeda dengan target TW (' + i.target_tw + ').', lok);
          if (TW && R && satuanSama(TW, R) && R.num < TW.num) add('warning', 'Capaian', label + ': realisasi (' + i.realisasi + ') belum mencapai target TW (' + i.target_tw + '). Pastikan narasi menjelaskan penyebabnya.', lok);
          if (TW && R && satuanSama(TW, R) && TW.num > 0 && R.num > TW.num * 3) add('info', 'Capaian', label + ': realisasi (' + i.realisasi + ') jauh melampaui target TW (' + i.target_tw + '). Pertimbangkan meninjau target atau beri penjelasan.', lok);
        });
        const nar = (p.narasi[j] || {})[s.no] || {};
        ['kegiatan', 'kendala', 'upaya'].forEach(b => {
          const lok = { langkah: 'narasi', jenis: j, no: s.no, bagian: b };
          const lbl = nm + ' sasaran ' + s.no + ' — ' + ({ kegiatan: 'kegiatan', kendala: 'kendala', upaya: 'upaya' })[b];
          const item = nar[b];
          if (!item || blokKosong(item.blocks)) { add('info', 'Narasi', lbl + ': belum dikembangkan, memakai teks ringkas dari spreadsheet.', lok); return; }
          if (item.asal === 'tw_lalu' && item.hash_asal === hashBlok(item.blocks)) add('warning', 'Narasi', lbl + ': masih sama persis dengan triwulan lalu, belum disunting.', lok);
          const t = teksBlok(item.blocks);
          const salah = (t.match(/(Triwulan|TRIWULAN|TW)\s+(IV|III|II|I)(?![IV])/g) || []).filter(x => !x.endsWith(' ' + twR));
          if (salah.length) add('warning', 'Narasi', lbl + ': menyebut "' + salah[0] + '", padahal laporan Triwulan ' + twR + '.', lok, { jenis: 'tw', dari: salah[0] });
        });
      });
      if (!(p.penutup['kesimpulan_' + j] || []).filter(Boolean).length) add('warning', 'Penutup', 'Kesimpulan ' + nm + ' masih kosong.', { langkah: 'rapat' });
      if (!(p.rapat['peserta_' + j] || []).filter(Boolean).length) add('warning', 'Rapat', 'Daftar peserta rapat untuk ' + nm + ' masih kosong.', { langkah: 'rapat' });
      if (!p.umum['ttd_' + j]) add('error', 'Umum', 'Nama penandatangan ' + nm + ' kosong.', { langkah: 'rapat' });
    });
    const a = p.anggaran;
    const ag = hitungAnggaran(a);
    if (!a.dipa_revisi) add('warning', 'Anggaran', 'Nomor revisi DIPA belum diisi.', { langkah: 'anggaran' });
    if (!ag.pagu) add('error', 'Anggaran', 'Pagu per kegiatan belum diisi.', { langkah: 'anggaran' });
    if (!a.diperbarui) add('warning', 'Anggaran', 'Data anggaran belum ditandai "sudah diperbarui" untuk Triwulan ' + twR + '.', { langkah: 'anggaran' });
    ag.program.forEach(pr => pr.kegiatan.forEach(k => {
      if (parseRupiah(k.realisasi) > parseRupiah(k.pagu)) add('error', 'Anggaran', 'Realisasi kegiatan ' + (k.kode || '') + ' ' + (k.nama || '') + ' melebihi pagunya.', { langkah: 'anggaran' });
    }));
    const rev = a.revisi || [];
    if (rev.length) {
      const last = rev[rev.length - 1];
      if (parseRupiah(last.pagu) && parseRupiah(last.pagu) !== ag.pagu) add('warning', 'Anggaran', 'Pagu revisi terakhir (Rp ' + rupiah(parseRupiah(last.pagu)) + ') berbeda dengan jumlah pagu per kegiatan (Rp ' + rupiah(ag.pagu) + ').', { langkah: 'anggaran' });
      const mm = String(last.label || '').match(/(\d+)/);
      if (a.dipa_revisi && mm && mm[1] !== String(a.dipa_revisi).replace(/\D/g, '')) add('warning', 'Anggaran', 'Revisi DIPA tertulis ke-' + a.dipa_revisi + ', tetapi baris terakhir tabel revisi adalah "' + last.label + '".', { langkah: 'anggaran' });
    } else add('warning', 'Anggaran', 'Tabel riwayat revisi DIPA masih kosong.', { langkah: 'anggaran' });
    const r = p.rapat;
    if (!r.tanggal) add('error', 'Rapat', 'Tanggal rapat monev belum diisi.', { langkah: 'rapat' });
    if (!r.diperbarui) add('warning', 'Rapat', 'Data rapat belum ditandai "sudah diperbarui" untuk Triwulan ' + twR + '.', { langkah: 'rapat' });
    if (!(r.penegasan || []).filter(Boolean).length) add('warning', 'Rapat', 'Poin penegasan/arahan pimpinan masih kosong.', { langkah: 'rapat' });
    if (!p.umum.tgl_pk) add('warning', 'Umum', 'Tanggal Perjanjian Kinerja belum diisi.', { langkah: 'rapat' });
    if (!p.umum.tgl_laporan) add('warning', 'Umum', 'Tanggal laporan belum diisi.', { langkah: 'rapat' });
    if (p.umum.tgl_laporan && r.tanggal && p.umum.tgl_laporan < r.tanggal) add('warning', 'Umum', 'Tanggal laporan lebih awal dari tanggal rapat monev.', { langkah: 'rapat' });
    const akhir = p.tahun + '-' + String(AKHIR_TW[p.tw - 1][0]).padStart(2, '0') + '-' + AKHIR_TW[p.tw - 1][1];
    if (r.tanggal && r.tanggal < akhir) add('info', 'Rapat', 'Tanggal rapat sebelum akhir Triwulan ' + twR + ' (' + tglAkhirTw(p.tahun, p.tw) + ').', { langkah: 'rapat' });
    return hasil;
  }
  function perbaikiTw(p) {
    const tw = p.tw, twR = ROMAWI[tw - 1];
    let n = 0;
    ['KPU', 'SEK'].forEach(j => Object.values(p.narasi[j] || {}).forEach(item => ['kegiatan', 'kendala', 'upaya'].forEach(b => {
      if (!item[b]) return;
      item[b].blocks = mapTeksBlok(item[b].blocks, t => String(t).replace(/(Triwulan|TRIWULAN|TW)(\s+)(IV|III|II|I)(?![IV])/g, (m, k, sp, r) => { if (r !== twR) n++; return k + sp + twR; }));
    })));
    return n;
  }

  const API = {
    ROMAWI, BULAN, JENIS, VMR, VMC,
    rupiah, persen, terbilang, parseRupiah, tglPanjang, namaHari, tglAkhirTw,
    parseGrid, tebakSheet, jumlahIndikator, bersih,
    blokDariTeks, narasiBawaan, blokKosong, teksBlok, hashBlok, blokKeXml,
    proyekBaru, proyekTriwulanBerikut, gantiTw, hitungAnggaran,
    dataLaporan, terapkanVMerge, render, periksa, perbaikiTw
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.GCK = API;
})(typeof window !== 'undefined' ? window : this);

/* UI primitives: icons, pills, tables, tiles, charts, csv. */
(function () {
'use strict';
const SP = window.SP, esc = SP.esc;

const IC = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 9.5V20h14V9.5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 010 6.8M18.5 14.3c2 .7 3.5 2.6 3.5 5.7"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
  userplus: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M19 8v6M16 11h6"/>',
  chat: '<path d="M21 12a8 8 0 01-11.6 7.1L3 21l1.9-5.4A8 8 0 1121 12z"/>',
  mega: '<path d="M3 10v4l12 5V5L3 10z"/><path d="M18 9a4 4 0 010 6M6.5 15l1 5h3l-1-4.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 017.5-2"/>',
  book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z"/><path d="M4 19a2 2 0 012-2h13"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v.01M18 14.5v.01"/>',
  wallet: '<path d="M3 7a2 2 0 012-2h13v4"/><path d="M3 7v11a2 2 0 002 2h15V9H5a2 2 0 01-2-2z"/><circle cx="16.5" cy="14.5" r="1"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  bell: '<path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15L6 16z"/><path d="M10 21h4"/>',
  check: '<path d="M4 12.5l5 5L20 6.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
  dl: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
  print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
  send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  wand: '<path d="M4 20L16 8M14 4l1.2 2.3L17.5 7.5 15.2 8.7 14 11l-1.2-2.3L10.5 7.5l2.3-1.2L14 4zM19 13l.7 1.3 1.3.7-1.3.7L19 17l-.7-1.3-1.3-.7 1.3-.7L19 13z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alert: '<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4.5M12 17.5v.01"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  school: '<path d="M2 9l10-5 10 5-10 5L2 9z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5M22 9v6"/>',
  card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6 15h4"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8L12 3.5z"/>',
  scan: '<path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16"/>',
  whatsapp: '<path d="M4 20l1.2-4A8.5 8.5 0 1112 20.5a8.4 8.4 0 01-4-1L4 20z"/><path d="M9 9c.5 2.7 2.3 4.5 6 6l1.2-1.4-2-1-1 .7c-.9-.4-1.6-1.1-2-2l.7-1-1-2L9 9z"/>',
  sms: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21l3-4M8 10h8M8 13h5"/>',
  trend: '<path d="M3 17l6-6 4 4 8-9M15 6h6v6"/>',
  doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 13h7M9 17h5"/>',
  pen: '<path d="M4 20l1-4L17 4l3 3L8 19l-4 1z"/>',
  award: '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 14L7 21l5-3 5 3-1.5-7"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 01-.6-8.96A6 6 0 0117.6 8.4 4.8 4.8 0 0117 18H7z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  clip: '<path d="M20 11.5l-8 8a5 5 0 01-7-7l8.5-8.5a3.3 3.3 0 014.7 4.7L9.6 17.3a1.7 1.7 0 01-2.4-2.4L15 7"/>',
  refresh: '<path d="M20 6v5h-5M4 18v-5h5"/><path d="M19 11a7 7 0 00-12-3.5L4 11M5 13a7 7 0 0012 3.5L20 13"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 015 .8c0 1.7-2.5 2.2-2.5 3.7M12 17.5v.01"/>',
  board: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
};
SP.icon = (n, cls) => '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>';
const I = SP.icon;

SP.logo = () => '<svg viewBox="0 0 32 32" width="30" height="30"><rect width="32" height="32" rx="9" fill="#0071e3"/><path d="M6 13l10-5 10 5-10 5z" fill="#fff"/><path d="M10 16.5v4.2c0 1.2 2.7 2.8 6 2.8s6-1.6 6-2.8v-4.2l-6 3z" fill="#a8d1fa"/><path d="M26 13v6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></svg>';

/* ---------- small components ---------- */
SP.pill = (t, tone) => '<span class="pill ' + (tone || 'gray') + '">' + t + '</span>';
const TONES = ['t1', 't2', 't3', 't4', 't5', 't6'];
SP.avatar = (name, size) => '<span class="avatar ' + TONES[Math.floor(SP.hash01(name) * TONES.length)] + (size ? ' ' + size : '') + '">' + esc(SP.initials(name)) + '</span>';
SP.person = (name, sub, size) => '<div class="person">' + SP.avatar(name, size) + '<div class="pn"><div class="n">' + esc(name) + '</div>' + (sub ? '<div class="s">' + sub + '</div>' : '') + '</div></div>';
SP.head = (title, sub, actions) => '<div class="page-head"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div><div class="ph-actions">' + (actions || '') + '</div></div>';
SP.btn = (label, act, o) => { o = o || {}; const d = Object.keys(o.d || {}).map(k => ' data-' + k + '="' + esc(o.d[k]) + '"').join(''); return '<button class="btn ' + (o.c || '') + '" data-act="' + act + '"' + d + (o.tour ? ' data-tour="' + o.tour + '"' : '') + (o.dis ? ' disabled' : '') + '>' + (o.i ? I(o.i) : '') + (label ? '<span>' + label + '</span>' : '') + '</button>'; };
SP.empty = (t, s) => '<div class="empty">' + I('search') + '<b>' + t + '</b>' + (s ? '<span>' + s + '</span>' : '') + '</div>';
SP.tile = (o) => '<button class="tile ' + (o.sel ? 'sel ' : '') + (/[1-9]/.test(String(o.value)) ? (o.tone || '') : '') + '"' + (o.act ? ' data-act="' + o.act + '"' : '') + (o.d && !o.attrs ? ' data-k="' + o.d + '"' : '') + (o.attrs ? ' ' + o.attrs : '') + (o.tour ? ' data-tour="' + o.tour + '"' : '') + '>' +
  '<div class="t-top"><span class="t-l">' + o.label + '</span></div><div class="t-v">' + o.value + '</div>' + (o.sub ? '<div class="t-s">' + o.sub + '</div>' : '') + '</button>';
SP.kv = rows => '<div class="kvs">' + rows.map(r => '<div class="kv"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join('') + '</div>';
SP.tabs = (items, cur, act) => '<div class="tabs">' + items.map(t => '<button class="tab ' + (t.k === cur ? 'on' : '') + '" data-act="' + act + '" data-k="' + t.k + '">' + t.label + (t.n != null ? '<i>' + t.n + '</i>' : '') + '</button>').join('') + '</div>';
SP.select = (k, opts, cur, cls) => '<select class="input ' + (cls || '') + '" id="f-' + k + '" data-ch="filter" data-k="' + k + '">' + opts.map(o => '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(cur) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';
SP.search = (k, ph) => '<label class="search">' + I('search') + '<input id="f-' + k + '" class="input" data-in="filter" data-k="' + k + '" placeholder="' + esc(ph) + '" value="' + esc(SP.f(k)) + '" autocomplete="off"></label>';
SP.classOptions = (all) => (all ? [['', all]] : []).concat(SP.CLASSES.map(c => [c.id, c.label]));
SP.card = (title, body, right, cls) => '<section class="card ' + (cls || '') + '">' + (title ? '<div class="card-h"><h3>' + title + '</h3><div>' + (right || '') + '</div></div>' : '') + '<div class="card-b">' + body + '</div></section>';

SP.table = function (key, cols, rows, o) {
  o = o || {}; const per = o.per || 15;
  const pages = Math.max(1, Math.ceil(rows.length / per)); let pg = Math.min(SP.ui.page[key] || 0, pages - 1); SP.ui.page[key] = pg;
  const slice = rows.slice(pg * per, pg * per + per);
  if (!rows.length) return '<div class="tbl-wrap">' + SP.empty(o.empty || 'Nothing matches these filters', 'Try clearing a filter.') + '</div>';
  return '<div class="tbl-wrap"><div class="tbl-scroll"><table class="tbl"><thead><tr>' + cols.map(c => '<th class="' + (c.cls || '') + '">' + c.h + '</th>').join('') + '</tr></thead><tbody>' +
    slice.map((r, i) => '<tr' + (o.row ? ' class="clk" data-act="' + o.row + '" data-id="' + esc(r.id || r.s && r.s.id || '') + '"' : '') + (o.tourRow && i === 0 ? ' data-tour="' + o.tourRow + '"' : '') + '>' + cols.map(c => '<td class="' + (c.cls || '') + '">' + c.f(r, i) + '</td>').join('') + '</tr>').join('') +
    '</tbody></table></div>' +
    '<div class="pager"><span>Showing ' + (pg * per + 1) + '–' + Math.min(rows.length, pg * per + per) + ' of ' + rows.length.toLocaleString() + '</span><div>' +
    '<button class="btn sm" data-act="page" data-key="' + key + '" data-d="-1"' + (pg === 0 ? ' disabled' : '') + '>' + I('left') + '</button><span class="pg">' + (pg + 1) + ' / ' + pages + '</span>' +
    '<button class="btn sm" data-act="page" data-key="' + key + '" data-d="1"' + (pg >= pages - 1 ? ' disabled' : '') + '>' + I('right') + '</button></div></div></div>';
};

/* ---------- charts ---------- */
SP.donut = function (pct, o) {
  o = o || {}; const s = o.size || 84, r = s / 2 - 8, c = 2 * Math.PI * r, col = o.color || 'var(--brand)';
  return '<div class="donut" style="width:' + s + 'px;height:' + s + 'px"><svg viewBox="0 0 ' + s + ' ' + s + '"><circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="8"/>' +
    '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + (c * pct / 100) + ' ' + c + '" transform="rotate(-90 ' + s / 2 + ' ' + s / 2 + ')"/></svg><b>' + (o.label || Math.round(pct) + '%') + '</b></div>';
};
SP.hbars = function (items, o) {
  o = o || {}; const max = o.max || Math.max.apply(null, items.map(i => i.value).concat([1]));
  return '<div class="hbars">' + items.map(i => '<div class="hb"><span class="hl">' + esc(i.label) + '</span><span class="hbar"><i style="width:' + Math.max(2, i.value / max * 100) + '%;background:' + (i.color || 'var(--brand)') + '"></i></span><b>' + (o.fmt ? o.fmt(i.value) : i.value) + '</b></div>').join('') + '</div>';
};
SP.cols = function (vals, labels, o) {
  o = o || {}; const W = 420, H = o.h || 170, pl = 30, pb = 22, pt = 10, n = vals.length;
  const lo = o.min != null ? o.min : 0, hi = o.max != null ? o.max : Math.max.apply(null, vals) * 1.1, bw = (W - pl) / n;
  let g = ''; [0, .5, 1].forEach(t => { const y = pt + (H - pt - pb) * (1 - t); g += '<line x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="var(--line)"/><text x="' + (pl - 5) + '" y="' + (y + 3) + '" text-anchor="end">' + (o.fmt ? o.fmt(lo + (hi - lo) * t) : Math.round(lo + (hi - lo) * t)) + '</text>'; });
  const bars = vals.map((v, i) => { const h = Math.max(1, (H - pt - pb) * (v - lo) / (hi - lo)), x = pl + i * bw + bw * .18, w = bw * .64; const hl = o.hl != null && o.hl === i; return '<rect x="' + x + '" y="' + (H - pb - h) + '" width="' + w + '" height="' + h + '" rx="3" fill="' + (hl ? 'var(--brand)' : (o.color || 'var(--brand-soft)')) + '"><title>' + esc(labels[i]) + ': ' + (o.fmt ? o.fmt(v) : v) + '</title></rect><text x="' + (x + w / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(labels[i]) + '</text>'; }).join('');
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' + g + bars + '</svg>';
};

/* ---------- csv / print ---------- */
SP.csv = function (name, head, rows) {
  const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const txt = [head].concat(rows).map(r => r.map(q).join(',')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + txt], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  SP.toast('Exported ' + name);
};
SP.act.print = () => window.print();
})();

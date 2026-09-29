/* System status (backend health): services, messaging, ERPNext sync, backups, gate readers, jobs, incident log. */
(function () {
'use strict';
const SP = window.SP, I = SP.icon, esc = SP.esc, D = SP.D, P = SP.pages;
const sysLog = (t, sev) => { SP.S.sys.log.unshift({ ts: SP.stamp(), sev: sev || 'info', title: t }); };

// count outgoing messages by channel so the messaging panel moves when the demo sends something
const _deliver = SP.deliver;
SP.deliver = function (o) { const s = SP.S.sys.sent = SP.S.sys.sent || { push: 1204, whatsapp: 312, sms: 186 }; o.channels.forEach(c => { s[c] = (s[c] || 0) + o.total; }); return _deliver(o); };

const lat = (base, key) => Math.round(base * (.85 + SP.hash01(key + SP.S.sys.checks) * .3));
const READERS = [['Main gate — entry', 'Gate 1', '08:11'], ['Main gate — exit', 'Gate 1', '10:02'], ['Junior block', 'Gate 2', '09:47'], ['Bus bay', 'Gate 3', '10:15']];
const JOBS = [['Fee reminders', 'Daily 09:00', 'Today 09:00', 'Tomorrow 09:00', 'ok'], ['Attendance summary to principal', 'Daily 14:00', 'Yesterday 14:00', 'Today 14:00', 'ok'], ['ERPNext sync', 'Every 15 minutes', 'Today 10:05', 'Today 10:20', 'ok'], ['Database backup', 'Daily 02:00', 'Today 02:00', 'Tomorrow 02:00', 'ok'], ['Weekly report emails', 'Monday 08:00', 'Mon 28 Sep 08:00', 'Mon 5 Oct 08:00', 'ok']];

function run() { return SP.ui.sysRun; }
function svcState(i) { const r = run(); if (!r) return 'ok'; return i < r.i ? 'ok' : i === r.i ? 'check' : 'wait'; }

P['admin.system'] = function () {
  const S = SP.S, sys = S.sys, r = run(), sent = sys.sent || { push: 1204, whatsapp: 312, sms: 186 };
  const cards = SP.SERVICES.map((s, i) => {
    const st = svcState(i), bar = SP.uptimeBar(s[0]);
    return '<div class="svc ' + st + '"><div class="row-c" style="gap:10px;flex-wrap:nowrap"><span class="ai ' + (st === 'ok' ? 'green' : 'brand') + '">' + (st === 'check' ? '<i class="spin sm"></i>' : I(s[3])) + '</span><div class="grow"><b>' + s[1] + '</b><span>' + s[2] + '</span></div>' + (st === 'check' ? SP.pill('Checking…', 'blue') : st === 'wait' ? SP.pill('Queued', 'gray') : SP.pill('Operational', 'green')) + '</div>' +
      '<div class="svc-m"><div><span>Response</span><b>' + (st === 'ok' ? lat(s[5], s[0]) + ' ms' : '—') + '</b></div><div><span>30-day uptime</span><b>' + s[4].toFixed(2) + '%</b></div></div><div class="ubar" title="Last 60 days">' + bar.map(x => '<i class="' + x + '"></i>').join('') + '</div></div>';
  }).join('');
  const usage = (label, val, max, unit, col) => '<div class="usage"><div class="row-c" style="justify-content:space-between;gap:8px"><span>' + label + '</span><b>' + val.toLocaleString() + (max ? ' / ' + max.toLocaleString() : '') + ' ' + unit + '</b></div>' + (max ? '<div class="qbar"><i style="width:' + Math.min(100, 100 * val / max) + '%;background:' + (col || 'var(--brand)') + '"></i></div>' : '') + '</div>';
  const incidents = sys.log.map(l => ({ ts: l.ts, sev: l.sev, title: l.title, body: '', dur: '' })).concat(SP.INCIDENTS);
  return SP.head('System status', 'Live health of everything behind the portal', SP.btn('Run health check', 'sysCheck', { i: 'refresh', c: 'pri', d: {}, dis: !!r, tour: 'sys-check' })) +
    '<div class="banner ' + (r ? '' : 'okb') + '">' + I(r ? 'refresh' : 'check') + '<div><b>' + (r ? 'Running health check… ' + Math.min(r.i, SP.SERVICES.length) + ' of ' + SP.SERVICES.length + ' services checked' : 'All systems operational') + '</b><br><span class="hint">Last check ' + D.niceTs(sys.lastCheck) + ' · 99.97% uptime over the last 30 days · Hosted in Pakistan (Lahore region)</span></div></div>' +
    '<div class="svcgrid">' + cards + '</div>' +
    '<div class="g2"><section class="card"><div class="card-h"><h3>Messaging today</h3></div><div class="card-b">' + usage('App push notifications sent', sent.push, 0, '') + '<div class="hint" style="margin:-6px 0 10px">99.4% delivered · 0 failed</div>' + usage('WhatsApp conversations (monthly quota)', sent.whatsapp, 1000, '', 'var(--green)') + '<div class="hint" style="margin:-6px 0 10px">98% delivered · 2% auto-sent by SMS instead</div>' + usage('SMS credits used today', sent.sms, 0, '') + '<div class="hint" style="margin:-6px 0 0">' + (12000 - sent.sms).toLocaleString() + ' credits remaining · low-balance alert at 1,000</div></div></section>' +
    '<section class="card"><div class="card-h"><h3>Infrastructure</h3></div><div class="card-b">' + usage('File storage (notes, photos, documents)', 42.3, 100, 'GB') + usage('Database size', 3.8, 20, 'GB') + usage('Bandwidth this month', 186, 500, 'GB') +
    '<h4 style="margin:14px 0 6px;font-size:13px;color:var(--muted)">Active sessions right now</h4><div class="mini3"><div><span>Admin & staff</span><b>' + 9 + '</b></div><div><span>Teachers</span><b>14</b></div><div><span>Parents + students</span><b>' + (268 + 121) + '</b></div></div></div></section></div>' +
    '<div class="g2"><section class="card"><div class="card-h"><h3>ERPNext connection</h3>' + SP.pill(sys.erpQueue ? sys.erpQueue + ' queued' : 'In sync', sys.erpQueue ? 'amber' : 'green') + '</div><div class="card-b">' + SP.kv([['Site', 'greenfield.erp.school-portal.pk'], ['Last sync', D.niceTs(sys.erpSync)], ['Documents waiting', sys.erpQueue + ' (invoices & payment entries)'], ['Mode', 'Automatic every 15 minutes']]) + '<div class="dr-act">' + SP.btn('Sync now', 'sysErp', { c: 'pri', i: 'refresh', tour: 'sys-erp' }) + SP.btn('Open in ERPNext', 'erp', { i: 'right', d: { w: 'ar' } }) + '</div></div></section>' +
    '<section class="card"><div class="card-h"><h3>Backups</h3>' + SP.pill('Healthy', 'green') + '</div><div class="card-b">' + SP.kv([['Last backup', D.niceTs(sys.backup)], ['Size', '3.8 GB (encrypted)'], ['Retention', '30 daily · 12 monthly'], ['Stored in', 'Two regions · Lahore & Karachi'], ['Next scheduled', 'Tomorrow 02:00']]) + '<div class="dr-act">' + SP.btn('Run backup now', 'sysBackup', { i: 'cloud', c: 'pri' }) + SP.btn('Restore points', 'sysRestore') + '</div></div></section></div>' +
    '<h3 class="sec">Gate readers</h3>' + SP.table('rdr', [{ h: 'Device', f: x => '<b>' + x[0] + '</b>' }, { h: 'Location', f: x => x[1] }, { h: 'Status', f: x => SP.pill('Online', 'green') }, { h: 'Last scan', cls: 'mono', f: x => x[2] }, { h: 'Firmware', f: x => 'v3.2.1' }, { h: '', cls: 'r', f: x => SP.btn('Test ping', 'sysPing', { c: 'sm', d: { n: x[0] } }) }], READERS.map(x => Object.assign(x, { id: x[0] })), { per: 8 }) +
    '<h3 class="sec">Scheduled jobs</h3>' + SP.table('jobs', [{ h: 'Job', f: x => '<b>' + x[0] + '</b>' }, { h: 'Schedule', f: x => x[1] }, { h: 'Last run', f: x => x[2] }, { h: 'Next run', f: x => x[3] }, { h: 'Status', f: x => SP.pill('Healthy', 'green') }, { h: '', cls: 'r', f: x => SP.btn('Run now', 'sysJob', { c: 'sm', d: { n: x[0] } }) }], JOBS.map(x => Object.assign(x, { id: x[0] })), { per: 8 }) +
    '<h3 class="sec">Incidents & activity log</h3><section class="card"><div class="card-b">' + incidents.slice(0, 9).map(x => '<div class="incident"><i class="' + x.sev + '"></i><div class="grow"><b>' + esc(x.title) + '</b>' + (x.body ? '<span>' + esc(x.body) + '</span>' : '') + '</div><em>' + D.niceTs(x.ts) + (x.dur ? ' · ' + x.dur : '') + '</em></div>').join('') + '</div></section>';
};

SP.act.sysCheck = () => {
  if (run()) return; SP.ui.sysRun = { i: 0 };
  const tick = () => { const r = SP.ui.sysRun; if (!r) return; r.i++; if (r.i > SP.SERVICES.length) { SP.ui.sysRun = null; SP.S.sys.checks++; SP.S.sys.lastCheck = SP.stamp(); sysLog('Health check — all ' + SP.SERVICES.length + ' services operational'); SP.toast('Health check complete · all systems operational'); SP.render(); return; } SP.render(); setTimeout(tick, 320); };
  SP.render(); setTimeout(tick, 320);
};
SP.act.sysErp = () => { const q = SP.S.sys.erpQueue; SP.S.sys.erpQueue = 0; SP.S.sys.erpSync = SP.stamp(); sysLog('ERPNext sync — ' + (q + 4) + ' documents pushed'); SP.deliver({ title: 'ERPNext sync', total: q + 4, channels: ['push'], note: 'Invoices and payment entries posted' }); SP.render(); };
SP.act.sysBackup = () => { SP.S.sys.backup = SP.stamp(); sysLog('Manual backup completed (3.8 GB)'); SP.toast('Backup completed and verified'); SP.render(); };
SP.act.sysRestore = () => SP.toast('Restore points are managed by the hosting team (demo)');
SP.act.sysPing = d => SP.toast(d.n + ' responded in ' + (18 + Math.floor(SP.hash01(d.n + SP.S.clock) * 30)) + ' ms');
SP.act.sysJob = d => { sysLog('Job “' + d.n + '” run manually'); SP.toast(d.n + ' ran successfully'); SP.render(); };
})();

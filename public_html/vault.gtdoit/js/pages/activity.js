// ── Activity log ───────────────────────────────────────────────────

const ACT_ICONS = {
  create:           '➕',
  update:           '✏️',
  delete:           '🗑️',
  done:             '✅',
  recurring_create: '🔄',
  loan:             '📤',
  return:           '↩️',
  csv_import:       '📥',
};

const ACT_LABELS = {
  item:      'Sak',
  task:      'Uppgift',
  service:   'Service',
  receipt:   'Kvitto',
  checklist: 'Lista',
  document:  'Dokument',
  loan:      'Lån',
};

function actIcon(action) { return ACT_ICONS[action] || '📋'; }
function actLabel(type)  { return ACT_LABELS[type]  || type; }

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return 'nyss';
  if (diff < 3600)  return Math.floor(diff / 60) + ' min sedan';
  if (diff < 86400) return Math.floor(diff / 3600) + ' tim sedan';
  const d = Math.floor(diff / 86400);
  return d === 1 ? 'igår' : d + ' dagar sedan';
}

async function loadActivity() {
  try {
    A.activity = await api('GET', 'activity?limit=40') || [];
  } catch { A.activity = []; }
}

function renderActivityFeed(limit = 10) {
  const items = (A.activity || []).slice(0, limit);
  if (!items.length) return `<div style="text-align:center;padding:16px;font-size:13px;color:var(--ink3)">Ingen aktivitet ännu</div>`;
  return items.map(a => `
    <div class="act-row">
      <div class="act-icon">${actIcon(a.action)}</div>
      <div class="act-body">
        <div class="act-name">${esc(a.entity_name || actLabel(a.entity_type))}</div>
        <div class="act-meta">${esc(a.username || '?')} · ${actLabel(a.entity_type)} · ${timeAgo(a.created_at)}</div>
      </div>
    </div>`).join('');
}

// ── Inventory value sparkline ──────────────────────────────────────
async function loadSnapshots() {
  try {
    A.snapshots = await api('GET', 'snapshots') || [];
  } catch { A.snapshots = []; }
}

function renderValueSparkline(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const snaps = (A.snapshots || []).slice(-30); // last 30 days
  if (snaps.length < 2) { el.innerHTML = `<div style="font-size:11px;color:var(--ink3);padding:8px">Inte tillräckligt med data ännu</div>`; return; }

  const vals  = snaps.map(s => parseFloat(s.total_value));
  const min   = Math.min(...vals);
  const max   = Math.max(...vals);
  const range = max - min || 1;
  const W = 260, H = 50, pad = 4;

  const pts = snaps.map((s, i) => {
    const x = pad + (i / (snaps.length - 1)) * (W - pad * 2);
    const y = H - pad - ((parseFloat(s.total_value) - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  const latest = vals[vals.length - 1];
  const first  = vals[0];
  const diff   = latest - first;
  const color  = diff >= 0 ? 'var(--green)' : 'var(--rose)';
  const arrow  = diff >= 0 ? '▲' : '▼';

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
      <span style="font-size:11px;color:var(--ink3)">Inventarievärde (30 dagar)</span>
      <span style="font-size:12px;font-weight:600;color:${color}">${arrow} ${Math.abs(diff).toLocaleString('sv-SE')} kr</span>
    </div>
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="display:block">
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--ink3);margin-top:2px">
      <span>${snaps[0].snapshot_date}</span>
      <span>${snaps[snaps.length-1].snapshot_date}</span>
    </div>`;
}

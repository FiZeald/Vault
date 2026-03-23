// ── Global state ───────────────────────────────────────────────────
const ADMIN_EMAIL = 'admin@gtdoit.com';

const A = {
  token: localStorage.getItem('vault_t'),
  user: null,
  families: [],
  activeFamilyId: null,
  items: [], cats: [], tasks: [], svcs: [], members: [], receipts: [],
  ecoBudgetCats: [], ecoTrans: [], checklists: [],
  ecoSummary: null,
  ecoMonth: new Date().toISOString().slice(0,7),
  page: 'dash',
  photo: null,
  editId: null,
  searchQ: '',
};

// ── Theme (runs immediately before body renders) ────────────────────
(function(){
  const saved = localStorage.getItem('vault_theme');
  // Respect system preference if no saved preference
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();

function toggleTheme(){
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('vault_theme', next);
  const icon = next === 'dark' ? '☀️' : '🌙';
  ['theme-icon','theme-icon2'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.textContent = icon;
  });
  // Update theme-color meta
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.content = next === 'dark' ? '#0A0D14' : '#F0F2F8';
}

// ── API helper ─────────────────────────────────────────────────────
async function api(method, path, body){
  const opts = { method, headers: {} };
  if(A.token) opts.headers['Authorization'] = 'Bearer ' + A.token;
  if(body){
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  let r;
  try {
    r = await fetch('api/' + path, opts);
  } catch(e) {
    throw new Error('Nätverksfel – kontrollera din anslutning');
  }

  const text = await r.text();
  let d;
  try {
    d = JSON.parse(text);
  } catch(e) {
    console.error('Server svar (ej JSON):', text.slice(0,600));
    throw new Error('Serverfel – kontakta supporten');
  }

  if(!r.ok) throw new Error(d.error || 'Fel ' + r.status);
  return d;
}

// ── File upload helper ─────────────────────────────────────────────
async function uploadFile(file, prevId, loadId){
  const fd = new FormData();
  fd.append('photo', file);

  const upl = document.getElementById(loadId);
  if(upl) upl.classList.add('on');

  try {
    const r = await fetch('api/upload', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + A.token },
      body: fd
    });
    const t = await r.text();
    let d;
    try { d = JSON.parse(t); } catch { throw new Error('Serverfel vid uppladdning'); }
    if(!r.ok) throw new Error(d.error || 'Fel vid uppladdning');
    A.photo = d.url;
    const prev = document.getElementById(prevId);
    if(prev) prev.innerHTML = `<img src="${esc(d.url)}" class="phprev" alt="Uppladdad bild">`;
    return d.url;
  } catch(e) {
    toast(e.message, 'err');
    return null;
  } finally {
    if(upl) upl.classList.remove('on');
  }
}
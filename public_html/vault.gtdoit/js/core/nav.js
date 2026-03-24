// ── Navigation + Boot + Search ────────────────────────────────────
const NAV = [];

// ── Mobile sidebar ─────────────────────────────────────────────────
function toggleSidebar(){
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('mob-overlay');
  const btn = document.getElementById('mob-menu-btn');
  const isOpen = sb.classList.contains('open');
  sb.classList.toggle('open', !isOpen);
  overlay.classList.toggle('on', !isOpen);
  if(btn) btn.setAttribute('aria-expanded', String(!isOpen));
  document.body.style.overflow = isOpen ? '' : 'hidden';
}
function closeSidebar(){
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('mob-overlay');
  const btn = document.getElementById('mob-menu-btn');
  sb.classList.remove('open');
  overlay.classList.remove('on');
  if(btn) btn.setAttribute('aria-expanded','false');
  document.body.style.overflow = '';
}

async function startApp(){
  document.getElementById('auth').style.display = 'none';
  const app = document.getElementById('app');
  app.style.display = 'flex';
  app.classList.add('on');
  if(A.user?.email === ADMIN_EMAIL) document.getElementById('ni-admin').style.display = '';
  // Apply saved language
  if(typeof applyI18n    === 'function') applyI18n();
  if(typeof _syncPageTitles === 'function') _syncPageTitles();
  await loadAll();
  go('dash');
}

async function loadAll(){
  try {
    A.families = await api('GET','family/list') || [];
    const savedFam = parseInt(localStorage.getItem('vault_active_family'));
    A.activeFamilyId = A.families.find(f=>f.id===savedFam) ? savedFam : (A.families[0]?.id || null);
    updateSidebar();
    if(!A.activeFamilyId) return;
    const [items,cats,tasks,svcs,members,receipts,ecoCats,ecoSum,ecoTrans] = await Promise.all([
      api('GET','items'), api('GET','categories'), api('GET','tasks'),
      api('GET','services'), api('GET','family/members'), api('GET','receipts'),
      api('GET','economy/categories'),
      api('GET','economy/summary?month='+A.ecoMonth).catch(()=>null),
      api('GET','economy/transactions?month='+A.ecoMonth).catch(()=>[]),
    ]);
    A.items=items; A.cats=cats; A.tasks=tasks; A.svcs=svcs;
    A.members=members; A.receipts=receipts; A.ecoBudgetCats=ecoCats;
    A.ecoSummary=ecoSum; A.ecoTrans=ecoTrans||[];
    badges();
    // Load checklists and activity from DB (non-blocking)
    if(typeof loadChecklists === 'function') loadChecklists().catch(()=>{});
    if(typeof loadActivity  === 'function') loadActivity().catch(()=>{});
  } catch(e){ console.error('loadAll:', e); }
}

function updateSidebar(){
  const fam = A.families.find(f=>f.id===A.activeFamilyId) || A.families[0];
  if(fam){
    const nameEl = document.getElementById('sb-family-name');
    if(nameEl) nameEl.textContent = fam.name || 'Min familj';
    const ic = document.getElementById('invite-code');
    if(ic) ic.textContent = fam.invite_code || '———';
  }
  if(A.user){
    const nameEl = document.getElementById('sb-name');
    const emailEl = document.getElementById('sb-email');
    if(nameEl) nameEl.textContent = A.user.username || '';
    if(emailEl) emailEl.textContent = A.user.email || '';
    const av = document.getElementById('sb-av');
    if(av){
      if(A.user.avatar_url){
        av.style.background = 'transparent';
        av.innerHTML = `<img src="${A.user.avatar_url}" alt="${initials(A.user.username)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      } else {
        av.style.background = A.user.avatar_color||'#5B8EF0';
        av.textContent = initials(A.user.username);
      }
    }
  }
}

async function switchFamily(famId){
  A.activeFamilyId = famId;
  localStorage.setItem('vault_active_family', famId);
  try { await api('POST','family/switch',{family_id:famId}); } catch{}
  await loadAll();
  go('dash');
  toast('✅ Bytte familj');
}

const PAGE_TITLES = {
  dash:'Dashboard', inv:'Inventarie', cats:'Kategorier',
  tasks:'Uppgifter', svc:'Service & underhåll', warr:'Garantier',
  receipts:'Kvitton', eco:'Ekonomi', family:'Familj',
  admin:'Administration', detail:'Detaljer',
  settings:'Inställningar', checklists:'Listor'
};
const ADD_LABELS = {
  inv:'+ Ny sak', tasks:'+ Ny uppgift', svc:'+ Ny påminnelse',
  cats:'+ Ny kategori', receipts:'+ Nytt kvitto'
};

function go(page){
  if(NAV[NAV.length-1] !== page){ NAV.push(page); if(NAV.length>20) NAV.shift(); }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  const pe = document.getElementById('p-'+page);
  if(pe) pe.classList.add('on');
  A.page = page;

  const ptitle = document.getElementById('ptitle');
  if(ptitle) ptitle.textContent = PAGE_TITLES[page] || page;

  const back = document.getElementById('back-btn');
  if(back) back.style.display = NAV.length>1 ? '' : 'none';

  const ab = document.getElementById('addbtn');
  if(ab){
    if(ADD_LABELS[page]){ ab.style.display=''; ab.textContent=ADD_LABELS[page]; }
    else ab.style.display='none';
  }

  // Update sidebar nav highlight
  document.querySelectorAll('.ni').forEach(ni =>
    ni.classList.toggle('on', ni.getAttribute('onclick')===`go('${page}')`)
  );

  // Update mobile tab bar highlight
  const MOB_TAB_MAP = {dash:0, inv:1, tasks:2, eco:3};
  document.querySelectorAll('.mob-tab').forEach((tab,i) => {
    const isActive = Object.entries(MOB_TAB_MAP).some(([p,idx]) => p===page && idx===i);
    tab.classList.toggle('on', isActive);
  });

  if(page !== 'dash') clearSearch();

  // Scroll content to top on page change
  const content = document.getElementById('content-area');
  if(content) content.scrollTop = 0;

  render(page);
}

function goBack(){
  if(NAV.length>1){ NAV.pop(); go(NAV.pop()); }
  else go('dash');
}

function handleAdd(){
  const m = {inv:openItem, tasks:openTask, svc:openSvc, cats:openCat, receipts:openReceipt};
  if(m[A.page]) m[A.page]();
}

function render(p){
  const renders = {
    dash: renderDash, inv: renderInv, cats: renderCats, tasks: renderTasks,
    svc: renderSvc, warr: renderWarr, receipts: renderReceipts,
    eco: renderEco, family: renderFamily, admin: renderAdmin,
    settings: renderSettings, checklists: renderChecklists
  };
  if(renders[p]) renders[p]();
}

// ── Search ─────────────────────────────────────────────────────────
function handleSearch(v){
  A.searchQ = v.toLowerCase().trim();
  const clearBtn = document.getElementById('search-clear');
  if(clearBtn) clearBtn.classList.toggle('on', !!v);
  const panel = document.getElementById('search-panel');
  if(!panel) return;
  if(!A.searchQ){ panel.style.display='none'; return; }

  const ri = A.items.filter(i =>
    i.name.toLowerCase().includes(A.searchQ) ||
    (i.location||'').toLowerCase().includes(A.searchQ)
  );
  const rt = A.tasks.filter(t => t.title.toLowerCase().includes(A.searchQ));
  const rs = A.svcs.filter(s => s.title.toLowerCase().includes(A.searchQ));
  const rr = A.receipts.filter(r =>
    r.title.toLowerCase().includes(A.searchQ) ||
    (r.store||'').toLowerCase().includes(A.searchQ)
  );

  let html = '';
  if(ri.length){
    html += `<div class="sr-hd">📦 Saker</div>`;
    html += ri.slice(0,5).map(i=>`
      <div class="sr-row" onclick="showDetail(${i.id});clearSearch()" role="option">
        <span aria-hidden="true">${cIcon(i.category)}</span>
        <div>
          <div style="font-size:13px">${hl(esc(i.name),A.searchQ)}</div>
          <div style="font-size:11px;color:var(--ink3)">${esc(i.category)} · ${esc(i.location||'–')}</div>
        </div>
      </div>`).join('');
  }
  if(rt.length){
    html += `<div class="sr-hd">✅ Uppgifter</div>`;
    html += rt.slice(0,4).map(t=>`
      <div class="sr-row" onclick="go('tasks');clearSearch()" role="option">
        <span aria-hidden="true">✅</span>
        <div style="font-size:13px">${hl(esc(t.title),A.searchQ)}</div>
      </div>`).join('');
  }
  if(rs.length){
    html += `<div class="sr-hd">🔧 Service</div>`;
    html += rs.slice(0,3).map(s=>`
      <div class="sr-row" onclick="go('svc');clearSearch()" role="option">
        <span aria-hidden="true">🔧</span><div>${esc(s.title)}</div>
      </div>`).join('');
  }
  if(rr.length){
    html += `<div class="sr-hd">🧾 Kvitton</div>`;
    html += rr.slice(0,3).map(r=>`
      <div class="sr-row" onclick="viewReceipt(${r.id});clearSearch()" role="option">
        <span aria-hidden="true">🧾</span>
        <div>${hl(esc(r.title),A.searchQ)}</div>
      </div>`).join('');
  }
  if(!html) html = `<div style="padding:14px;text-align:center;font-size:13px;color:var(--ink3)">Inga träffar för "${esc(A.searchQ)}"</div>`;

  panel.style.display = '';
  panel.innerHTML = `<div class="sr-sec">${html}</div>`;
}

function clearSearch(){
  const input = document.getElementById('search');
  const clearBtn = document.getElementById('search-clear');
  const panel = document.getElementById('search-panel');
  if(input) input.value = '';
  if(clearBtn) clearBtn.classList.remove('on');
  if(panel) panel.style.display = 'none';
  A.searchQ = '';
}

// Close search panel when clicking outside
document.addEventListener('click', e => {
  const panel = document.getElementById('search-panel');
  const wrap = document.querySelector('.search-wrap');
  if(panel && wrap && !wrap.contains(e.target)) panel.style.display = 'none';
});

function openUserMenu(){
  const info = document.getElementById('user-menu-info');
  if(info){
    info.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div class="sb-av" style="background:${A.user?.avatar_url?'transparent':A.user?.avatar_color||'#5B8EF0'};width:44px;height:44px;font-size:16px" aria-hidden="true">${A.user?.avatar_url?`<img src="${A.user.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:initials(A.user?.username)}</div>
        <div>
          <div style="font-weight:600">${esc(A.user?.username||'')}</div>
          <div style="font-size:12px;color:var(--ink3)">${esc(A.user?.email||'')}</div>
        </div>
      </div>`;
  }
  document.getElementById('m-user').classList.add('on');
}

// ── Keyboard shortcuts ──────────────────────────────────────────────
document.addEventListener('keydown', e => {
  // Close sidebar on Escape (mobile)
  if(e.key === 'Escape'){
    const sidebar = document.getElementById('sidebar');
    if(sidebar?.classList.contains('open')){ closeSidebar(); return; }
  }
  // Focus search on '/' key (when not in input)
  if(e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){
    e.preventDefault();
    document.getElementById('search')?.focus();
  }
});

// ── Boot ────────────────────────────────────────────────────────────
(async()=>{
  const params = new URLSearchParams(window.location.search);
  const joinCode = params.get('join'), resetToken = params.get('reset'), itemParam = params.get('item');
  if(joinCode || resetToken || itemParam) history.replaceState(null,'',window.location.pathname);
  if(resetToken){ showResetForm(resetToken); return; }
  if(joinCode){
    switchTab('reg');
    const jc = document.getElementById('r-code');
    if(jc) jc.value = joinCode.toUpperCase();
    return;
  }
  if(!A.token) return;
  try {
    A.user = await api('GET','auth/me');
    await startApp();
    // Deep-link: open item from QR code scan
    if(itemParam){
      const iid = parseInt(itemParam);
      if(iid) showDetail(iid);
    }
  } catch {
    A.token = null;
    localStorage.removeItem('vault_t');
  }
})();
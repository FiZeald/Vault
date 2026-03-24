// ── Checklists (DB-backed) ─────────────────────────────────────────
// A.checklists = [ { id, title, icon, color, items:[ {id,text,done,done_at} ] } ]

async function loadChecklists() {
  try {
    const data = await api('GET', 'checklists');
    A.checklists = data || [];
  } catch(e) { console.error('loadChecklists:', e); A.checklists = []; }
}

function renderChecklists() {
  const wrap = document.getElementById('cl-board');
  if (!wrap) return;
  if (!A.checklists || !A.checklists.length) {
    wrap.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><h3>Inga listor</h3><p>Skapa din första lista – synkas mellan alla enheter</p><button class="btn btn-p" onclick="openChecklist()">+ Ny lista</button></div>`;
    return;
  }
  wrap.innerHTML = A.checklists.map(cl => {
    const done  = (cl.items || []).filter(i => i.done).length;
    const total = (cl.items || []).length;
    const pct   = total ? Math.round((done / total) * 100) : 0;
    const allDone = total > 0 && done === total;
    return `<div class="cl-card ${allDone ? 'cl-done' : ''}" style="--cl-color:${esc(cl.color || '#4F7FFF')}">
      <div class="cl-card-hd">
        <span class="cl-icon">${esc(cl.icon || '📋')}</span>
        <div class="cl-card-title" onclick="openChecklistDetail(${cl.id})">${esc(cl.title)}</div>
        <div class="cl-card-acts">
          <button class="btn btn-g btn-icon btn-xs" onclick="openChecklistDetail(${cl.id})" title="Öppna">✏️</button>
          <button class="btn btn-g btn-icon btn-xs" onclick="delChecklist(${cl.id})" title="Ta bort">🗑️</button>
        </div>
      </div>
      ${total > 0 ? `
      <div class="cl-progress-wrap">
        <div class="cl-progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="cl-meta">${done}/${total} klart${allDone ? ' 🎉' : ''}</div>` : `<div class="cl-meta" style="color:var(--ink3)">Inga punkter än</div>`}
      <div class="cl-items-preview">
        ${(cl.items || []).slice(0, 4).map(it => `
          <div class="cl-item-row ${it.done ? 'done' : ''}" onclick="toggleChecklistItem(${cl.id}, ${it.id})">
            <div class="chk ${it.done ? 'on' : ''}">${it.done ? '✓' : ''}</div>
            <span>${esc(it.text)}</span>
          </div>`).join('')}
        ${(cl.items || []).length > 4 ? `<div style="font-size:11px;color:var(--ink3);padding:4px 0">+${cl.items.length - 4} till…</div>` : ''}
      </div>
      <button class="btn btn-s btn-sm" style="width:100%;margin-top:8px;justify-content:center" onclick="openChecklistDetail(${cl.id})">Öppna lista →</button>
    </div>`;
  }).join('');
}

function openChecklist() {
  document.getElementById('cli-title').value = '';
  document.getElementById('cli-icon').value  = '📋';
  const btn = document.getElementById('cli-icon-btn'); if(btn) btn.textContent = '📋';
  document.getElementById('cli-color').value = '#4F7FFF';
  document.getElementById('cli-id').value    = '';
  document.getElementById('m-checklist').classList.add('on');
}

async function saveChecklist() {
  const title = document.getElementById('cli-title').value.trim();
  if (!title) { toast('⚠️ Titel krävs', 'err'); return; }
  const icon  = document.getElementById('cli-icon').value  || '📋';
  const color = document.getElementById('cli-color').value || '#4F7FFF';
  const eid   = document.getElementById('cli-id').value;
  try {
    if (eid) {
      const updated = await api('PUT', 'checklists/' + eid, { title, icon, color });
      const cl = A.checklists.find(c => c.id == eid);
      if (cl) { cl.title = updated.title; cl.icon = updated.icon; cl.color = updated.color; }
      toast('✅ Lista uppdaterad!');
    } else {
      const cl = await api('POST', 'checklists', { title, icon, color });
      A.checklists.unshift(cl);
      toast('📋 Lista skapad!');
    }
    closeModal('m-checklist');
    render(A.page);
  } catch(e) { toast(e.message, 'err'); }
}

async function delChecklist(id) {
  if (!confirm('Ta bort listan och alla dess punkter?')) return;
  try {
    await api('DELETE', 'checklists/' + id);
    A.checklists = A.checklists.filter(c => c.id != id);
    toast('🗑️ Borttagen');
    render(A.page);
  } catch(e) { toast(e.message, 'err'); }
}

// ── Detail view ────────────────────────────────────────────────────
let _clDetailId = null;

function openChecklistDetail(id) {
  _clDetailId = id;
  renderChecklistDetail();
  document.getElementById('m-cl-detail').classList.add('on');
}

function renderChecklistDetail() {
  const cl = A.checklists.find(c => c.id == _clDetailId);
  if (!cl) return;
  document.getElementById('cl-detail-title').textContent = cl.icon + ' ' + cl.title;
  const done  = (cl.items || []).filter(i => i.done).length;
  const total = (cl.items || []).length;
  document.getElementById('cl-detail-meta').textContent = `${done}/${total} klart`;
  const pct = total ? Math.round((done / total) * 100) : 0;
  document.getElementById('cl-detail-progress').style.width = pct + '%';

  const list = document.getElementById('cl-detail-items');
  if (!cl.items || !cl.items.length) {
    list.innerHTML = `<div style="text-align:center;padding:24px;font-size:13px;color:var(--ink3)">Inga punkter – lägg till nedan</div>`;
  } else {
    list.innerHTML = cl.items.map(it => `
      <div class="cl-detail-item ${it.done ? 'done' : ''}" id="cli-${it.id}">
        <div class="chk ${it.done ? 'on' : ''}" onclick="toggleChecklistItem(${cl.id},${it.id})">${it.done ? '✓' : ''}</div>
        <span class="cl-item-label" onclick="toggleChecklistItem(${cl.id},${it.id})">${esc(it.text)}</span>
        <button class="btn btn-g btn-icon btn-xs" onclick="delChecklistItem(${cl.id},${it.id})">✕</button>
      </div>`).join('');
  }
}

async function toggleChecklistItem(clId, itemId) {
  const cl = A.checklists.find(c => c.id == clId);
  if (!cl) return;
  try {
    const updated = await api('PUT', 'checklists/items/' + itemId);
    const it = (cl.items || []).find(i => i.id == itemId);
    if (it) { it.done = updated.done; it.done_at = updated.done_at; }
    if (_clDetailId == clId) renderChecklistDetail();
    else render(A.page);
    renderChecklists(); // update board cards too
  } catch(e) { toast(e.message, 'err'); }
}

async function addChecklistItem() {
  const inp  = document.getElementById('cl-new-item');
  const text = inp.value.trim();
  if (!text) return;
  const cl = A.checklists.find(c => c.id == _clDetailId);
  if (!cl) return;
  try {
    const item = await api('POST', 'checklists/' + _clDetailId + '/items', { text });
    if (!cl.items) cl.items = [];
    cl.items.push(item);
    inp.value = '';
    renderChecklistDetail();
    renderChecklists();
  } catch(e) { toast(e.message, 'err'); }
}

async function delChecklistItem(clId, itemId) {
  const cl = A.checklists.find(c => c.id == clId);
  if (!cl) return;
  try {
    await api('DELETE', 'checklists/items/' + itemId);
    cl.items = (cl.items || []).filter(i => i.id != itemId);
    renderChecklistDetail();
    renderChecklists();
  } catch(e) { toast(e.message, 'err'); }
}

async function clearDoneItems() {
  const cl = A.checklists.find(c => c.id == _clDetailId);
  if (!cl) return;
  const before = (cl.items || []).length;
  try {
    await api('POST', 'checklists/' + _clDetailId + '/clear-done');
    cl.items = (cl.items || []).filter(i => !i.done);
    toast(`🗑️ Rensade ${before - cl.items.length} avklarade`);
    renderChecklistDetail();
    renderChecklists();
  } catch(e) { toast(e.message, 'err'); }
}

function editChecklistFromDetail() {
  const cl = A.checklists.find(c => c.id == _clDetailId);
  if (!cl) return;
  closeModal('m-cl-detail');
  document.getElementById('cli-title').value = cl.title;
  document.getElementById('cli-icon').value  = cl.icon  || '📋';
  document.getElementById('cli-color').value = cl.color || '#4F7FFF';
  document.getElementById('cli-id').value    = cl.id;
  document.getElementById('m-checklist').classList.add('on');
}

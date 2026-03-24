// ── Inventory + Categories + Detail ───────────────────────────────
if(!A.filter)       A.filter       = 'Alla';
if(!A.statusFilter) A.statusFilter = 'all';
let _invSearch = '';
let _invView   = 'grid'; // 'grid' | 'list'

// Parse comma-separated tags string into array
function parseTags(str){ return (str||'').split(',').map(t=>t.trim()).filter(Boolean); }

const STATUS_LABELS = { ok:'Fungerar', broken:'Trasig', lent:'Utlånad', for_sale:'Till salu' };
const STATUS_ICONS  = { ok:'✅', broken:'🔴', lent:'📤', for_sale:'🏷️' };
const STATUS_BADGE  = { ok:'b-green', broken:'b-rose', lent:'b-amber', for_sale:'b-purple' };
function statusBadge(status){ const s=status||'ok'; return `<span class="badge ${STATUS_BADGE[s]||'b-green'}">${STATUS_ICONS[s]||'✅'} ${STATUS_LABELS[s]||s}</span>`; }
function setStatusFilter(s){ A.statusFilter=s; renderInv(); }

function renderInv(){
  const q       = _invSearch.toLowerCase();
  const sortEl  = document.getElementById('inv-sort');
  const sortVal = sortEl ? sortEl.value : 'newest';

  let items = A.filter==='Alla' ? [...A.items] : A.items.filter(i=>i.category===A.filter);

  // Status filter
  if(A.statusFilter && A.statusFilter !== 'all'){
    items = items.filter(i=>(i.status||'ok')===A.statusFilter);
  }

  // Search filter
  if(q){
    items = items.filter(i=>
      i.name.toLowerCase().includes(q) ||
      (i.location||'').toLowerCase().includes(q) ||
      (i.notes||'').toLowerCase().includes(q) ||
      parseTags(i.tags).some(t=>t.toLowerCase().includes(q))
    );
  }

  // Sort
  if(sortVal==='name')        items.sort((a,b)=>a.name.localeCompare(b.name,'sv'));
  else if(sortVal==='oldest') items.sort((a,b)=>(a.id||0)-(b.id||0));
  else if(sortVal==='price-high') items.sort((a,b)=>(parseFloat(b.price)||0)-(parseFloat(a.price)||0));
  else if(sortVal==='price-low')  items.sort((a,b)=>(parseFloat(a.price)||0)-(parseFloat(b.price)||0));
  else items.sort((a,b)=>(b.id||0)-(a.id||0));

  document.getElementById('inv-cnt').textContent = `${items.length} sak${items.length!==1?'er':''}${q?' (sökning)':''}`;

  // Category filter chips
  const cs = ['Alla',...new Set(A.items.map(i=>i.category))];
  document.getElementById('inv-chips').innerHTML = cs.map(c=>{
    const cnt = c==='Alla' ? A.items.length : A.items.filter(i=>i.category===c).length;
    return `<div class="chip ${c===A.filter?'on':''}" onclick="setFilter('${esc(c)}')">${c==='Alla'?'Alla':cIcon(c)+' '+esc(c)}<span class="chip-cnt">${cnt}</span></div>`;
  }).join('');

  // Status filter chips
  const sfEl = document.getElementById('inv-status-chips');
  if(sfEl){
    const sfOpts = [['all','Alla'],['ok','✅ Fungerar'],['broken','🔴 Trasig'],['lent','📤 Utlånad'],['for_sale','🏷️ Till salu']];
    sfEl.innerHTML = sfOpts.map(([val,lbl])=>{
      const cnt = val==='all' ? A.items.length : A.items.filter(i=>(i.status||'ok')===val).length;
      return cnt>0 || val==='all' ? `<div class="chip ${A.statusFilter===val?'on':''}" onclick="setStatusFilter('${val}')">${lbl}<span class="chip-cnt">${cnt}</span></div>` : '';
    }).join('');
  }

  // View toggle state
  const gridBtn = document.getElementById('inv-view-grid');
  const listBtn = document.getElementById('inv-view-list');
  if(gridBtn) gridBtn.classList.toggle('on', _invView==='grid');
  if(listBtn) listBtn.classList.toggle('on', _invView==='list');

  const grid = document.getElementById('inv-grid');
  if(!items.length){
    grid.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📦</div><h3>${q?'Inget hittades':'Inga saker'}</h3><p>${q?'Prova ett annat sökord':'Börja bygga din inventarie'}</p>${!q?'<button class="btn btn-p" onclick="openItem()">+ Lägg till sak</button>':''}</div>`;
    return;
  }

  if(_invView==='list'){
    grid.className = 'inv-list';
    grid.innerHTML = items.map(i => {
      const ws=wSt(i.warranty), svc=A.svcs.find(s=>s.item_id==i.id);
      const tags = parseTags(i.tags);
      const wc={ok:'b-green',soon:'b-amber',expired:'b-rose'};
      const wl={ok:'✅ Giltig',soon:'⚠️ Snart ut',expired:'❌ Utgången'};
      const svcBadge = _svcBadge(svc);
      return `<div class="inv-list-row" onclick="showDetail(${i.id})">
        <div class="inv-list-thumb">${i.photo?`<img src="${esc(i.photo)}" alt="${esc(i.name)}" loading="lazy">`:`<span>${cIcon(i.category)}</span>`}</div>
        <div class="inv-list-main">
          <div class="inv-list-name">${esc(i.name)}</div>
          <div class="inv-list-meta">${cIcon(i.category)} ${esc(i.category)}${i.location?' · 📍'+esc(i.location):''}${i.price?' · '+fmtMoney(i.price):''}</div>
          ${tags.length?`<div class="item-tags">${tags.map(t=>`<span class="item-tag">${esc(t)}</span>`).join('')}</div>`:''}
        </div>
        <div class="inv-list-badges">
          ${i.status && i.status!=='ok' ? statusBadge(i.status) : ''}
          ${ws?`<span class="badge ${wc[ws]}">${wl[ws]}</span>`:''}
          ${svcBadge}
        </div>
        <div class="inv-list-date">${i.purchased?fmtDate(i.purchased):'–'}</div>
      </div>`;
    }).join('');
  } else {
    grid.className = 'items-grid';
    const wl={ok:'✅ Giltig',soon:'⚠️ Snart ut',expired:'❌ Utgången'}, wc={ok:'b-green',soon:'b-amber',expired:'b-rose'};
    grid.innerHTML = items.map(i => {
      const ws=wSt(i.warranty), svc=A.svcs.find(s=>s.item_id==i.id);
      const tags = parseTags(i.tags);
      const svcBadge = _svcBadge(svc);
      return `<div class="icard" onclick="showDetail(${i.id})">
        <div class="icard-img">${i.photo?`<img src="${esc(i.photo)}" alt="${esc(i.name)}" loading="lazy">`:`<span>${cIcon(i.category)}</span>`}
          <div class="icard-badges">${i.status&&i.status!=='ok'?statusBadge(i.status):''} ${ws?`<span class="badge ${wc[ws]}">${wl[ws]}</span>`:''} ${svcBadge}</div>
        </div>
        <div class="icard-body">
          <h4>${esc(i.name)}</h4>
          <div class="icard-meta">📍 ${esc(i.location||'Okänd plats')}</div>
          ${tags.length?`<div class="item-tags">${tags.map(t=>`<span class="item-tag">${esc(t)}</span>`).join('')}</div>`:''}
        </div>
        <div class="icard-foot"><span>${i.purchased?fmtDate(i.purchased):'–'}</span><span>${i.price?fmtMoney(i.price):''}</span></div>
      </div>`;
    }).join('');
  }
}

function setFilter(c){ A.filter=c; renderInv(); }
function setInvView(v){ _invView=v; renderInv(); }
function setInvSearch(q){ _invSearch=q; renderInv(); }

// ── Item Detail ────────────────────────────────────────────────────
let _detailItemId = null;

async function showDetail(id){
  _detailItemId = id;
  await _renderDetail(id);
  go('detail');
}

async function refreshItemDetail(id){
  if(_detailItemId == id) await _renderDetail(id);
}

function _svcBadge(svc){
  if(!svc) return '';
  const d = daysTo(svc.next_date);
  if(d === null) return '';
  if(d < 0)   return `<span class="badge b-rose">🔧 ${Math.abs(d)}d försenad</span>`;
  if(d === 0) return `<span class="badge b-rose">🔧 Idag</span>`;
  if(d <= 7)  return `<span class="badge b-rose">🔧 Om ${d}d</span>`;
  if(d <= 30) return `<span class="badge b-amber">🔧 Om ${d}d</span>`;
  return `<span class="badge b-green" style="opacity:.7">🔧 Om ${d}d</span>`;
}

function _svcUrgency(s){
  const d = daysTo(s.next_date);
  if(d === null) return { cls:'svc-card-ok',   dot:'var(--green)',  label:'Inget datum',   days: null };
  if(d < 0)     return { cls:'svc-card-over',  dot:'var(--rose)',   label:`${Math.abs(d)} dagar försenad`, days: d };
  if(d <= 30)   return { cls:'svc-card-soon',  dot:'var(--amber)',  label:`Om ${d} dagar`,  days: d };
  return           { cls:'svc-card-ok',   dot:'var(--green)', label:`Om ${d} dagar`,  days: d };
}

function _renderSvcSection(svcs, itemId){
  let html = `<div class="detail-sec">
    <div class="detail-sec-hd">
      <h4>Service (${svcs.length})</h4>
      <button class="btn btn-s btn-xs" onclick="openSvcFor(${itemId})">+ Lägg till</button>
    </div>`;

  if(!svcs.length){
    html += `<div class="svc-empty"><span>🔧</span><p>Ingen service registrerad</p><button class="btn btn-s btn-sm" onclick="openSvcFor(${itemId})">+ Lägg till service</button></div>`;
    return html + `</div>`;
  }

  // Sort: overdue first, then soonest
  const sorted = [...svcs].sort((a,b) => {
    const da = daysTo(a.next_date) ?? 9999;
    const db = daysTo(b.next_date) ?? 9999;
    return da - db;
  });

  html += `<div class="svc-cards">`;
  for(const s of sorted){
    const urg = _svcUrgency(s);
    const isRecurring = parseInt(s.interval_days) > 0;
    const hasHistory  = s.last_date && s.last_date !== '0000-00-00';

    html += `<div class="svc-card ${urg.cls}">
      <div class="svc-card-top">
        <div class="svc-card-dot" style="background:${urg.dot}"></div>
        <div class="svc-card-title">${esc(s.title)}</div>
        <div class="svc-card-acts">
          <button class="btn btn-t btn-xs" onclick="markDone(${s.id})" title="Markera utförd">✅ Klar</button>
          <button class="btn btn-s btn-xs" onclick="editSvc(${s.id})" title="Redigera">✏️</button>
          <button class="btn btn-d btn-xs" onclick="delSvc(${s.id})" title="Ta bort">🗑️</button>
        </div>
      </div>
      <div class="svc-card-body">
        <div class="svc-card-next">
          <span class="svc-card-next-label">Nästa service</span>
          <span class="svc-card-next-date">${s.next_date && s.next_date !== '0000-00-00' ? fmtDate(s.next_date) : '—'}</span>
          ${s.next_date && s.next_date !== '0000-00-00' ? `<span class="svc-card-countdown ${urg.cls}">${urg.label}</span>` : ''}
        </div>
        <div class="svc-card-meta">
          ${hasHistory ? `<span class="svc-meta-chip svc-hist">🕐 Senast: ${fmtDate(s.last_date)}</span>` : ''}
          ${isRecurring ? `<span class="svc-meta-chip svc-repeat">🔄 Var ${intLbl(parseInt(s.interval_days))}</span>` : '<span class="svc-meta-chip">Engångs</span>'}
          ${s.cost ? `<span class="svc-meta-chip svc-cost">💰 ${fmtMoney(s.cost)}</span>` : ''}
        </div>
        ${s.notes ? `<div class="svc-card-notes">${esc(s.notes)}</div>` : ''}
      </div>
    </div>`;
  }

  html += `</div></div>`;
  return html;
}

async function _renderDetail(id){
  const i=A.items.find(x=>x.id==id); if(!i) return;
  const ws=wSt(i.warranty), wl={ok:'✅ Garanti giltig',soon:'⚠️ Garanti snart ut',expired:'❌ Garanti utgången'};
  const svcs=A.svcs.filter(s=>s.item_id==id), recs=A.receipts.filter(r=>r.item_id==id);
  const tags=parseTags(i.tags);

  // Load docs + loans async
  const [docs, loans] = await Promise.all([
    loadDocs(id),
    loadLoans(id),
  ]);

  const qrBtn = `<button class="btn btn-g btn-sm" onclick="showQR(${id})" title="QR-kod">🔲 QR</button>`;

  document.getElementById('detail-body').innerHTML=`
    <div class="detail-layout">
      <div>
        <div class="detail-img">${i.photo?`<img src="${esc(i.photo)}" alt="${esc(i.name)}">`:`<span>${cIcon(i.category)}</span>`}</div>
        <div class="detail-actions">
          <button class="btn btn-p btn-sm" onclick="editItem(${id})">✏️ Redigera</button>
          <button class="btn btn-d btn-sm" onclick="delItem(${id})">🗑️ Ta bort</button>
          <button class="btn btn-t btn-sm" onclick="openSvcFor(${id})">🔧 Service</button>
          <button class="btn btn-s btn-sm" onclick="openReceiptFor(${id})">🧾 Kvitto</button>
          ${qrBtn}
        </div>
      </div>
      <div>
        <div class="detail-name">${esc(i.name)}</div>
        <div class="detail-chips">
          <span class="badge b-blue">${cIcon(i.category)} ${esc(i.category)}</span>
          <span class="badge b-cyan">📍 ${esc(i.location||'–')}</span>
          ${statusBadge(i.status)}
          ${ws?`<span class="badge ${ws==='ok'?'b-green':ws==='soon'?'b-amber':'b-rose'}">${wl[ws]}</span>`:''}
        </div>
        ${tags.length?`<div class="item-tags" style="margin-top:10px">${tags.map(t=>`<span class="item-tag">${esc(t)}</span>`).join('')}</div>`:''}
        <div class="detail-sec"><h4>Detaljer</h4>
          <div class="detail-row"><span>Inköpsdatum</span><span>${fmtDate(i.purchased)}</span></div>
          <div class="detail-row"><span>Inköpspris</span><span>${i.price?fmtMoney(i.price):'–'}</span></div>
          <div class="detail-row"><span>Garanti t.o.m.</span><span>${fmtDate(i.warranty)}</span></div>
          <div class="detail-row"><span>Serienummer</span><span style="font-family:var(--mono);font-size:12px">${esc(i.serial||'–')}</span></div>
        </div>
        ${i.notes?`<div class="detail-sec"><h4>Anteckningar</h4><p style="font-size:13px;color:var(--ink2);line-height:1.7">${esc(i.notes)}</p></div>`:''}
        ${renderLoansSection(id, loans)}
        ${renderDocsSection(id, docs)}
        ${_renderSvcSection(svcs, id)}
        <div class="detail-sec">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h4>Kvitton (${recs.length})</h4><button class="btn btn-s btn-xs" onclick="openReceiptFor(${id})">+ Lägg till</button></div>
          ${recs.length?recs.map(r=>`<div class="rec-row" onclick="viewReceipt(${r.id})">
            <div class="rec-thumb">${r.photo?`<img src="${esc(r.photo)}">`:'🧾'}</div>
            <div class="rec-info"><div class="rec-title">${esc(r.title)}</div><div class="rec-meta">${r.store?esc(r.store)+' · ':''}${fmtDate(r.receipt_date)}</div></div>
            ${r.amount?`<div class="rec-amount">${fmtMoney(r.amount)}</div>`:''}
          </div>`).join(''):`<p style="font-size:13px;color:var(--ink3)">Inga kvitton</p>`}
        </div>
      </div>
    </div>`;
}

// ── Documents section ──────────────────────────────────────────────
async function loadDocs(itemId) {
  try { return await api('GET', 'items/' + itemId + '/documents') || []; } catch { return []; }
}

function renderDocsSection(itemId, docs) {
  let html = `<div class="detail-sec"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h4>Dokument (${docs.length})</h4><label class="btn btn-s btn-xs" style="cursor:pointer">+ Lägg till<input type="file" accept=".pdf,image/*" style="display:none" onchange="uploadDoc(${itemId},this)"></label></div>`;
  if(!docs.length){
    html += `<p style="font-size:13px;color:var(--ink3)">Inga dokument uppladdade</p>`;
  } else {
    html += docs.map(d=>`
      <div class="doc-row">
        <span class="doc-icon">${d.file_type==='pdf'?'📄':'🖼️'}</span>
        <a class="doc-label" href="${esc(d.file_url)}" target="_blank" rel="noopener">${esc(d.label)}</a>
        <button class="btn btn-g btn-xs" onclick="deleteDoc(${d.id},${itemId})">✕</button>
      </div>`).join('');
  }
  html += `</div>`;
  return html;
}

async function uploadDoc(itemId, input){
  const file = input.files[0]; if(!file) return;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('label', file.name.replace(/\.[^.]+$/,''));
  try {
    toast('⏳ Laddar upp…');
    const res = await fetch(`${API_BASE}items/${itemId}/documents`, { method:'POST', headers:{'Authorization':'Bearer '+A.token}, body:fd });
    if(!res.ok){ const e=await res.json(); throw new Error(e.error||'Fel'); }
    toast('✅ Dokument sparat!');
    refreshItemDetail(itemId);
  } catch(e){ toast(e.message,'err'); }
}

async function deleteDoc(docId, itemId){
  if(!confirm('Ta bort dokumentet?')) return;
  try { await api('DELETE','documents/'+docId); toast('🗑️ Borttaget'); refreshItemDetail(itemId); }
  catch(e){ toast(e.message,'err'); }
}

// ── QR Code ────────────────────────────────────────────────────────
let _qrCurrentItemId = null;
const _qrPrintQueue  = []; // [{id, name, url}]

function showQR(itemId){
  const item = A.items.find(i=>i.id==itemId); if(!item) return;
  _qrCurrentItemId = itemId;
  const url  = window.location.origin + window.location.pathname + '?item=' + itemId;
  const el   = document.getElementById('qr-container');
  const lbl  = document.getElementById('qr-item-name');
  if(lbl) lbl.textContent = item.name;
  if(el){
    el.innerHTML = '';
    if(typeof QRCode !== 'undefined'){
      new QRCode(el, { text: url, width: 200, height: 200, colorDark:'#1a1a2e', colorLight:'#ffffff' });
    } else {
      el.innerHTML = `<div style="padding:16px;font-size:12px;color:var(--ink3)">QR-bibliotek saknas</div>`;
    }
  }
  document.getElementById('m-qr').classList.add('on');
}

function addQRToPrintQueue(){
  if(!_qrCurrentItemId) return;
  const item = A.items.find(i=>i.id==_qrCurrentItemId); if(!item) return;
  if(_qrPrintQueue.find(q=>q.id===item.id)){ toast('Saken finns redan i utskriftskön'); return; }
  const url = window.location.origin + window.location.pathname + '?item=' + item.id;
  _qrPrintQueue.push({ id: item.id, name: item.name, url });
  _updateQRPrintBadge();
  toast('✅ Lagd till i QR-utskriften');
  closeModal('m-qr');
}

function _updateQRPrintBadge(){
  const cnt = document.getElementById('qr-print-count');
  if(!cnt) return;
  if(_qrPrintQueue.length){
    cnt.style.display = '';
    cnt.textContent   = _qrPrintQueue.length;
  } else {
    cnt.style.display = 'none';
  }
}

function openPrintQueue(){
  _renderPrintQueue();
  document.getElementById('m-qr-print').classList.add('on');
}

function _renderPrintQueue(){
  const wrap = document.getElementById('qr-print-queue');
  if(!wrap) return;
  if(!_qrPrintQueue.length){
    wrap.innerHTML = `<div style="width:100%;text-align:center;padding:24px;font-size:13px;color:var(--ink3)">Ingen sak i kön — öppna QR-koden för en sak och tryck "Lägg till i utskrift".</div>`;
    return;
  }
  wrap.innerHTML = _qrPrintQueue.map(q => `
    <div class="qr-queue-card" id="qqc-${q.id}">
      <div class="qr-queue-qr" id="qqr-${q.id}"></div>
      <div class="qr-queue-name">${esc(q.name)}</div>
      <button class="qr-queue-del" onclick="removeFromPrintQueue(${q.id})" title="Ta bort">×</button>
    </div>`).join('');
  // Render QR codes into each slot
  if(typeof QRCode !== 'undefined'){
    _qrPrintQueue.forEach(q => {
      const el = document.getElementById('qqr-'+q.id);
      if(el) new QRCode(el, { text: q.url, width: 110, height: 110, colorDark:'#000', colorLight:'#fff' });
    });
  }
}

function removeFromPrintQueue(id){
  const idx = _qrPrintQueue.findIndex(q=>q.id===id);
  if(idx>-1) _qrPrintQueue.splice(idx,1);
  _updateQRPrintBadge();
  _renderPrintQueue();
}

function clearPrintQueue(){
  _qrPrintQueue.length = 0;
  _updateQRPrintBadge();
  _renderPrintQueue();
}

let _qrCols = 4; // default: 8 per page (4 columns × 2 rows)

function setQRCols(cols){
  _qrCols = cols;
  document.querySelectorAll('.qr-size-btn').forEach(btn => {
    btn.classList.toggle('on', parseInt(btn.dataset.cols) === cols);
  });
}

// QR size per column count (px for the print window)
const _QR_SIZES = { 2: 220, 3: 160, 4: 130, 6: 90 };

function printQRSheet(){
  if(!_qrPrintQueue.length){ toast('Inga QR-koder att skriva ut','err'); return; }
  const items  = _qrPrintQueue.map(q => ({ id: q.id, name: q.name, url: q.url }));
  const cols   = _qrCols;
  const qrPx   = _QR_SIZES[cols] ?? 130;
  const namePx = cols <= 2 ? 13 : cols <= 3 ? 11 : cols <= 4 ? 10 : 8;
  const win = window.open('', '_blank', 'width=794,height=1123');
  if(!win){ toast('Popup blockerad — tillåt popup för att skriva ut', 'err'); return; }
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Vault QR-koder</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;background:#fff;color:#000}
  @page{size:A4 portrait;margin:12mm}
  .grid{display:grid;grid-template-columns:repeat(${cols},1fr);gap:8mm}
  .cell{border:1px dashed #bbb;border-radius:6px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:5px;break-inside:avoid;page-break-inside:avoid}
  .cell canvas,.cell img{display:block;max-width:100%}
  .name{font-size:${namePx}px;font-weight:700;text-align:center;word-break:break-word;width:100%;line-height:1.3}
</style>
</head><body>
<div class="grid" id="grid"></div>
<script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>
<script>
  const items = ${JSON.stringify(items)};
  const grid  = document.getElementById('grid');
  items.forEach(item => {
    const cell   = document.createElement('div');
    cell.className = 'cell';
    const qrDiv  = document.createElement('div');
    cell.appendChild(qrDiv);
    const nameEl = document.createElement('div');
    nameEl.className = 'name';
    nameEl.textContent = item.name;
    cell.appendChild(nameEl);
    grid.appendChild(cell);
    if(typeof QRCode !== 'undefined'){
      new QRCode(qrDiv, { text: item.url, width: ${qrPx}, height: ${qrPx}, colorDark:'#000', colorLight:'#fff' });
    }
  });
  setTimeout(() => { window.print(); }, 900);
<\/script>
</body></html>`);
  win.document.close();
}

// ── CSV Import ─────────────────────────────────────────────────────
async function importCSV(input){
  const file = input.files[0]; if(!file) return;
  const fd   = new FormData(); fd.append('csv', file);
  try {
    toast('⏳ Importerar…');
    const res = await fetch(`${API_BASE}items/csv-import`, { method:'POST', headers:{'Authorization':'Bearer '+A.token}, body:fd });
    if(!res.ok){ const e=await res.json(); throw new Error(e.error||'Fel'); }
    const data = await res.json();
    toast(`✅ Importerade ${data.inserted} saker!`);
    if(data.errors?.length) console.warn('CSV errors:', data.errors);
    A.items = await api('GET','items');
    render(A.page);
  } catch(e){ toast(e.message,'err'); }
}

// ── Item CRUD ──────────────────────────────────────────────────────
// ── Tag pill UI ────────────────────────────────────────────────────
let _tagList = [];

function _getAllTags(){
  const all = A.items.flatMap(i => parseTags(i.tags));
  return [...new Set(all)].sort((a,b)=>a.localeCompare(b,'sv'));
}

function _syncTagHidden(){
  const h = document.getElementById('fi-tags');
  if(h) h.value = _tagList.join(',');
}

function _renderTagPills(){
  const wrap = document.getElementById('tag-pills');
  if(!wrap) return;
  wrap.innerHTML = _tagList.map(t =>
    `<span class="tag-pill">${esc(t)}<button type="button" onclick="removeTag('${esc(t)}')" aria-label="Ta bort">×</button></span>`
  ).join('');
}

function addTag(tag){
  tag = tag.trim();
  if(!tag || _tagList.includes(tag) || _tagList.length >= 10) return;
  _tagList.push(tag);
  _renderTagPills();
  _syncTagHidden();
  hideSuggestions();
  const inp = document.getElementById('fi-tags-input');
  if(inp){ inp.value = ''; inp.focus(); }
}

function removeTag(tag){
  _tagList = _tagList.filter(t => t !== tag);
  _renderTagPills();
  _syncTagHidden();
}

function tagInputKey(e){
  if(e.key === 'Enter' || e.key === ','){
    e.preventDefault();
    const inp = document.getElementById('fi-tags-input');
    if(inp) addTag(inp.value.replace(/,$/,''));
  } else if(e.key === 'Backspace'){
    const inp = document.getElementById('fi-tags-input');
    if(inp && !inp.value && _tagList.length){
      _tagList.pop();
      _renderTagPills();
      _syncTagHidden();
    }
  }
}

function tagInputChange(inp){
  const q = inp.value.trim().toLowerCase();
  const sugBox = document.getElementById('tag-suggestions');
  if(!sugBox) return;
  const all = _getAllTags().filter(t => !_tagList.includes(t));
  const matches = q ? all.filter(t => t.toLowerCase().includes(q)) : all;
  if(!matches.length){ sugBox.innerHTML=''; sugBox.style.display='none'; return; }
  sugBox.style.display = '';
  sugBox.innerHTML = matches.slice(0,8).map(t =>
    `<button type="button" class="tag-sug-btn" onclick="addTag('${esc(t)}')">${esc(t)}</button>`
  ).join('');
}

function hideSuggestions(){
  const s = document.getElementById('tag-suggestions');
  if(s){ s.innerHTML=''; s.style.display='none'; }
}

function _initTagUI(tagStr){
  _tagList = parseTags(tagStr);
  _renderTagPills();
  _syncTagHidden();
  hideSuggestions();
  const inp = document.getElementById('fi-tags-input');
  if(inp) inp.value = '';
}

function openItem(){
  A.photo=null; A.editId=null;
  ['fi-name','fi-loc','fi-purch','fi-price','fi-warr','fi-serial','fi-notes'].forEach(x=>{
    const el=document.getElementById(x); if(el) el.value='';
  });
  document.getElementById('fi-id').value='';
  const stEl=document.getElementById('fi-status'); if(stEl) stEl.value='ok';
  document.getElementById('ph-prev').innerHTML='📷 <span style="font-size:12px">Klicka eller ta foto</span>';
  document.getElementById('m-item-title').textContent='Lägg till sak';
  fillCatSel('fi-cat');
  _initTagUI('');
  document.getElementById('m-item').classList.add('on');
}
function editItem(id){
  const i=A.items.find(x=>x.id==id); if(!i) return;
  A.editId=id; A.photo=i.photo||null;
  fillCatSel('fi-cat');
  ['name','category','location','purchased','price','warranty','serial','notes'].forEach(f=>{
    const el=document.getElementById('fi-'+f.replace('category','cat'));
    if(!el) return;
    const v=i[f]; el.value=v&&v!=='0000-00-00'?v:'';
  });
  _initTagUI(i.tags||'');
  const stEl=document.getElementById('fi-status'); if(stEl) stEl.value=i.status||'ok';
  document.getElementById('fi-id').value=id;
  document.getElementById('ph-prev').innerHTML=i.photo?`<img src="${esc(i.photo)}" class="phprev">`:'📷 <span style="font-size:12px">Klicka eller byt bild</span>';
  document.getElementById('m-item-title').textContent='Redigera sak';
  document.getElementById('m-item').classList.add('on');
}
async function uploadPhoto(input){ await uploadFile(input.files[0],'ph-prev','ph-uploading'); }
async function saveItem(){
  const name=document.getElementById('fi-name').value.trim();
  if(!name){ toast('⚠️ Namn krävs','err'); return; }
  // Normalize tags: trim, deduplicate, max 10
  const rawTags = (document.getElementById('fi-tags')?.value||'');
  const tags = [...new Set(rawTags.split(',').map(t=>t.trim()).filter(Boolean))].slice(0,10).join(',');
  const body={
    name,
    category:document.getElementById('fi-cat').value||'Övrigt',
    location:document.getElementById('fi-loc').value,
    purchased:document.getElementById('fi-purch').value||null,
    price:parseFloat(document.getElementById('fi-price').value)||0,
    warranty:document.getElementById('fi-warr').value||null,
    serial:document.getElementById('fi-serial').value,
    notes:document.getElementById('fi-notes').value,
    photo:A.photo||'',
    tags,
    status:document.getElementById('fi-status')?.value||'ok',
  };
  try {
    const eid=document.getElementById('fi-id').value;
    if(eid){ const u=await api('PUT','items/'+eid,body); A.items=A.items.map(i=>i.id==eid?u:i); toast('✅ Uppdaterad!'); }
    else { const c=await api('POST','items',body); A.items.unshift(c); toast('✅ '+name+' sparad!'); }
    closeModal('m-item'); render(A.page);
  } catch(e){ toast(e.message,'err'); }
}
async function delItem(id){
  if(!confirm('Ta bort saken?')) return;
  await api('DELETE','items/'+id); A.items=A.items.filter(i=>i.id!=id);
  toast('🗑️ Borttagen'); go('inv');
}

// ── Category CRUD ──────────────────────────────────────────────────
function renderCats(){
  document.getElementById('cg').innerHTML = A.cats.map(c=>{
    const cnt=A.items.filter(i=>i.category===c.name).length;
    return `<div class="cat-card" onclick="setFilter('${esc(c.name)}');go('inv')">
      <button class="cat-del" onclick="event.stopPropagation();delCat(${c.id})" title="Ta bort">×</button>
      <div class="cat-icon">${c.icon}</div><h3>${esc(c.name)}</h3><p>${cnt} sak${cnt!==1?'er':''}</p>
    </div>`;
  }).join('') + `<div class="cat-card" style="border:2px dashed var(--border2)" onclick="openCat()"><div class="cat-icon">➕</div><h3>Ny kategori</h3><p>Lägg till</p></div>`;
}
function openCat(){
  document.getElementById('ci-name').value='';
  document.getElementById('ci-icon').value='📦';
  const btn=document.getElementById('ci-icon-btn'); if(btn) btn.textContent='📦';
  document.getElementById('ci-id').value='';
  document.getElementById('m-cat').classList.add('on');
}
async function saveCat(){
  const name=document.getElementById('ci-name').value.trim(); if(!name){ toast('⚠️ Namn krävs','err'); return; }
  const icon=document.getElementById('ci-icon').value||'📦';
  try { const c=await api('POST','categories',{name,icon,color:document.getElementById('ci-color').value||'#5B8EF0'}); A.cats.push(c); closeModal('m-cat'); toast('✅ Kategori sparad!'); render(A.page); }
  catch(e){ toast(e.message,'err'); }
}
async function delCat(id){
  if(!confirm('Ta bort kategorin?')) return;
  await api('DELETE','categories/'+id); A.cats=A.cats.filter(c=>c.id!=id); render(A.page); toast('🗑️ Borttagen');
}

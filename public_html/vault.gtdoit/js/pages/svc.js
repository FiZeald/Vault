// ── Service & underhåll ────────────────────────────────────────────

// Service history stored locally per family (since backend has no history table yet)
// Structure: { [familyId]: [ { svcId, title, itemName, doneDate, cost, notes } ] }
function getSvcHistory(){
  try { return JSON.parse(localStorage.getItem('vault_svc_hist_'+A.activeFamilyId)||'[]'); } catch{ return []; }
}
function addSvcHistory(entry){
  const h = getSvcHistory(); h.unshift(entry);
  localStorage.setItem('vault_svc_hist_'+A.activeFamilyId, JSON.stringify(h.slice(0,200)));
}

let _svcTab = 'upcoming';
function switchSvcTab(tab){
  _svcTab = tab;
  ['upcoming','history'].forEach(t => {
    document.getElementById('svc-tab-'+t)?.classList.toggle('on', t===tab);
    document.getElementById('svc-panel-'+t).style.display = t===tab ? '' : 'none';
  });
  if(tab==='history') renderSvcHistory();
}

function renderSvc(){
  // Always reset to upcoming tab when re-entering page
  _svcTab = 'upcoming';
  document.getElementById('svc-panel-upcoming').style.display = '';
  document.getElementById('svc-panel-history').style.display = 'none';
  document.getElementById('svc-tab-upcoming')?.classList.add('on');
  document.getElementById('svc-tab-history')?.classList.remove('on');

  const s=[...A.svcs].sort((a,b)=>(daysTo(a.next_date)??9999)-(daysTo(b.next_date)??9999));
  const el=document.getElementById('svc-list');
  if(!s.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">🔧</div><h3>Ingen service inlagd</h3><p>Lägg till servicepåminnelser för dina saker</p><button class="btn btn-p" onclick="openSvc()">+ Lägg till service</button></div>`;
    return;
  }
  el.innerHTML=s.map(sv=>{
    const d=daysTo(sv.next_date);
    const isOverdue = d!==null && d<0;
    const isSoon    = d!==null && d>=0 && d<=30;
    const cls = isOverdue?'overdue':isSoon?'soon':'';
    const bdg = d===null ? ''
      : isOverdue ? `<span class="badge b-rose">Försenad ${Math.abs(d)}d</span>`
      : isSoon    ? `<span class="badge b-amber">Om ${d}d</span>`
      :             `<span class="badge b-blue">Om ${d}d</span>`;
    const iconBg = isOverdue?'background:var(--rose-bg)':isSoon?'background:var(--amber-bg)':'background:var(--surface2)';
    return `<div class="svc-row ${cls}">
      <div class="svc-icon" style="${iconBg}">🔧</div>
      <div class="svc-info">
        <div class="svc-title">${esc(sv.title)}</div>
        <div class="svc-sub">
          ${sv.item_name?'🔗 '+esc(sv.item_name)+' · ':''}
          ${sv.next_date&&sv.next_date!=='0000-00-00'?'📅 '+fmtDate(sv.next_date):'Inget datum satt'}
          ${sv.interval_days?' · 🔄 var '+intLbl(sv.interval_days):''}
          ${bdg?' · '+bdg:''}
        </div>
        ${sv.notes?`<div style="font-size:11px;color:var(--ink3);margin-top:2px">${esc(sv.notes)}</div>`:''}
        ${sv.cost?`<div style="font-size:11px;color:var(--ink3)">💰 ${fmtMoney(sv.cost)}</div>`:''}
      </div>
      <div class="svc-acts">
        <button class="btn btn-t btn-sm" onclick="markDone(${sv.id})">✅ Utfört</button>
        <button class="btn btn-g btn-icon btn-sm" onclick="editSvc(${sv.id})">✏️</button>
        <button class="btn btn-g btn-icon btn-sm" onclick="delSvc(${sv.id})">🗑️</button>
      </div>
    </div>`;
  }).join('');
}

function renderSvcHistory(){
  const el = document.getElementById('svc-history-list'); if(!el) return;
  const hist = getSvcHistory();
  if(!hist.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">🕐</div><h3>Ingen historik ännu</h3><p>Utfört underhåll visas här när du markerar service som klar.</p></div>`;
    return;
  }
  el.innerHTML = hist.map(h=>`
    <div class="svc-hist-row">
      <div class="svc-hist-icon">✅</div>
      <div class="svc-hist-info">
        <div class="svc-hist-title">${esc(h.title)}</div>
        <div class="svc-hist-meta">
          ${h.itemName?'🔗 '+esc(h.itemName)+' · ':''}
          ✅ Utfört ${fmtDate(h.doneDate)}
          ${h.cost?' · 💰 '+fmtMoney(h.cost):''}
        </div>
        ${h.notes?`<div style="font-size:11px;color:var(--ink3);margin-top:2px">${esc(h.notes)}</div>`:''}
      </div>
      <span class="badge b-green" style="flex-shrink:0">Klar</span>
    </div>`).join('');
}

let _svcEcoMode = 'new';

function toggleSvcEcoLink(cb){
  document.getElementById('si-eco-fields').style.display = cb.checked ? '' : 'none';
  if(cb.checked){
    fillSvcEcoCatSel();
    fillSvcEcoTransSel();
    setSvcEcoMode('new');
  }
}

function setSvcEcoMode(mode){
  _svcEcoMode = mode;
  document.getElementById('si-eco-mode-new').className  = 'btn btn-sm' + (mode==='new'  ? ' btn-p' : ' btn-s') + ' ' + 'btn-sm';
  document.getElementById('si-eco-mode-link').className = 'btn btn-sm' + (mode==='link' ? ' btn-p' : ' btn-s') + ' ' + 'btn-sm';
  document.getElementById('si-eco-new-fields').style.display  = mode==='new'  ? '' : 'none';
  document.getElementById('si-eco-link-fields').style.display = mode==='link' ? '' : 'none';
  // Apply button styles correctly
  document.getElementById('si-eco-mode-new').style.cssText  = 'flex:1;border-radius:0;border:none' + (mode==='new'  ? ';background:var(--accent);color:#fff' : '');
  document.getElementById('si-eco-mode-link').style.cssText = 'flex:1;border-radius:0;border:none;border-left:1px solid var(--border)' + (mode==='link' ? ';background:var(--accent);color:#fff' : '');
}

function fillSvcEcoCatSel(selId=null){
  const el=document.getElementById('si-eco-cat'); if(!el) return;
  el.innerHTML='<option value="">Ingen kategori</option>'+
    (A.ecoBudgetCats||[]).filter(c=>c.type==='expense')
    .map(c=>`<option value="${c.id}" ${c.id==selId?'selected':''}>${c.icon} ${esc(c.name)}</option>`).join('');
}

function fillSvcEcoTransSel(){
  const el=document.getElementById('si-eco-trans-sel'); if(!el) return;
  const trans=(A.ecoTrans||[]).filter(t=>t.type==='expense').slice(0,60);
  // Also include from A.ecoSummary if we have broader list — use what's cached
  const title=document.getElementById('si-title')?.value||'';
  const cost=parseFloat(document.getElementById('si-cost')?.value)||0;
  el.innerHTML='<option value="">Välj transaktion…</option>'+
    trans.map(t=>{
      // Highlight transactions that match title or cost
      const match = (cost&&Math.abs(parseFloat(t.amount)-cost)<1) || title&&t.description.toLowerCase().includes(title.toLowerCase().slice(0,6));
      return `<option value="${t.id}" ${match?'':''}>${t.trans_date} — ${esc(t.description)} (${fmtMoney(t.amount)})${match?' ⭐':''}</option>`;
    }).join('');
}

function openSvc(){
  ['si-title','si-last','si-next','si-notes','si-cost'].forEach(x=>document.getElementById(x).value='');
  document.getElementById('si-int').value='0'; document.getElementById('si-id').value='';
  document.getElementById('si-eco-toggle').checked=false;
  document.getElementById('si-eco-fields').style.display='none';
  fillItemSel('si-item');
  document.getElementById('m-svc-title').textContent='Ny service & underhåll';
  document.getElementById('m-svc').classList.add('on');
}
function openSvcFor(itemId){ openSvc(); document.getElementById('si-item').value=itemId; }
function editSvc(id){
  const s=A.svcs.find(x=>x.id==id); if(!s) return;
  document.getElementById('si-title').value=s.title;
  document.getElementById('si-last').value=s.last_date&&s.last_date!=='0000-00-00'?s.last_date:'';
  document.getElementById('si-next').value=s.next_date&&s.next_date!=='0000-00-00'?s.next_date:'';
  document.getElementById('si-int').value=s.interval_days||'0';
  document.getElementById('si-cost').value=s.cost||'';
  document.getElementById('si-notes').value=s.notes||'';
  document.getElementById('si-id').value=id;
  document.getElementById('si-eco-toggle').checked=false;
  document.getElementById('si-eco-fields').style.display='none';
  fillItemSel('si-item'); document.getElementById('si-item').value=s.item_id||'';
  document.getElementById('m-svc-title').textContent='Redigera service';
  document.getElementById('m-svc').classList.add('on');
}
async function saveSvc(){
  const title=document.getElementById('si-title').value.trim(); if(!title){ toast('⚠️ Titel krävs','err'); return; }
  const eid=document.getElementById('si-id').value;
  const cost=parseFloat(document.getElementById('si-cost').value)||null;
  const body={title,item_id:parseInt(document.getElementById('si-item').value)||null,last_date:document.getElementById('si-last').value||null,next_date:document.getElementById('si-next').value||null,interval_days:parseInt(document.getElementById('si-int').value)||0,cost,notes:document.getElementById('si-notes').value};
  try {
    let saved;
    if(eid){ saved=await api('PUT','services/'+eid,body); A.svcs=A.svcs.map(s=>s.id==eid?saved:s); toast('✅ Uppdaterad!'); }
    else { saved=await api('POST','services',body); A.svcs.push(saved); toast('🔧 Sparad!'); }

    // Economy link
    if(document.getElementById('si-eco-toggle').checked){
      if(_svcEcoMode==='new' && cost && cost>0){
        const catId=parseInt(document.getElementById('si-eco-cat').value)||null;
        const dateVal=document.getElementById('si-last').value || document.getElementById('si-next').value || new Date().toISOString().slice(0,10);
        try {
          const tr=await api('POST','economy/transactions',{
            type:'expense', description:'🔧 '+title,
            amount:cost, trans_date:dateVal,
            category_id:catId, item_id:saved.item_id||null,
            note:document.getElementById('si-notes').value||''
          });
          if(!A.ecoTrans) A.ecoTrans=[];
          A.ecoTrans.unshift(tr);
          toast('✅ Sparad + 💰 transaktion skapad!');
        } catch(te){ toast('Service sparad men transaktion misslyckades: '+te.message,'err'); }
      } else if(_svcEcoMode==='link'){
        const transId=parseInt(document.getElementById('si-eco-trans-sel').value)||null;
        if(transId){
          try {
            // Update the linked transaction's item_id to this service's item
            await api('PUT','economy/transactions/'+transId,{
              item_id: saved.item_id||null
            });
            toast('✅ Sparad + 🔗 länkad till transaktion!');
          } catch(te){ toast('Service sparad men länkning misslyckades: '+te.message,'err'); }
        }
      }
    }

    badges(); closeModal('m-svc'); render(A.page);
  } catch(e){ toast(e.message,'err'); }
}
async function markDone(id){
  const sv = A.svcs.find(s=>s.id==id);
  try {
    const r=await api('POST','services/'+id+'/done');
    // Log to local history before removing/updating
    if(sv){
      addSvcHistory({
        svcId: id,
        itemId: sv.item_id || null,
        title: sv.title,
        itemName: sv.item_name || null,
        doneDate: new Date().toISOString().slice(0,10),
        cost: sv.cost || null,
        notes: sv.notes || null
      });
    }
    if(r.deleted){ A.svcs=A.svcs.filter(s=>s.id!=id); toast('✅ Service utförd! Loggad i historik.'); }
    else { A.svcs=A.svcs.map(s=>s.id==id?r:s); toast('✅ Utfört! Nästa: '+fmtDate(r.next_date)); }
    badges(); render(A.page);
  } catch(e){ toast(e.message,'err'); }
}
async function delSvc(id){
  if(!confirm('Ta bort servicepåminnelsen?')) return;
  await api('DELETE','services/'+id); A.svcs=A.svcs.filter(s=>s.id!=id); badges(); render(A.page);
}

// Helper used in item detail for per-item service history
function getItemSvcHistory(itemId){
  return getSvcHistory().filter(h => h.itemId == itemId);
}
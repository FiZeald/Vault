// ── Inventory + Categories + Detail ───────────────────────────────
if(!A.filter) A.filter = 'Alla';

function renderInv(){
  let items = A.filter==='Alla' ? [...A.items] : A.items.filter(i=>i.category===A.filter);
  const sortEl = document.getElementById('inv-sort');
  const sortVal = sortEl ? sortEl.value : 'newest';
  if(sortVal==='name')        items.sort((a,b)=>a.name.localeCompare(b.name,'sv'));
  else if(sortVal==='oldest') items.sort((a,b)=>(a.id||0)-(b.id||0));
  else if(sortVal==='price-high') items.sort((a,b)=>(parseFloat(b.price)||0)-(parseFloat(a.price)||0));
  else if(sortVal==='price-low')  items.sort((a,b)=>(parseFloat(a.price)||0)-(parseFloat(b.price)||0));
  else items.sort((a,b)=>(b.id||0)-(a.id||0)); // newest (default)
  document.getElementById('inv-cnt').textContent = `${items.length} sak${items.length!==1?'er':''}`;
  const cs = ['Alla',...new Set(A.items.map(i=>i.category))];
  document.getElementById('inv-chips').innerHTML = cs.map(c=>`<div class="chip ${c===A.filter?'on':''}" onclick="setFilter('${esc(c)}')">${c==='Alla'?'Alla':cIcon(c)+' '+esc(c)}</div>`).join('');
  const grid = document.getElementById('inv-grid');
  if(!items.length){ grid.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📦</div><h3>Inga saker</h3><p>Börja bygga din inventarie</p><button class="btn btn-p" onclick="openItem()">+ Lägg till sak</button></div>`; return; }
  const wl={ok:'✅ Giltig',soon:'⚠️ Snart ut',expired:'❌ Utgången'}, wc={ok:'b-green',soon:'b-amber',expired:'b-rose'};
  grid.innerHTML = items.map(i => {
    const ws=wSt(i.warranty), svc=A.svcs.find(s=>s.item_id==i.id), svcAl=svc&&daysTo(svc.next_date)!==null&&daysTo(svc.next_date)<30;
    return `<div class="icard" onclick="showDetail(${i.id})">
      <div class="icard-img">${i.photo?`<img src="${esc(i.photo)}" alt="${esc(i.name)}" loading="lazy">`:`<span>${cIcon(i.category)}</span>`}
        <div class="icard-badges">${ws?`<span class="badge ${wc[ws]}">${wl[ws]}</span>`:''} ${svcAl?'<span class="badge b-amber">🔧 Service</span>':''}</div>
      </div>
      <div class="icard-body"><h4>${esc(i.name)}</h4><div class="icard-meta">📍 ${esc(i.location||'Okänd plats')}</div></div>
      <div class="icard-foot"><span>${i.purchased?fmtDate(i.purchased):'–'}</span><span>${i.price?fmtMoney(i.price):''}</span></div>
    </div>`;
  }).join('');
}
function setFilter(c){ A.filter=c; renderInv(); }

function showDetail(id){
  const i=A.items.find(x=>x.id==id); if(!i) return;
  const ws=wSt(i.warranty), wl={ok:'✅ Garanti giltig',soon:'⚠️ Garanti snart ut',expired:'❌ Garanti utgången'};
  const svcs=A.svcs.filter(s=>s.item_id==id), recs=A.receipts.filter(r=>r.item_id==id);
  document.getElementById('detail-body').innerHTML=`
    <div class="detail-layout">
      <div>
        <div class="detail-img">${i.photo?`<img src="${esc(i.photo)}" alt="${esc(i.name)}">`:`<span>${cIcon(i.category)}</span>`}</div>
        <div class="detail-actions">
          <button class="btn btn-p btn-sm" onclick="editItem(${id})">✏️ Redigera</button>
          <button class="btn btn-d btn-sm" onclick="delItem(${id})">🗑️ Ta bort</button>
          <button class="btn btn-t btn-sm" onclick="openSvcFor(${id})">🔧 Service</button>
          <button class="btn btn-s btn-sm" onclick="openReceiptFor(${id})">🧾 Kvitto</button>
        </div>
      </div>
      <div>
        <div class="detail-name">${esc(i.name)}</div>
        <div class="detail-chips">
          <span class="badge b-blue">${cIcon(i.category)} ${esc(i.category)}</span>
          <span class="badge b-cyan">📍 ${esc(i.location||'–')}</span>
          ${ws?`<span class="badge ${ws==='ok'?'b-green':ws==='soon'?'b-amber':'b-rose'}">${wl[ws]}</span>`:''}
        </div>
        <div class="detail-sec"><h4>Detaljer</h4>
          <div class="detail-row"><span>Inköpsdatum</span><span>${fmtDate(i.purchased)}</span></div>
          <div class="detail-row"><span>Inköpspris</span><span>${i.price?fmtMoney(i.price):'–'}</span></div>
          <div class="detail-row"><span>Garanti t.o.m.</span><span>${fmtDate(i.warranty)}</span></div>
          <div class="detail-row"><span>Serienummer</span><span style="font-family:var(--mono);font-size:12px">${esc(i.serial||'–')}</span></div>
        </div>
        ${i.notes?`<div class="detail-sec"><h4>Anteckningar</h4><p style="font-size:13px;color:var(--ink2);line-height:1.7">${esc(i.notes)}</p></div>`:''}
        <div class="detail-sec"><h4>Service (${svcs.length})</h4>
          ${svcs.length?svcs.map(s=>`<div class="svc-row" style="padding:10px 0">
            <div class="svc-icon">🔧</div>
            <div class="svc-info"><div class="svc-title">${esc(s.title)}</div><div class="svc-sub">Nästa: ${fmtDate(s.next_date)}${s.interval_days?' · 🔄 var '+intLbl(s.interval_days):''}</div></div>
            <div class="svc-acts"><button class="btn btn-t btn-xs" onclick="markDone(${s.id})">✅</button><button class="btn btn-g btn-xs" onclick="editSvc(${s.id})">✏️</button></div>
          </div>`).join(''):`<p style="font-size:13px;color:var(--ink3)">Ingen service</p>`}
        </div>
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
  go('detail');
}

// Item CRUD
function openItem(){
  A.photo=null; A.editId=null;
  ['fi-name','fi-loc','fi-purch','fi-price','fi-warr','fi-serial','fi-notes'].forEach(x=>document.getElementById(x).value='');
  document.getElementById('fi-id').value='';
  document.getElementById('ph-prev').innerHTML='📷 <span style="font-size:12px">Klicka för att välja bild</span>';
  document.getElementById('m-item-title').textContent='Lägg till sak';
  fillCatSel('fi-cat');
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
  document.getElementById('fi-id').value=id;
  document.getElementById('ph-prev').innerHTML=i.photo?`<img src="${esc(i.photo)}" class="phprev">`:'📷 <span style="font-size:12px">Klicka för att byta bild</span>';
  document.getElementById('m-item-title').textContent='Redigera sak';
  document.getElementById('m-item').classList.add('on');
}
async function uploadPhoto(input){ await uploadFile(input.files[0],'ph-prev','ph-uploading'); }
async function saveItem(){
  const name=document.getElementById('fi-name').value.trim();
  if(!name){ toast('⚠️ Namn krävs','err'); return; }
  const body={name,category:document.getElementById('fi-cat').value||'Övrigt',location:document.getElementById('fi-loc').value,purchased:document.getElementById('fi-purch').value||null,price:parseFloat(document.getElementById('fi-price').value)||0,warranty:document.getElementById('fi-warr').value||null,serial:document.getElementById('fi-serial').value,notes:document.getElementById('fi-notes').value,photo:A.photo||''};
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

// Category CRUD
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
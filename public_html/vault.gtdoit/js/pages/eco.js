// ── Economy 2.0 ─────────────────────────────────────────────────────
const ECO_MONTHS_SV  = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
const ECO_MONTHS_SHT = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
function ecoMonthLabel(ym){ const[y,m]=ym.split('-'); return ECO_MONTHS_SV[parseInt(m)-1]+' '+y; }

let _ecoTab = 'overview';

// ───────────────────────────── MONTH NAV ────────────────────────────
function ecoMonthStep(dir){
  const [y,m] = A.ecoMonth.split('-');
  let nm = parseInt(m)+dir, ny = parseInt(y);
  if(nm>12){nm=1;ny++;} if(nm<1){nm=12;ny--;}
  A.ecoMonth = ny+'-'+String(nm).padStart(2,'0');
  const lbl = document.getElementById('eco-month-lbl');
  if(lbl) lbl.textContent = ecoMonthLabel(A.ecoMonth);
  const pb=document.getElementById('eco-prev-btn'), nb=document.getElementById('eco-next-btn');
  if(pb) pb.disabled=true; if(nb) nb.disabled=true;
  renderEco().finally(()=>{ if(pb) pb.disabled=false; if(nb) nb.disabled=false; });
}

function ecoPersonId(){
  const s = document.getElementById('eco-person-filter');
  return s ? (parseInt(s.value)||null) : null;
}

function fillEcoPersonFilter(){
  const sel = document.getElementById('eco-person-filter'); if(!sel) return;
  const cur = sel.value;
  sel.innerHTML = '<option value="">👥 Hela familjen</option>' +
    (A.members||[]).map(m=>`<option value="${m.id}" ${m.id==cur?'selected':''}>${m.username}</option>`).join('');
}

// ───────────────────────────── TAB SWITCH ───────────────────────────
function switchEcoTab(tab){
  _ecoTab = tab;
  ['overview','trans','budget','savings','subs'].forEach(t=>{
    document.getElementById('etab-'+t)?.classList.toggle('on', t===tab);
    const p = document.getElementById('epanel-'+t);
    if(p) p.style.display = (t===tab) ? '' : 'none';
  });
  if(tab==='trans')   renderEcoTrans(A.ecoTrans||[]);
  if(tab==='budget')  renderBudget();
  if(tab==='savings') renderSavings();
  if(tab==='subs')    renderSubs();
}

// ───────────────────────────── MAIN RENDER ──────────────────────────
async function renderEco(){
  const lbl = document.getElementById('eco-month-lbl');
  if(lbl) lbl.textContent = ecoMonthLabel(A.ecoMonth);
  const sub = document.getElementById('eco-month-sub');
  if(sub) sub.textContent = ecoMonthLabel(A.ecoMonth);

  fillEcoPersonFilter();

  // Skeleton
  ['eco-h-income','eco-h-expense','eco-h-balance'].forEach(id=>{
    const el = document.getElementById(id);
    if(el){ el.textContent='⏳'; el.style.opacity='.35'; }
  });

  const pid = ecoPersonId();
  const mp  = 'month='+A.ecoMonth+(pid?'&user_id='+pid:'');

  try {
    const [summary, trans] = await Promise.all([
      api('GET','economy/summary?'+mp),
      api('GET','economy/transactions?'+mp)
    ]);
    A.ecoSummary = summary;
    A.ecoTrans   = trans||[];

    renderEcoHero(summary);
    renderPersonStrip(summary, pid);

    if(_ecoTab==='overview') renderOverview(summary);
    else if(_ecoTab==='trans')  renderEcoTrans(A.ecoTrans);
    else if(_ecoTab==='budget') renderBudget(summary);
  } catch(e){
    console.error('eco:', e);
    ['eco-h-income','eco-h-expense','eco-h-balance'].forEach(id=>{
      const el = document.getElementById(id);
      if(el){ el.textContent='–'; el.style.opacity='1'; }
    });
  }
}

// ───────────────────────────── HERO STATS ───────────────────────────
function renderEcoHero(s){
  const inc = parseFloat(s.income)||0;
  const exp = parseFloat(s.expense)||0;
  const bal = inc - exp;

  const set = (id, txt, clr) => {
    const el = document.getElementById(id);
    if(!el) return;
    el.textContent = txt;
    el.style.opacity = '1';
    if(clr) el.style.color = clr;
  };

  set('eco-h-income',  fmtMoney(inc));
  set('eco-h-expense', fmtMoney(exp));
  set('eco-h-balance',
    (bal>=0?'+':'')+fmtMoney(bal),
    bal>=0 ? 'var(--green)' : 'var(--rose)'
  );

  const bar  = document.getElementById('eco-balance-bar');
  const kvar = document.getElementById('eco-kvar');
  if(bar){
    const pct = inc>0 ? Math.min(exp/inc*100, 100) : 100;
    bar.style.width      = pct+'%';
    bar.style.background = pct>90?'var(--rose)': pct>70?'var(--amber)':'var(--green)';
  }
  if(kvar){
    if(inc>0){
      const left = inc - exp;
      kvar.textContent = left>=0
        ? `Kvar att spendera: ${fmtMoney(left)}`
        : `Överkurs: ${fmtMoney(Math.abs(left))}`;
      kvar.style.color = left>=0 ? 'var(--green)' : 'var(--rose)';
    } else kvar.textContent = '';
  }
}

// ───────────────────────────── OVERVIEW TAB ─────────────────────────
function renderOverview(summary){
  renderDonut(summary);
  renderCatBars(summary);
  renderTrend(summary.trend||[]);
  render503020(summary);
}

// Canvas donut chart
function renderDonut(s){
  const canvas = document.getElementById('eco-donut'); if(!canvas) return;
  const cats  = (s.by_category||[]).filter(c=>parseFloat(c.total)>0);
  const total = cats.reduce((a,c)=>a+parseFloat(c.total||0),0);
  const totEl = document.getElementById('eco-donut-total');
  if(totEl) totEl.textContent = fmtMoney(total);

  const ctx = canvas.getContext('2d');
  const W=canvas.width, H=canvas.height, cx=W/2, cy=H/2;
  const outerR=72, innerR=48, gap=0.025;
  ctx.clearRect(0,0,W,H);

  // BG ring
  ctx.beginPath(); ctx.arc(cx,cy,outerR,0,Math.PI*2);
  ctx.strokeStyle='rgba(255,255,255,.06)'; ctx.lineWidth=24; ctx.stroke();

  if(!cats.length){ return; }

  let ang = -Math.PI/2;
  cats.forEach(c=>{
    const slice = total>0 ? (parseFloat(c.total)/total)*Math.PI*2 - gap : 0;
    if(slice<=0) return;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,outerR, ang+gap/2, ang+slice+gap/2);
    ctx.closePath();
    ctx.fillStyle = c.color||'#4F7FFF';
    ctx.fill();
    ang += slice+gap;
  });

  // Punch hole
  ctx.beginPath(); ctx.arc(cx,cy,innerR,0,Math.PI*2);
  const surfaceColor = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim()||'#111622';
  ctx.fillStyle = surfaceColor;
  ctx.fill();
}

function renderCatBars(s){
  const el = document.getElementById('eco-cats'); if(!el) return;
  const cats = (s.by_category||[]);
  if(!cats.length){
    el.innerHTML='<div style="text-align:center;padding:20px 0;color:var(--ink3);font-size:13px">Inga kategorier ännu</div>';
    return;
  }
  const maxV = Math.max(...cats.map(c=>parseFloat(c.total)||0), 1);
  el.innerHTML = cats.map(c=>{
    const spent = parseFloat(c.total)||0;
    const bud   = parseFloat(c.budget)||0;
    const pct   = spent/maxV*100;
    const budPct= bud>0 ? Math.min(spent/bud*100,100) : 0;
    const color = budPct>100?'var(--rose)': budPct>80?'var(--amber)': (c.color||'var(--accent)');
    return `<div class="cat-bar">
      <div class="cat-bar-hd">
        <span style="display:flex;align-items:center;gap:6px">
          <span style="width:8px;height:8px;border-radius:50%;background:${c.color||'var(--accent)'}"></span>
          ${c.icon} ${esc(c.name)}
        </span>
        <span style="font-family:var(--mono);font-size:12px;font-weight:600">
          ${fmtMoney(spent)}${bud?`<span style="color:var(--ink3);font-weight:400"> / ${fmtMoney(bud)}</span>`:''}
        </span>
      </div>
      <div class="cat-bar-track"><div class="cat-bar-fill" style="width:${pct}%;background:${color}"></div></div>
      ${budPct>80&&bud>0?`<div style="font-size:10px;color:${color};margin-top:2px">${budPct>100?'⚠️ Överskriden':'⚡ '+Math.round(budPct)+'% av budget'}</div>`:''}
    </div>`;
  }).join('');
}

function renderTrend(trend){
  const el = document.getElementById('eco-trend'); if(!el) return;
  if(!trend.length){
    el.innerHTML='<div style="text-align:center;padding:30px;color:var(--ink3);font-size:13px">Inte tillräckligt med data ännu</div>';
    return;
  }
  const months={};
  trend.forEach(r=>{
    const key = r.y+'-'+String(r.m).padStart(2,'0');
    if(!months[key]) months[key]={inc:0,exp:0,lbl:ECO_MONTHS_SHT[r.m-1]};
    months[key][r.type==='income'?'inc':'exp'] += parseFloat(r.total||0);
  });
  const keys = Object.keys(months).sort().slice(-6);
  const maxV = Math.max(...keys.flatMap(k=>[months[k].inc, months[k].exp]), 1);

  el.innerHTML = `<div class="eco2-trend-chart">`+
    keys.map(k=>{
      const mo = months[k];
      const ih = Math.max(mo.inc/maxV*90, 2);
      const eh = Math.max(mo.exp/maxV*90, 2);
      return `<div class="eco2-trend-col">
        <div class="eco2-trend-bars">
          <div class="eco2-bar" style="height:${ih}px;background:var(--green);opacity:.75"
               data-tip="Inkomst: ${fmtMoney(mo.inc)}"></div>
          <div class="eco2-bar" style="height:${eh}px;background:var(--rose);opacity:.85"
               data-tip="Utgifter: ${fmtMoney(mo.exp)}"></div>
        </div>
        <div class="eco2-bar-lbl">${mo.lbl}</div>
      </div>`;
    }).join('')+
  `</div>
  <div style="display:flex;gap:16px;margin-top:10px;font-size:11px;color:var(--ink3);padding:0 4px">
    <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--green);margin-right:4px"></span>Inkomst</span>
    <span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:var(--rose);margin-right:4px"></span>Utgifter</span>
  </div>`;
}

function render503020(s){
  const el = document.getElementById('eco-rule'); if(!el) return;
  const inc = parseFloat(s.income)||0;
  if(!inc){
    el.innerHTML=`<div style="color:var(--ink3);font-size:13px;padding:8px 0">Lägg till inkomst för att se 50/30/20-guiden.</div>`;
    return;
  }
  const exp = parseFloat(s.expense)||0;
  const segments = [
    {label:'Fasta kostnader', pct:50, color:'var(--accent)',  bg:'var(--accent-bg)',  tip:'Hyra, räkningar, mat', actual: exp*0.6},
    {label:'Rörliga utgifter',pct:30, color:'var(--amber)',   bg:'var(--amber-bg)',   tip:'Nöje, kläder, café',  actual: exp*0.3},
    {label:'Sparande',        pct:20, color:'var(--green)',   bg:'var(--green-bg)',   tip:'Investeringar, buffert', actual: Math.max(inc-exp,0)},
  ];
  el.innerHTML = `<div class="eco2-rule">`+
    segments.map(seg=>{
      const aim   = inc * seg.pct/100;
      const delta = seg.actual - aim;
      const ok    = delta <= 0 || seg.label==='Sparande';
      return `<div class="eco2-rule-seg" style="background:${seg.bg}">
        <h4 style="color:${seg.color}">${seg.label}</h4>
        <div class="rpct" style="color:${seg.color}">${seg.pct}%</div>
        <div class="raim">${fmtMoney(aim)}/mån</div>
        <div class="ractual" style="color:${ok?'var(--green)':'var(--rose)'}">
          ${ok?'✅':'⚠️'} ${fmtMoney(seg.actual)}
        </div>
        <div style="font-size:10px;color:var(--ink3);margin-top:3px">${seg.tip}</div>
      </div>`;
    }).join('')+
  `</div>`;
}

// ─────────────────────────── PERSON STRIP ───────────────────────────
function renderPersonStrip(s, personId){
  const strip = document.getElementById('eco-person-strip'); if(!strip) return;
  if(personId||!A.members?.length||!s.by_user?.length){ strip.innerHTML=''; return; }
  const colors=['#4F7FFF','#10D981','#F5A623','#9B6FFF','#F04F6C','#06D6D6'];
  strip.innerHTML = `<div class="person-strip" style="margin-bottom:16px">`+
    s.by_user.map((u,i)=>{
      const bal=(parseFloat(u.income)||0)-(parseFloat(u.expense)||0);
      return `<div class="person-card">
        <div class="person-av" style="background:${colors[i%6]}">${initials(u.username)}</div>
        <div class="person-info">
          <div class="person-name">${esc(u.username)}</div>
          <div class="person-stats">
            <div class="person-stat">Inkomst <span style="color:var(--green)">${fmtMoney(u.income||0)}</span></div>
            <div class="person-stat">Utgift <span style="color:var(--rose)">${fmtMoney(u.expense||0)}</span></div>
          </div>
        </div>
        <div class="person-bal" style="color:${bal>=0?'var(--green)':'var(--rose)'}">${fmtMoney(bal)}</div>
      </div>`;
    }).join('')+
  `</div>`;
}

// ─────────────────────────── TRANSACTIONS ───────────────────────────
function filterTrans(){
  const q    = (document.getElementById('eco-search')?.value||'').toLowerCase();
  const type = document.getElementById('eco-filter-type')?.value||'';
  const cat  = document.getElementById('eco-filter-cat')?.value||'';
  const list = (A.ecoTrans||[]).filter(t=>
    (!q    || t.description.toLowerCase().includes(q) || (t.cat_name||'').toLowerCase().includes(q)) &&
    (!type || t.type===type) &&
    (!cat  || String(t.category_id)===cat)
  );
  _renderTransList(list);
}

function renderEcoTrans(trans){
  // Fill category filter dropdown
  const sel = document.getElementById('eco-filter-cat');
  if(sel && A.ecoBudgetCats){
    const cur = sel.value;
    sel.innerHTML = '<option value="">Alla kategorier</option>'+
      (A.ecoBudgetCats||[]).map(c=>
        `<option value="${c.id}" ${c.id==cur?'selected':''}>${c.icon} ${esc(c.name)}</option>`
      ).join('');
  }
  _renderTransList(trans);
}

function _renderTransList(trans){
  const el = document.getElementById('eco-trans'); if(!el) return;
  if(!trans.length){
    el.innerHTML=`<div class="empty" style="padding:48px 0">
      <div class="empty-icon">💸</div>
      <h3>Inga transaktioner</h3>
      <p>Lägg till manuellt eller importera CSV</p>
      <button class="btn btn-p btn-sm" style="margin-top:12px" onclick="openTransModal()">+ Lägg till transaktion</button>
    </div>`;
    return;
  }
  // Group by date
  const groups={}, order=[];
  trans.forEach(t=>{
    const d=t.trans_date||'';
    if(!groups[d]){groups[d]=[];order.push(d);}
    groups[d].push(t);
  });
  const today     = new Date().toISOString().slice(0,10);
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  function dateLabel(d){
    if(d===today) return 'Idag';
    if(d===yesterday) return 'Igår';
    return new Date(d+'T12:00:00').toLocaleDateString('sv-SE',{weekday:'long',day:'numeric',month:'long'});
  }
  function dayNet(rows){
    const net = rows.reduce((s,t)=>s+(t.type==='income'?1:-1)*parseFloat(t.amount),0);
    return `<span style="font-size:11px;font-weight:600;color:${net>=0?'var(--green)':'var(--rose)'}">${net>=0?'+':''}${fmtMoney(net)}</span>`;
  }
  el.innerHTML = order.map(date=>{
    const rows = groups[date];
    return `<div class="trans-date-group">
      <div class="trans-date-hd">${dateLabel(date)} ${dayNet(rows)}</div>
      ${rows.map(t=>`
      <div class="trans-row">
        <div class="trans-icon" style="background:${t.type==='income'?'var(--green-bg)':'var(--rose-bg)'}">
          ${t.receipt_photo
            ? `<img src="${esc(t.receipt_photo)}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">`
            : (t.cat_icon||'💰')}
        </div>
        <div class="trans-info">
          <div class="trans-desc">${esc(t.description)}</div>
          <div class="trans-sub">
            ${t.cat_name ? esc(t.cat_name)+' · ':'' }
            ${t.username ? '👤 '+esc(t.username) : ''}
            ${t.receipt_title ? ` · <span style="color:var(--accent2);cursor:pointer" onclick="viewReceipt(${t.receipt_id})">🧾 ${esc(t.receipt_title)}</span>`:''}
            ${t.item_name    ? ` · <span style="color:var(--cyan)">📦 ${esc(t.item_name)}</span>`:''}
          </div>
        </div>
        <div class="trans-amount ${t.type}">${t.type==='income'?'+':'−'}${fmtMoney(t.amount)}</div>
        <div style="display:flex;gap:4px;margin-left:6px">
          <button class="btn btn-g btn-icon btn-sm" onclick="editTrans(${t.id})" title="Redigera">✏️</button>
          <button class="btn btn-g btn-icon btn-sm" onclick="delTrans(${t.id})" title="Ta bort">🗑️</button>
        </div>
      </div>`).join('')}
    </div>`;
  }).join('');
}

// ─────────────────────────── BUDGET TAB ─────────────────────────────
function renderBudget(summary){
  const el = document.getElementById('eco-budget-list'); if(!el) return;
  const s   = summary||A.ecoSummary;
  const cats = A.ecoBudgetCats||[];
  if(!cats.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">🎯</div><h3>Inga kategorier</h3>
      <p>Skapa kategorier för att sätta månatliga budgetgränser</p>
      <button class="btn btn-p btn-sm" style="margin-top:12px" onclick="openBudgetCat()">+ Skapa kategori</button></div>`;
    return;
  }
  const spending={};
  (s?.by_category||[]).forEach(c=>{ spending[c.name]=parseFloat(c.total)||0; });

  // Group by type
  const income  = cats.filter(c=>c.type==='income');
  const expense = cats.filter(c=>c.type==='expense');

  const renderGroup = (list, label) => {
    if(!list.length) return '';
    return `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--ink3);margin:16px 0 8px">${label}</div>`+
      list.map(c=>{
        const spent = spending[c.name]||0;
        const bud   = parseFloat(c.budget)||0;
        const pct   = bud>0 ? Math.min(spent/bud*100,100) : 0;
        const color = pct>100?'var(--rose)': pct>80?'var(--amber)': (c.color||'var(--accent)');
        const warn  = bud>0 && pct>80;
        return `<div class="eco2-budget-item" onclick="openBudgetCat(${c.id})">
          <div class="eco2-budget-top-row">
            <div class="eco2-budget-icon">${c.icon}</div>
            <div class="eco2-budget-info">
              <div class="eco2-budget-name">${esc(c.name)}</div>
              <div class="eco2-budget-meta">${bud>0?`Budget: ${fmtMoney(bud)}/mån`:'Ingen gräns satt'}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;margin-right:8px">
              <div style="font-size:15px;font-weight:700;font-family:var(--mono);color:${pct>100?'var(--rose)':'var(--ink1)'}">${fmtMoney(spent)}</div>
              ${bud>0?`<div style="font-size:10px;color:var(--ink3)">${Math.round(pct)}% av budget</div>`:''}
            </div>
            <button class="btn btn-g btn-xs" style="flex-shrink:0" onclick="event.stopPropagation();delBudgetCat(${c.id})" title="Ta bort">🗑️</button>
          </div>
          ${bud>0?`
            <div class="eco2-budget-track"><div class="eco2-budget-fill" style="width:${pct}%;background:${color}"></div></div>
            ${warn?`<div style="font-size:10px;color:${color};margin-top:5px">
              ${pct>100?`⚠️ Budget överskriden med ${fmtMoney(spent-bud)}`:`⚡ ${fmtMoney(bud-spent)} kvar av budget`}
            </div>`:''}
          `:`<div style="font-size:10px;color:var(--ink3);margin-top:4px">Klicka för att sätta budget →</div>`}
        </div>`;
      }).join('');
  };

  el.innerHTML = renderGroup(expense,'Utgiftskategorier') + renderGroup(income,'Inkomstkategorier');
}

function openBudgetCat(id=null){
  const c = id ? (A.ecoBudgetCats||[]).find(x=>x.id==id) : null;
  document.getElementById('bc-id').value     = id||'';
  document.getElementById('bc-name').value   = c?.name||'';
  document.getElementById('bc-icon').value   = c?.icon||'💰';
  document.getElementById('bc-type').value   = c?.type||'expense';
  document.getElementById('bc-budget').value = c?.budget||'';
  document.getElementById('bc-color').value  = c?.color||'#4F7FFF';
  document.getElementById('m-bc-title').textContent = id ? 'Redigera kategori' : 'Ny budgetkategori';
  document.getElementById('m-budget-cat').classList.add('on');
}

async function saveBudgetCat(){
  const name = document.getElementById('bc-name').value.trim();
  if(!name){ toast('Namn krävs','err'); return; }
  const body = {
    name,
    icon   : document.getElementById('bc-icon').value||'💰',
    type   : document.getElementById('bc-type').value,
    budget : parseFloat(document.getElementById('bc-budget').value)||null,
    color  : document.getElementById('bc-color').value
  };
  try {
    const eid = document.getElementById('bc-id').value;
    if(eid){
      const u = await api('PUT','economy/categories/'+eid, body);
      A.ecoBudgetCats = (A.ecoBudgetCats||[]).map(c=>c.id==eid?u:c);
      toast('✅ Uppdaterad!');
    } else {
      const c = await api('POST','economy/categories', body);
      if(!A.ecoBudgetCats) A.ecoBudgetCats=[];
      A.ecoBudgetCats.push(c);
      toast('✅ Kategori sparad!');
    }
    closeModal('m-budget-cat');
    renderBudget();
  } catch(e){ toast(e.message,'err'); }
}

async function delBudgetCat(id){
  if(!confirm('Ta bort kategorin?')) return;
  try {
    await api('DELETE','economy/categories/'+id);
    A.ecoBudgetCats = (A.ecoBudgetCats||[]).filter(c=>c.id!=id);
    renderBudget(); toast('🗑️ Kategori borttagen');
  } catch(e){ toast(e.message,'err'); }
}

function applyBudgetTemplate(){
  const inc = parseFloat(A.ecoSummary?.income)||0;
  if(!inc){ toast('⚠️ Lägg till inkomst denna månad för att använda mallen','err'); return; }
  if(!confirm(`Generera 50/30/20-budget baserat på ${fmtMoney(inc)} inkomst?`)) return;
  const tmpl = [
    {name:'Boende',          icon:'🏠',budget:Math.round(inc*.25),color:'#4F7FFF'},
    {name:'Mat & Hushåll',   icon:'🛒',budget:Math.round(inc*.12),color:'#10D981'},
    {name:'Transport',       icon:'🚗',budget:Math.round(inc*.10),color:'#F5A623'},
    {name:'Nöje & Fritid',   icon:'🎭',budget:Math.round(inc*.08),color:'#9B6FFF'},
    {name:'Hälsa & Gym',     icon:'💊',budget:Math.round(inc*.05),color:'#06D6D6'},
    {name:'Kläder',          icon:'👗',budget:Math.round(inc*.05),color:'#F04F6C'},
    {name:'Sparande',        icon:'🏦',budget:Math.round(inc*.20),color:'#10D981'},
  ];
  Promise.all(
    tmpl.map(t=>api('POST','economy/categories',{...t,type:'expense'}).catch(()=>null))
  ).then(results=>{
    const saved = results.filter(Boolean);
    if(!A.ecoBudgetCats) A.ecoBudgetCats=[];
    saved.forEach(c=>A.ecoBudgetCats.push(c));
    renderBudget(); toast(`✅ ${saved.length} kategorier skapade!`);
  });
}

// ─────────────────────────── SAVINGS TAB ────────────────────────────
const _sgKey  = () => 'vault_savings_' +(A.activeFamilyId||'0');
const _nwKey  = () => 'vault_networth_'+(A.activeFamilyId||'0');
function getSG(){ try{return JSON.parse(localStorage.getItem(_sgKey())||'{}')}catch{return{}} }
function setSG(d){ localStorage.setItem(_sgKey(), JSON.stringify(d)); }
function getNW(){ try{return JSON.parse(localStorage.getItem(_nwKey())||'{"assets":[],"debts":[]}')}catch{return{assets:[],debts:[]}} }
function setNW(d){ localStorage.setItem(_nwKey(), JSON.stringify(d)); }

function renderSavings(){
  renderNetworth();
  const goals = Object.values(getSG());
  const el    = document.getElementById('eco-savings-list'); if(!el) return;
  if(!goals.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">🎯</div>
      <h3>Inga sparmål</h3><p>Skapa ett mål och följ ditt sparande</p>
      <button class="btn btn-p btn-sm" style="margin-top:12px" onclick="openSavingsGoal()">+ Skapa sparmål</button></div>`;
  } else {
    el.innerHTML=`<div style="margin-top:16px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--ink3);margin-bottom:10px">Dina sparmål</div>`+
      goals.map(g=>{
        const pct = g.target>0 ? Math.min(g.current/g.target*100,100) : 0;
        const daysLeft = g.date ? Math.ceil((new Date(g.date)-new Date())/86400000) : null;
        return `<div class="eco2-goal-card">
          <div class="eco2-goal-accent" style="background:${g.color||'var(--accent)'}"></div>
          <div class="eco2-goal-hd">
            <div class="eco2-goal-icon" style="background:${g.color||'var(--accent)'}22;color:${g.color||'var(--accent)'}">${g.icon||'🎯'}</div>
            <div style="flex:1;min-width:0">
              <div class="eco2-goal-title">${esc(g.name)}</div>
              <div class="eco2-goal-sub">
                ${fmtMoney(g.current)} av ${fmtMoney(g.target)}
                ${daysLeft!==null ? ` · ${daysLeft>0?daysLeft+'d kvar':'<span style="color:var(--rose)">Deadline passerad</span>'}` : ''}
              </div>
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0">
              <button class="btn btn-s btn-xs" onclick="openSavingsGoal('${g.id}')">✏️</button>
              <button class="btn btn-g btn-xs" onclick="delSavingsGoal('${g.id}')">🗑️</button>
            </div>
          </div>
          <div class="eco2-goal-track">
            <div class="eco2-goal-fill" style="width:${pct}%;background:${g.color||'var(--accent)'}"></div>
          </div>
          <div class="eco2-goal-pct">
            <span>${Math.round(pct)}%</span>
            <span>${fmtMoney(Math.max(g.target-g.current,0))} kvar</span>
          </div>
        </div>`;
      }).join('');
  }
  calcGrowth();
}

function renderNetworth(){
  const nw = getNW();
  const totalA = nw.assets.reduce((s,a)=>s+parseFloat(a.val||0),0);
  const totalD = nw.debts.reduce((s,d) =>s+parseFloat(d.val||0),0);
  const net    = totalA - totalD;
  const el = document.getElementById('eco-networth-body'); if(!el) return;
  if(!nw.assets.length && !nw.debts.length){
    el.innerHTML=`<div style="color:var(--ink3);font-size:13px;padding:8px 0">Klicka "Redigera" för att lägga till tillgångar och skulder.</div>`;
    return;
  }
  el.innerHTML=`<div class="eco2-nw-summary">
    <div class="eco2-nw-item">
      <div class="nwlabel">Tillgångar</div>
      <div class="nwval" style="color:var(--green)">${fmtMoney(totalA)}</div>
    </div>
    <div class="eco2-nw-item">
      <div class="nwlabel">Skulder</div>
      <div class="nwval" style="color:var(--rose)">${fmtMoney(totalD)}</div>
    </div>
    <div class="eco2-nw-item">
      <div class="nwlabel">Nettoförmögenhet</div>
      <div class="nwval" style="color:${net>=0?'var(--green)':'var(--rose)'}">${net>=0?'+':''}${fmtMoney(net)}</div>
    </div>
  </div>`;
}

function editNetworth(){
  const nw = getNW();
  const renderRows = (listId, items) => {
    document.getElementById(listId).innerHTML = items.map((a,i)=>`
      <div class="eco2-nw-row">
        <input type="text" class="fi" value="${esc(a.name)}" placeholder="T.ex. Sparkonto" style="flex:2">
        <input type="number" class="fi" value="${a.val}" placeholder="Belopp" style="flex:1">
        <button class="btn btn-g btn-xs" onclick="this.closest('.eco2-nw-row').remove()">×</button>
      </div>`).join('');
  };
  renderRows('nw-assets-list', nw.assets);
  renderRows('nw-debts-list',  nw.debts);
  document.getElementById('m-networth').classList.add('on');
}

function addNwRow(type){
  const listId = type==='asset'?'nw-assets-list':'nw-debts-list';
  const row = document.createElement('div'); row.className='eco2-nw-row';
  row.innerHTML=`<input type="text" class="fi" placeholder="${type==='asset'?'T.ex. Sparkonto':'T.ex. Bolån'}" style="flex:2">
    <input type="number" class="fi" placeholder="Belopp" style="flex:1">
    <button class="btn btn-g btn-xs" onclick="this.closest('.eco2-nw-row').remove()">×</button>`;
  document.getElementById(listId).appendChild(row);
}

function saveNetworth(){
  const read = listId => [...document.getElementById(listId).querySelectorAll('.eco2-nw-row')].map(r=>{
    const inputs = r.querySelectorAll('input');
    return {name:inputs[0].value.trim(), val:parseFloat(inputs[1].value)||0};
  }).filter(x=>x.name);
  setNW({assets:read('nw-assets-list'), debts:read('nw-debts-list')});
  closeModal('m-networth'); renderNetworth(); toast('✅ Nettoförmögenhet sparad!');
}

function openSavingsGoal(id=null){
  const g = id ? getSG()[id] : null;
  document.getElementById('sg-id').value      = id||'';
  document.getElementById('sg-name').value    = g?.name||'';
  document.getElementById('sg-target').value  = g?.target||'';
  document.getElementById('sg-current').value = g?.current||'';
  document.getElementById('sg-date').value    = g?.date||'';
  document.getElementById('sg-icon').value    = g?.icon||'🎯';
  document.getElementById('sg-color').value   = g?.color||'#4F7FFF';
  document.getElementById('m-savings-title').textContent = id?'Redigera sparmål':'Nytt sparmål';
  document.getElementById('m-savings').classList.add('on');
}

function saveSavingsGoal(){
  const name = document.getElementById('sg-name').value.trim();
  if(!name){ toast('Namn krävs','err'); return; }
  const data = getSG();
  const eid  = document.getElementById('sg-id').value;
  const id   = eid||(Date.now().toString(36));
  data[id]   = {
    id, name,
    target : parseFloat(document.getElementById('sg-target').value)||0,
    current: parseFloat(document.getElementById('sg-current').value)||0,
    date   : document.getElementById('sg-date').value,
    icon   : document.getElementById('sg-icon').value||'🎯',
    color  : document.getElementById('sg-color').value
  };
  setSG(data);
  closeModal('m-savings'); renderSavings(); toast('✅ Sparmål sparat!');
}

function delSavingsGoal(id){
  if(!confirm('Ta bort sparmålet?')) return;
  const data = getSG(); delete data[id]; setSG(data); renderSavings(); toast('🗑️ Borttaget');
}

function calcGrowth(){
  const P   = parseFloat(document.getElementById('calc-p')?.value)||0;
  const pmt = parseFloat(document.getElementById('calc-pmt')?.value)||0;
  const r   = parseFloat(document.getElementById('calc-r')?.value)||7;
  const t   = parseFloat(document.getElementById('calc-t')?.value)||10;
  const el  = document.getElementById('calc-result'); if(!el) return;
  if(!P && !pmt){ el.innerHTML=''; return; }
  const rm  = r/100/12;
  const n   = t*12;
  const fv  = rm>0
    ? P*Math.pow(1+rm,n) + pmt*(Math.pow(1+rm,n)-1)/rm
    : P + pmt*n;
  const invested = P + pmt*n;
  const growth   = fv - invested;
  el.innerHTML=`<div class="eco2-calc-result">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--accent2);margin-bottom:4px">Slutbelopp efter ${t} år</div>
    <div class="eco2-calc-amount">${fmtMoney(Math.round(fv))}</div>
    <div style="font-size:12px;color:var(--ink3);margin-top:10px;display:flex;justify-content:center;gap:24px;flex-wrap:wrap">
      <span>Insatt: <strong style="color:var(--ink2)">${fmtMoney(Math.round(invested))}</strong></span>
      <span style="color:var(--green)">Avkastning: <strong>+${fmtMoney(Math.round(growth))}</strong></span>
    </div>
  </div>`;
}

// ─────────────────────────── SUBSCRIPTIONS ──────────────────────────
const _subKey = () => 'vault_subs_'+(A.activeFamilyId||'0');
function getSubs(){ try{return JSON.parse(localStorage.getItem(_subKey())||'{}')}catch{return{}} }
function setSubs(d){ localStorage.setItem(_subKey(), JSON.stringify(d)); }

const SUB_CAT_ICONS = {
  streaming:'🎬', music:'🎵', gym:'💪',
  software:'💻', insurance:'🛡️', news:'📰', other:'📦'
};

function renderSubs(){
  const subs   = Object.values(getSubs());
  const totEl  = document.getElementById('eco-subs-total');
  const monthly= subs.reduce((s,sub)=>{
    if(sub.interval==='yearly') return s + parseFloat(sub.amount)/12;
    if(sub.interval==='weekly') return s + parseFloat(sub.amount)*4.33;
    return s + parseFloat(sub.amount);
  }, 0);
  if(totEl) totEl.textContent = subs.length
    ? `Totalt: ${fmtMoney(Math.round(monthly))}/mån — ${fmtMoney(Math.round(monthly*12))}/år`
    : '';

  // Auto-detect recurring from transactions
  detectAndShowRecurring();

  const el = document.getElementById('eco-subs-list'); if(!el) return;
  if(!subs.length){
    el.innerHTML=`<div class="empty"><div class="empty-icon">🔄</div>
      <h3>Inga abonnemang</h3><p>Lägg till dina återkommande utgifter för bättre överblick</p>
      <button class="btn btn-p btn-sm" style="margin-top:12px" onclick="openSubModal()">+ Lägg till</button></div>`;
    return;
  }
  const intLbl = {monthly:'/mån', yearly:'/år', weekly:'/vecka'};
  const now    = new Date();
  el.innerHTML = subs
    .sort((a,b)=>parseFloat(b.amount)-parseFloat(a.amount))
    .map(sub=>{
      const nextD = sub.next ? new Date(sub.next) : null;
      const days  = nextD ? Math.ceil((nextD-now)/86400000) : null;
      const soon  = days!==null && days<=14;
      const overdue= days!==null && days<0;
      return `<div class="eco2-sub-row" style="${overdue?'border-color:var(--rose)':soon?'border-color:var(--amber)':''}">
        <div class="eco2-sub-icon">${sub.icon||SUB_CAT_ICONS[sub.cat]||'📦'}</div>
        <div class="eco2-sub-info">
          <div class="eco2-sub-name">${esc(sub.name)}</div>
          <div class="eco2-sub-meta">
            ${SUB_CAT_ICONS[sub.cat]||'📦'} ${esc(sub.cat||'övrigt')}
            ${nextD ? ` · 🗓️ ${nextD.toLocaleDateString('sv-SE',{day:'numeric',month:'short'})}
              ${overdue?`<span style="color:var(--rose)"> — Förnyelse passerad!</span>`
              :soon?`<span style="color:var(--amber)"> — om ${days}d</span>`:''}` : ''}
          </div>
          ${sub.note?`<div style="font-size:11px;color:var(--ink3);margin-top:1px">${esc(sub.note)}</div>`:''}
        </div>
        <div class="eco2-sub-amount">${fmtMoney(sub.amount)} ${intLbl[sub.interval]||'/mån'}</div>
        <div style="display:flex;gap:4px;margin-left:8px">
          <button class="btn btn-g btn-xs" onclick="openSubModal('${sub.id}')">✏️</button>
          <button class="btn btn-g btn-xs" onclick="delSub('${sub.id}')">🗑️</button>
        </div>
      </div>`;
    }).join('');
}

function detectAndShowRecurring(){
  const el = document.getElementById('eco-subs-detected'); if(!el) return;
  const trans = A.ecoTrans||[];
  const counts={};
  trans.filter(t=>t.type==='expense').forEach(t=>{
    const key = t.description.trim().toLowerCase().slice(0,25);
    if(!counts[key]) counts[key]={desc:t.description, amount:parseFloat(t.amount), n:0};
    counts[key].n++;
  });
  const existing = new Set(Object.values(getSubs()).map(s=>s.name.toLowerCase()));
  const hits = Object.values(counts)
    .filter(c=>c.n>=2 && !existing.has(c.desc.toLowerCase()))
    .sort((a,b)=>b.amount-a.amount)
    .slice(0,6);
  if(!hits.length){ el.innerHTML=''; return; }
  el.innerHTML=`<div class="eco2-detected-banner">
    ⚡ <strong>${hits.length} möjliga återkommande utgifter</strong> hittades i dina transaktioner:
    <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
      ${hits.map(h=>`<button class="btn btn-s btn-xs" onclick="prefilSub('${esc(h.desc).replace(/'/g,"\\'")}',${h.amount})">
        ${esc(h.desc)} <span style="opacity:.7;font-family:var(--mono)">${fmtMoney(h.amount)}</span>
      </button>`).join('')}
    </div>
  </div>`;
}

function prefilSub(desc, amount){
  openSubModal();
  document.getElementById('sub-name').value   = desc;
  document.getElementById('sub-amount').value = amount;
}

function openSubModal(id=null){
  const data = getSubs();
  const s    = id ? data[id] : null;
  document.getElementById('sub-id').value       = id||'';
  document.getElementById('sub-name').value     = s?.name||'';
  document.getElementById('sub-icon').value     = s?.icon||'';
  document.getElementById('sub-amount').value   = s?.amount||'';
  document.getElementById('sub-interval').value = s?.interval||'monthly';
  document.getElementById('sub-next').value     = s?.next||'';
  document.getElementById('sub-cat').value      = s?.cat||'other';
  document.getElementById('sub-note').value     = s?.note||'';
  document.getElementById('m-sub-title').textContent = id?'Redigera abonnemang':'Nytt abonnemang';
  document.getElementById('m-sub').classList.add('on');
}

function saveSub(){
  const name = document.getElementById('sub-name').value.trim();
  if(!name){ toast('Namn krävs','err'); return; }
  const data = getSubs();
  const eid  = document.getElementById('sub-id').value;
  const id   = eid||(Date.now().toString(36));
  data[id]   = {
    id, name,
    icon    : document.getElementById('sub-icon').value,
    amount  : parseFloat(document.getElementById('sub-amount').value)||0,
    interval: document.getElementById('sub-interval').value,
    next    : document.getElementById('sub-next').value,
    cat     : document.getElementById('sub-cat').value,
    note    : document.getElementById('sub-note').value
  };
  setSubs(data);
  closeModal('m-sub'); renderSubs(); toast('✅ Abonnemang sparat!');
}

function delSub(id){
  if(!confirm('Ta bort abonnemanget?')) return;
  const data = getSubs(); delete data[id]; setSubs(data); renderSubs(); toast('🗑️ Borttaget');
}

// ─────────────────────────── TRANSACTION CRUD ───────────────────────
let A_ecoTransType = 'expense';

function fillTransReceiptSel(selId=null){
  const el = document.getElementById('tr-receipt'); if(!el) return;
  el.innerHTML = '<option value="">Inget kvitto</option>'+
    (A.receipts||[]).map(r=>`<option value="${r.id}" ${r.id==selId?'selected':''}>🧾 ${esc(r.title)}${r.store?' – '+esc(r.store):''}${r.amount?' ('+fmtMoney(r.amount)+')':''}</option>`).join('');
}

function fillTransItemSel(selId=null){
  const el = document.getElementById('tr-item'); if(!el) return;
  el.innerHTML = '<option value="">Ingen sak</option>'+
    (A.items||[]).map(i=>`<option value="${i.id}" ${i.id==selId?'selected':''}>${cIcon(i.category)} ${esc(i.name)}</option>`).join('');
}

function openTransModal(prefillReceiptId=null){
  A_ecoTransType = 'expense';
  ['tr-desc','tr-amount','tr-note'].forEach(x=>{ const el=document.getElementById(x); if(el) el.value=''; });
  const dateEl = document.getElementById('tr-date'); if(dateEl) dateEl.value=new Date().toISOString().slice(0,10);
  const idEl   = document.getElementById('tr-id');   if(idEl)   idEl.value='';
  setTransType('expense');
  fillEcoCatSel();
  fillTransReceiptSel(prefillReceiptId);
  fillTransItemSel();
  if(prefillReceiptId){
    const r = (A.receipts||[]).find(x=>x.id==prefillReceiptId);
    if(r){
      const d=document.getElementById('tr-desc'); if(d) d.value=r.title;
      const a=document.getElementById('tr-amount'); if(a&&r.amount) a.value=r.amount;
      const dt=document.getElementById('tr-date'); if(dt&&r.receipt_date&&r.receipt_date!=='0000-00-00') dt.value=r.receipt_date;
      if(r.item_id) fillTransItemSel(r.item_id);
    }
  }
  const t = document.getElementById('m-trans-title'); if(t) t.textContent='Ny transaktion';
  document.getElementById('m-trans')?.classList.add('on');
}

function editTrans(id){
  const t = (A.ecoTrans||[]).find(x=>x.id==id); if(!t) return;
  A_ecoTransType = t.type;
  document.getElementById('tr-desc').value  = t.description;
  document.getElementById('tr-amount').value= t.amount;
  document.getElementById('tr-date').value  = t.trans_date;
  document.getElementById('tr-note').value  = t.note||'';
  document.getElementById('tr-id').value    = id;
  setTransType(t.type);
  fillEcoCatSel(t.category_id);
  fillTransReceiptSel(t.receipt_id);
  fillTransItemSel(t.item_id);
  const title = document.getElementById('m-trans-title'); if(title) title.textContent='Redigera transaktion';
  document.getElementById('m-trans')?.classList.add('on');
}

function setTransType(type){
  A_ecoTransType = type;
  const expBtn = document.getElementById('tt-expense');
  const incBtn = document.getElementById('tt-income');
  if(expBtn) expBtn.className = 'btn '+(type==='expense'?'btn-d':'btn-s');
  if(incBtn) incBtn.className = 'btn '+(type==='income'?'btn-t':'btn-s');
  fillEcoCatSel();
}

function fillEcoCatSel(selId){
  const el = document.getElementById('tr-cat'); if(!el) return;
  el.innerHTML = '<option value="">Ingen kategori</option>'+
    (A.ecoBudgetCats||[]).filter(c=>c.type===A_ecoTransType)
    .map(c=>`<option value="${c.id}" ${c.id==selId?'selected':''}>${c.icon} ${esc(c.name)}</option>`).join('');
}

async function saveTrans(){
  const desc = document.getElementById('tr-desc').value.trim();
  const amt  = parseFloat(document.getElementById('tr-amount').value);
  if(!desc||!amt||amt<=0){ toast('⚠️ Beskrivning och belopp krävs','err'); return; }
  const body = {
    type        : A_ecoTransType,
    description : desc,
    amount      : amt,
    trans_date  : document.getElementById('tr-date').value,
    category_id : parseInt(document.getElementById('tr-cat').value)||null,
    receipt_id  : parseInt(document.getElementById('tr-receipt').value)||null,
    item_id     : parseInt(document.getElementById('tr-item').value)||null,
    note        : document.getElementById('tr-note').value
  };
  try {
    const eid = document.getElementById('tr-id').value;
    if(eid){
      const u = await api('PUT','economy/transactions/'+eid, body);
      A.ecoTrans = (A.ecoTrans||[]).map(t=>t.id==eid?u:t);
      toast('✅ Uppdaterad!');
    } else {
      const c = await api('POST','economy/transactions', body);
      if(!A.ecoTrans) A.ecoTrans=[];
      A.ecoTrans.unshift(c);
      toast('✅ Sparad!');
    }
    closeModal('m-trans');
    renderEco();
  } catch(e){ toast(e.message,'err'); }
}

async function delTrans(id){
  if(!confirm('Ta bort transaktionen?')) return;
  try {
    await api('DELETE','economy/transactions/'+id);
    A.ecoTrans = (A.ecoTrans||[]).filter(t=>t.id!=id);
    renderEco();
    toast('🗑️ Borttagen');
  } catch(e){ toast(e.message,'err'); }
}

// ─────────────────────────── CSV IMPORT ─────────────────────────────
let csvFile = null;
function openImport(){
  document.getElementById('csv-prev').innerHTML='📄 <span style="font-size:12px">Välj CSV-fil från din bank</span>';
  document.getElementById('import-result').style.display='none';
  document.getElementById('do-import').style.display='none';
  csvFile=null;
  document.getElementById('m-import').classList.add('on');
}
function handleCsvSelect(input){
  const f = input.files[0]; if(!f) return;
  csvFile = f;
  document.getElementById('csv-prev').textContent='📄 '+f.name+' ('+Math.round(f.size/1024)+' KB)';
  document.getElementById('do-import').style.display='';
}
async function doImport(){
  if(!csvFile){ toast('Välj en fil','err'); return; }
  const btn = document.getElementById('do-import'); btn.textContent='Importerar…'; btn.disabled=true;
  const fd  = new FormData(); fd.append('file', csvFile);
  try {
    const r  = await fetch('api/economy/import',{method:'POST',headers:{Authorization:'Bearer '+A.token},body:fd});
    const tx = await r.text(); let d;
    try{d=JSON.parse(tx);}catch{toast('Serverfel','err');return;}
    if(!r.ok){
      document.getElementById('import-result').style.display='';
      document.getElementById('import-result').innerHTML=`<div class="card" style="background:var(--rose-bg);border-color:var(--rose)">
        <strong style="color:var(--rose)">⚠️ Importfel</strong>
        <div style="font-size:13px;margin-top:6px">${esc(d.error||'Okänt fel')}</div>
        ${d.headers_found?`<div style="font-size:11px;font-family:var(--mono);margin-top:8px;color:var(--ink3)">Kolumner: ${d.headers_found.join(' | ')}</div>`:''}
      </div>`;
      return;
    }
    const rows=[`✅ <strong>${d.imported}</strong> transaktioner importerade`,
      d.duplicates>0?`⏭ ${d.duplicates} dubbletter hoppades över`:'',
      d.skipped>0?`⚠️ ${d.skipped} rader kunde inte tolkas`:''
    ].filter(Boolean).join('<br>');
    document.getElementById('import-result').style.display='';
    document.getElementById('import-result').innerHTML=`<div class="card" style="background:var(--green-bg);border-color:var(--green)">
      <strong style="color:var(--green)">Import klar!</strong>
      <div style="font-size:13px;margin-top:8px;line-height:1.8">${rows}</div>
    </div>`;
    btn.style.display='none';
    if(d.imported>0){ await renderEco(); toast(`✅ ${d.imported} transaktioner importerade!`); }
  } catch(e){ toast(e.message,'err'); }
  finally { btn.textContent='Importera'; btn.disabled=false; }
}
// ── Dashboard ──────────────────────────────────────────────────────

const _SV_SHORT = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
const _SV_FULL  = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];

// Dashboard widget visibility config
function dashWidget(key){ return getSetting('widget_'+key, true); }

function renderDash(){
  // Greeting + date
  const hr = new Date().getHours();
  const gr = hr<5?'God natt':hr<12?'God morgon':hr<18?'God eftermiddag':'God kväll';
  document.getElementById('dash-greeting').textContent = gr + ', ' + (A.user?.username||'') + '!';
  document.getElementById('dash-date').textContent =
    new Date().toLocaleDateString('sv-SE',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  renderDashStats();
  renderDashSpotlight();
  renderDashAlerts();
  if(dashWidget('tasks'))    renderDashTasks();    else _hideWidget('d-tasks-wrap');
  if(dashWidget('eco'))      renderDashEco();      else _hideWidget('d-eco-wrap');
  if(dashWidget('service'))  renderDashService();  else _hideWidget('d-svc-wrap');
  if(dashWidget('recent'))   renderDashRecent();   else _hideWidget('d-items-wrap');
  if(dashWidget('activity')) renderDashActivity(); else _hideWidget('d-activity-wrap');

  // Load snapshots for value chart (non-blocking)
  if(dashWidget('value_chart') && typeof loadSnapshots==='function'){
    loadSnapshots().then(()=>renderValueSparkline('d-sparkline')).catch(()=>{});
  }
}
function _hideWidget(id){ const el=document.getElementById(id); if(el) el.style.display='none'; }

// ── Stats strip ────────────────────────────────────────────────────
function renderDashStats(){
  const el = document.getElementById('stats'); if(!el) return;

  const totalVal    = A.items.reduce((s,i)=>s+(parseFloat(i.price)||0),0);
  const activeTasks = A.tasks.filter(t=>!t.done).length;
  const doneTasks   = A.tasks.filter(t=>t.done).length;
  const svcOverdue  = A.svcs.filter(s=>{ const d=daysTo(s.next_date); return d!==null&&d<0; }).length;
  const svcSoon     = A.svcs.filter(s=>{ const d=daysTo(s.next_date); return d!==null&&d>=0&&d<=30; }).length;
  const alerts      = svcOverdue + svcSoon;
  const bal         = A.ecoSummary ? parseFloat(A.ecoSummary.balance)||0 : null;
  const expPct      = A.ecoSummary
    ? (parseFloat(A.ecoSummary.income)>0
        ? Math.round(parseFloat(A.ecoSummary.expense)/parseFloat(A.ecoSummary.income)*100)
        : null)
    : null;

  const chip = (icon, val, label, sub, color, extraClass, click) =>
    `<div class="dash-stat-chip ${extraClass||''}" onclick="${click}" style="--chip-color:${color}">
      <div class="dsc-top">
        <span class="dsc-icon">${icon}</span>
        <span class="dsc-val">${val}</span>
      </div>
      <div class="dsc-label">${label}</div>
      ${sub?`<div class="dsc-sub">${sub}</div>`:''}
    </div>`;

  el.innerHTML =
    chip('📦', A.items.length, 'Saker',
      totalVal>0 ? fmtMoney(Math.round(totalVal)) + ' totalt' : A.cats.length+' kategorier',
      'var(--accent)', '', "go('inv')") +

    chip(activeTasks>0&&A.tasks.some(t=>!t.done&&t.priority==='urgent')?'🔴':'📋',
      activeTasks,
      activeTasks ? 'Aktiva uppgifter' : 'Uppgifter klara!',
      doneTasks ? doneTasks+' avklarade' : 'Lägg till uppgifter',
      activeTasks ? 'var(--amber)' : 'var(--green)',
      '', "go('tasks')") +

    chip(alerts>0?(svcOverdue>0?'🔴':'🟡'):'🔧',
      A.svcs.length,
      alerts>0 ? (svcOverdue>0?'Service försenad':'Service snart') : 'Service',
      alerts>0 ? (svcOverdue>0?svcOverdue+' försenad, '+svcSoon+' snart':svcSoon+' inom 30 dagar') : (A.svcs.length?A.svcs.length+' schemalagda':'Inget inlagt'),
      alerts>0?(svcOverdue>0?'var(--rose)':'var(--amber)'):'var(--border2)',
      '', "go('svc')") +

    (bal!==null
      ? chip('💰',
          (bal>=0?'+':'')+fmtMoney(bal),
          'Saldo '+_SV_SHORT[parseInt(A.ecoMonth.split('-')[1])-1],
          expPct!==null ? expPct+'% av inkomst spenderat' : A.ecoMonth.split('-')[0],
          bal>=0?'var(--green)':'var(--rose)',
          '', "go('eco')")
      : chip('💰', '–', 'Ekonomi', 'Inga data denna månad', 'var(--border2)', '', "go('eco')")
    );
}

// ── Spotlight — single most important item ─────────────────────────
function renderDashSpotlight(){
  const el = document.getElementById('d-spotlight'); if(!el) return;

  // Priority: urgent task → overdue service → high task → warranty expiring
  const urgent = A.tasks.find(t=>!t.done && t.priority==='urgent');
  const svcOd  = A.svcs.find(s=>{ const d=daysTo(s.next_date); return d!==null&&d<0; });
  const high   = A.tasks.find(t=>!t.done && t.priority==='high');
  const warnW  = A.items.find(i=>wSt(i.warranty)==='soon');

  let html = '';
  if(urgent){
    html = `<div class="dash-spotlight urgent" onclick="editTask(${urgent.id})">
      <div class="ds-dot" style="background:var(--rose)"></div>
      <div class="ds-body">
        <div class="ds-eyebrow">Akut uppgift</div>
        <div class="ds-title">${esc(urgent.title)}</div>
        ${urgent.due_date?`<div class="ds-sub">📅 ${fmtDate(urgent.due_date)}</div>`:''}
      </div>
      <div class="ds-arrow">→</div>
    </div>`;
  } else if(svcOd){
    const d = daysTo(svcOd.next_date);
    html = `<div class="dash-spotlight overdue" onclick="editSvc(${svcOd.id})">
      <div class="ds-dot" style="background:var(--rose)"></div>
      <div class="ds-body">
        <div class="ds-eyebrow">Försenad service</div>
        <div class="ds-title">${esc(svcOd.title)}</div>
        <div class="ds-sub">🔧 ${Math.abs(d)} dagar försenad${svcOd.item_name?' · '+esc(svcOd.item_name):''}</div>
      </div>
      <div class="ds-arrow">→</div>
    </div>`;
  } else if(high){
    html = `<div class="dash-spotlight high" onclick="editTask(${high.id})">
      <div class="ds-dot" style="background:var(--amber)"></div>
      <div class="ds-body">
        <div class="ds-eyebrow">Hög prioritet</div>
        <div class="ds-title">${esc(high.title)}</div>
        ${high.due_date?`<div class="ds-sub">📅 ${fmtDate(high.due_date)}</div>`:high.assigned_name?`<div class="ds-sub">👤 ${esc(high.assigned_name)}</div>`:''}
      </div>
      <div class="ds-arrow">→</div>
    </div>`;
  } else if(warnW){
    const d = daysTo(warnW.warranty);
    html = `<div class="dash-spotlight warn" onclick="showDetail(${warnW.id})">
      <div class="ds-dot" style="background:var(--amber)"></div>
      <div class="ds-body">
        <div class="ds-eyebrow">Garanti snart ut</div>
        <div class="ds-title">${esc(warnW.name)}</div>
        <div class="ds-sub">⏳ ${d} dagar kvar</div>
      </div>
      <div class="ds-arrow">→</div>
    </div>`;
  }
  el.innerHTML = html;
}

// ── Alerts (compact banner style) ─────────────────────────────────
function renderDashAlerts(){
  const el = document.getElementById('d-alerts'); if(!el) return;
  const al = getAlerts();
  if(!al.length){ el.innerHTML=''; return; }

  const overdue = al.filter(a=>a.type==='overdue');
  const soon    = al.filter(a=>a.type!=='overdue');

  el.innerHTML = `<div class="dash-alert-banner ${overdue.length?'has-overdue':'has-soon'}">
    <div class="dab-left">
      <span class="dab-icon">${overdue.length?'🔴':'⚠️'}</span>
      <div>
        <div class="dab-title">${overdue.length
          ? `${overdue.length} ${overdue.length===1?'försenad service':'försenade'}`
          : `${soon.length} ${soon.length===1?'påminnelse':'påminnelser'} snart`}</div>
        <div class="dab-sub">${al.slice(0,3).map(a=>esc(a.title)).join(' · ')}</div>
      </div>
    </div>
    <button class="btn btn-sm ${overdue.length?'btn-d':'btn-g'}" onclick="go('svc')">Visa →</button>
  </div>`;
}

// ── Tasks with inline checkboxes ───────────────────────────────────
let _dashShowDone = false;
function renderDashTasks(){
  const el = document.getElementById('d-tasks'); if(!el) return;
  const po = {urgent:0,high:1,medium:2,low:3};
  const priColor = {urgent:'var(--rose)',high:'var(--amber)',medium:'var(--accent)',low:'var(--green)'};
  const priLbl   = {urgent:'Akut',high:'Hög',medium:'Medel',low:'Låg'};

  const active = A.tasks.filter(t=>!t.done)
    .sort((a,b)=>{ if(po[a.priority]!==po[b.priority]) return po[a.priority]-po[b.priority];
      if(a.due_date&&b.due_date) return new Date(a.due_date)-new Date(b.due_date);
      if(a.due_date) return -1; if(b.due_date) return 1; return 0; })
    .slice(0,7);
  const done = A.tasks.filter(t=>t.done).slice(0,5);

  // Quick-add row
  let html = `<div class="dash-task-add">
    <input class="fi" id="dash-quick-task" placeholder="+ Snabblägg uppgift…" onkeydown="if(event.key==='Enter')dashQuickAddTask()" style="border:none;background:transparent;font-size:13px;padding:10px 16px;width:100%;outline:none">
  </div>`;

  if(!active.length){
    html += `<div class="dash-empty-tasks">🎉 Alla uppgifter klara!</div>`;
  } else {
    html += active.map(t=>{
      const overdue = t.due_date && daysTo(t.due_date)<0;
      return `<div class="dash-task-row" onclick="editTask(${t.id})">
        <div class="dash-task-pri" style="background:${priColor[t.priority]}"></div>
        <div class="chk" onclick="event.stopPropagation();toggleTask(${t.id})"></div>
        <div class="dash-task-txt">
          <span class="dash-task-title">${esc(t.title)}</span>
          <span class="dash-task-meta">${overdue?`<span style="color:var(--rose)">⚠️ Försenad</span> · `:t.due_date?'📅 '+fmtDate(t.due_date)+' · ':''}${t.assigned_name?'👤 '+esc(t.assigned_name):''}
          </span>
        </div>
        <span class="dash-task-badge" style="background:${priColor[t.priority]}22;color:${priColor[t.priority]}">${priLbl[t.priority]}</span>
      </div>`;
    }).join('');
  }

  if(done.length){
    html += `<div class="dash-done-toggle" onclick="toggleDashDone()">
      ${_dashShowDone?'▲':'▼'} ${done.length} avklarade
    </div>`;
    if(_dashShowDone){
      html += done.map(t=>`
        <div class="dash-task-row done">
          <div class="dash-task-pri" style="background:var(--border2)"></div>
          <div class="chk on" onclick="toggleTask(${t.id})">✓</div>
          <div class="dash-task-txt" style="text-decoration:line-through;opacity:.45">
            <span class="dash-task-title">${esc(t.title)}</span>
          </div>
        </div>`).join('');
    }
  }

  el.innerHTML = html;
}
function toggleDashDone(){ _dashShowDone = !_dashShowDone; renderDashTasks(); }

async function dashQuickAddTask(){
  const inp = document.getElementById('dash-quick-task');
  const title = inp?.value.trim(); if(!title) return;
  try {
    const t = await api('POST','tasks',{title,priority:'medium',done:0});
    A.tasks.unshift(t);
    inp.value = '';
    badges(); renderDashTasks(); renderDashStats();
    toast('✅ '+title);
  } catch(e){ toast(e.message,'err'); }
}

// ── Economy mini-card ──────────────────────────────────────────────
function renderDashEco(){
  const el  = document.getElementById('d-eco'); if(!el) return;
  const hd  = document.getElementById('d-eco-hd');
  const [y,m] = A.ecoMonth.split('-');
  const lbl = _SV_SHORT[parseInt(m)-1]+' '+y;

  if(hd) hd.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
      <h3>💰 Ekonomi</h3>
      <div style="display:flex;align-items:center;gap:4px">
        <button class="btn btn-g btn-xs" style="padding:2px 8px;font-size:13px" onclick="dashEcoStep(-1)">‹</button>
        <span style="font-size:12px;font-weight:600;min-width:60px;text-align:center;color:var(--ink2)">${lbl}</span>
        <button class="btn btn-g btn-xs" style="padding:2px 8px;font-size:13px" onclick="dashEcoStep(1)">›</button>
        <button class="btn btn-g btn-xs" onclick="go('eco')" style="margin-left:4px">Se mer →</button>
      </div>
    </div>`;

  if(!A.ecoSummary){
    el.innerHTML=`<div class="dash-eco-empty">
      <div style="font-size:28px;margin-bottom:8px">💸</div>
      <div style="font-size:13px;color:var(--ink3)">Inga transaktioner för ${lbl}</div>
      <button class="btn btn-p btn-sm" style="margin-top:12px" onclick="go('eco');setTimeout(()=>openTransModal(),100)">+ Lägg till transaktion</button>
    </div>`;
    return;
  }

  const s   = A.ecoSummary;
  const bal = parseFloat(s.balance)||0;
  const inc = parseFloat(s.income)||0;
  const exp = parseFloat(s.expense)||0;
  const pct = inc>0 ? Math.min(exp/inc*100,100) : (exp>0?100:0);
  const barColor = pct>90?'#ff7096':pct>70?'#fbbf24':'#4ade80';
  const recentTrans = (A.ecoTrans||[]).slice(0,5);

  el.innerHTML = `
    <div class="dash-eco-hero">
      <div class="dash-eco-bal-lbl">Nettosaldo ${lbl}</div>
      <div class="dash-eco-bal ${bal<0?'neg':''}">${(bal>=0?'+':'')+fmtMoney(bal)}</div>
      <div class="dash-eco-row">
        <div class="dash-eco-col">
          <div class="dash-eco-lbl">↑ Inkomst</div>
          <div class="dash-eco-val income">${fmtMoney(inc)}</div>
        </div>
        <div style="width:1px;background:rgba(255,255,255,.15)"></div>
        <div class="dash-eco-col">
          <div class="dash-eco-lbl">↓ Utgifter</div>
          <div class="dash-eco-val expense">${fmtMoney(exp)}</div>
        </div>
      </div>
      <div class="dash-eco-bar-wrap">
        <div class="dash-eco-bar-fill" style="width:${pct}%;background:${barColor}"></div>
      </div>
    </div>
    ${recentTrans.length ? `
    <div class="dash-eco-section-lbl">Senaste transaktioner</div>
    ${recentTrans.map(t=>{
      const isInc = t.type==='income';
      const cat = (A.ecoBudgetCats||[]).find(c=>c.id==t.category_id);
      return `<div class="dash-eco-cat" onclick="go('eco')">
        <span style="font-size:15px;flex-shrink:0">${cat?.icon||'💰'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.description||cat?.name||'—')}</div>
          <div style="font-size:10px;color:var(--ink3)">${t.trans_date?fmtDate(t.trans_date):''}</div>
        </div>
        <div style="font-size:13px;font-weight:700;font-family:var(--mono);flex-shrink:0;color:${isInc?'var(--green)':'var(--rose)'}">${isInc?'+':'-'}${fmtMoney(Math.abs(parseFloat(t.amount)||0))}</div>
      </div>`;
    }).join('')}` : `
    ${(s.by_category||[]).slice(0,3).map(c=>{
      const pctC = exp>0 ? Math.min(parseFloat(c.total)/exp*100,100) : 0;
      return `<div class="dash-eco-cat" onclick="go('eco')">
        <span style="font-size:15px;flex-shrink:0">${c.icon||'💰'}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</div>
          <div style="height:3px;background:var(--surface2);border-radius:2px;margin-top:4px;overflow:hidden">
            <div style="height:100%;width:${pctC}%;background:${c.color||'var(--accent)'};border-radius:2px;transition:width .5s"></div>
          </div>
        </div>
        <div style="font-size:12px;font-weight:700;font-family:var(--mono);flex-shrink:0">${fmtMoney(c.total)}</div>
      </div>`;
    }).join('')}`}
    <div style="padding:8px 16px;border-top:1px solid var(--border)">
      <button class="btn btn-s btn-sm" style="width:100%;justify-content:center" onclick="go('eco');setTimeout(()=>openTransModal(),100)">+ Ny transaktion</button>
    </div>`;
}

async function dashEcoStep(dir){
  const [y,m] = A.ecoMonth.split('-');
  let nm=parseInt(m)+dir, ny=parseInt(y);
  if(nm>12){nm=1;ny++;} if(nm<1){nm=12;ny--;}
  A.ecoMonth = ny+'-'+String(nm).padStart(2,'0');
  const ecol = document.getElementById('eco-month-lbl');
  if(ecol) ecol.textContent = _SV_FULL[parseInt(A.ecoMonth.split('-')[1])-1]+' '+A.ecoMonth.split('-')[0];
  try {
    const [summary, trans] = await Promise.all([
      api('GET','economy/summary?month='+A.ecoMonth),
      api('GET','economy/transactions?month='+A.ecoMonth)
    ]);
    A.ecoSummary = summary;
    A.ecoTrans   = trans||[];
  } catch(e){ console.error('dashEcoStep:', e); }
  renderDashStats();
  renderDashEco();
}

// ── Service upcoming ──────────────────────────────────────────────
function renderDashService(){
  const el = document.getElementById('d-svc'); if(!el) return;
  if(!A.svcs.length){
    el.innerHTML=`<div class="dash-empty">
      <div style="font-size:24px;margin-bottom:6px">🔧</div>
      <div style="font-size:12px;color:var(--ink3)">Ingen service inlagd</div>
      <button class="btn btn-s btn-sm" style="margin-top:8px" onclick="openSvc()">+ Lägg till</button>
    </div>`;
    return;
  }
  const sorted = [...A.svcs]
    .sort((a,b)=>(daysTo(a.next_date)??99999)-(daysTo(b.next_date)??99999))
    .slice(0,5);

  el.innerHTML = sorted.map(sv=>{
    const d = daysTo(sv.next_date);
    const overdue = d!==null && d<0;
    const soon    = d!==null && d>=0 && d<=30;
    const bdg = d===null
      ? `<span class="badge" style="background:var(--surface2);color:var(--ink3)">Inget datum</span>`
      : overdue
        ? `<span class="badge b-rose">−${Math.abs(d)}d</span>`
        : soon
          ? `<span class="badge b-amber">${d===0?'Idag':'om '+d+'d'}</span>`
          : `<span class="badge" style="background:var(--surface2);color:var(--ink3)">om ${Math.round(d/30)}mån</span>`;
    return `<div class="dash-svc-row ${overdue?'overdue':soon?'soon':''}" onclick="editSvc(${sv.id})">
      <div class="dash-svc-icon">${overdue?'🔴':soon?'🟡':'🔧'}</div>
      <div class="dash-svc-info">
        <div class="dash-svc-title">${esc(sv.title)}</div>
        <div class="dash-svc-sub">${sv.item_name?'🔗 '+esc(sv.item_name)+' · ':''}${sv.next_date&&sv.next_date!=='0000-00-00'?fmtDate(sv.next_date):'Inget datum'}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
        ${bdg}
        <button class="btn btn-t btn-xs" onclick="event.stopPropagation();markDone(${sv.id})" title="Markera utfört">✅</button>
      </div>
    </div>`;
  }).join('');
}

// ── Activity feed ──────────────────────────────────────────────────
function renderDashActivity(){
  const el = document.getElementById('d-activity'); if(!el) return;
  const wrap = document.getElementById('d-activity-wrap'); if(wrap) wrap.style.display='';
  if(!A.activity || !A.activity.length){
    // Load async if not yet loaded
    if(typeof loadActivity==='function'){
      loadActivity().then(()=>{ el.innerHTML=renderActivityFeed(8); }).catch(()=>{});
    }
    el.innerHTML=`<div style="font-size:13px;color:var(--ink3);padding:12px">Laddar…</div>`;
    return;
  }
  el.innerHTML = renderActivityFeed(8);
}

// ── Inventory value chart ──────────────────────────────────────────
function renderDashValueChart(){
  const wrap = document.getElementById('d-value-wrap'); if(wrap) wrap.style.display='';
  if(typeof renderValueSparkline==='function') renderValueSparkline('d-sparkline');
}

// ── Recent items ───────────────────────────────────────────────────
function renderDashRecent(){
  const el = document.getElementById('d-items'); if(!el) return;
  if(!A.items.length){
    el.innerHTML=`<div class="dash-empty">
      <div style="font-size:24px;margin-bottom:6px">📦</div>
      <div style="font-size:12px;color:var(--ink3)">Inga saker ännu</div>
      <button class="btn btn-s btn-sm" style="margin-top:8px" onclick="openItem()">+ Lägg till</button>
    </div>`;
    return;
  }
  el.innerHTML = A.items.slice(0,5).map(i=>{
    const ws = wSt(i.warranty);
    const wsColor = {ok:'var(--green)',soon:'var(--amber)',expired:'var(--rose)'}[ws]||'';
    const tags = (i.tags||'').split(',').map(t=>t.trim()).filter(Boolean).slice(0,2);
    return `<div class="dash-item-row" onclick="showDetail(${i.id})">
      <div class="dash-item-thumb">
        ${i.photo?`<img src="${esc(i.photo)}" alt="${esc(i.name)}" loading="lazy">`:`<span>${cIcon(i.category)}</span>`}
      </div>
      <div class="dash-item-info">
        <div class="dash-item-name">${esc(i.name)}</div>
        <div class="dash-item-meta">${esc(i.category)}${i.location?' · 📍'+esc(i.location):''}${i.price?' · '+fmtMoney(i.price):''}</div>
        ${tags.length?`<div class="item-tags">${tags.map(t=>`<span class="item-tag">${esc(t)}</span>`).join('')}</div>`:''}
      </div>
      ${ws?`<span style="width:8px;height:8px;border-radius:50%;background:${wsColor};flex-shrink:0" title="Garanti: ${ws}"></span>`:''}
    </div>`;
  }).join('');
}

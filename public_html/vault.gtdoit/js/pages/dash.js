// ── Dashboard ──────────────────────────────────────────────────────

function renderDash(){
  const hr = new Date().getHours();
  const gr = hr<5?'God natt':hr<12?'God morgon':hr<18?'God eftermiddag':'God kväll';
  document.getElementById('dash-greeting').textContent = gr + ', ' + (A.user?.username||'') + '!';
  document.getElementById('dash-date').textContent = new Date().toLocaleDateString('sv-SE',{weekday:'long',year:'numeric',month:'long',day:'numeric'});

  // ── Next urgent task banner ────────────────────────────────────
  const next = getNextTask();
  const nw = document.getElementById('next-up-wrap');
  if(next){
    const priBg   ={urgent:'var(--rose-bg)',high:'var(--amber-bg)',medium:'var(--accent-bg)',low:'var(--green-bg)'};
    const priColor={urgent:'var(--rose)',high:'var(--amber)',medium:'var(--accent2)',low:'var(--green)'};
    const priLbl  ={urgent:'AKUT',high:'HÖG',medium:'MEDEL',low:'LÅG'};
    nw.innerHTML=`<div class="next-up" style="border-left:3px solid ${priColor[next.priority]};margin-bottom:20px">
      <h3>⚡ NÄSTA UPPGIFT</h3>
      <div class="next-task">
        <div style="background:${priBg[next.priority]};width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">✅</div>
        <div class="next-content">
          <h2>${esc(next.title)}</h2>
          <p>${next.description?esc(next.description):''}${next.due_date?' · 📅 '+fmtDate(next.due_date):''}</p>
          <div class="next-actions">
            <button class="btn btn-p btn-sm" onclick="toggleTask(${next.id})">✅ Markera klar</button>
            <button class="btn btn-s btn-sm" onclick="editTask(${next.id})">✏️ Redigera</button>
          </div>
        </div>
        <span class="badge" style="background:${priBg[next.priority]};color:${priColor[next.priority]};align-self:flex-start">${priLbl[next.priority]}</span>
      </div>
    </div>`;
  } else nw.innerHTML='';

  // ── Stats (3 cards: Inventarie, Service, Uppgifter) ────────────
  const totalVal    = A.items.reduce((s,i)=>s+(parseFloat(i.price)||0),0);
  const activeTasks = A.tasks.filter(t=>!t.done).length;
  const doneTasks   = A.tasks.filter(t=>t.done).length;

  // Service counts — only rows that have a next_date
  const svcWithDate = A.svcs.filter(s => s.next_date && s.next_date !== '0000-00-00');
  const svcOverdue  = svcWithDate.filter(s => daysTo(s.next_date) < 0).length;
  const svcSoon     = svcWithDate.filter(s => { const d=daysTo(s.next_date); return d>=0 && d<=30; }).length;

  document.getElementById('stats').innerHTML=`
    <div class="stat" onclick="go('inv')">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--accent);border-radius:var(--r) var(--r) 0 0"></div>
      <div class="stat-top"><span class="stat-icon">📦</span>${totalVal>0?`<span class="badge b-blue">${Math.round(totalVal/1000)}k kr</span>`:''}</div>
      <div class="stat-val">${A.items.length}</div>
      <div class="stat-label">Saker</div>
      <div class="stat-sub">${A.cats.length} kategorier</div>
    </div>
    <div class="stat" onclick="go('svc')">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${svcOverdue>0?'var(--rose)':svcSoon>0?'var(--amber)':'var(--border2)'};border-radius:var(--r) var(--r) 0 0"></div>
      <div class="stat-top">
        <span class="stat-icon">${svcOverdue>0?'🔴':svcSoon>0?'🟡':'🔧'}</span>
        ${svcOverdue>0?`<span class="badge b-rose">${svcOverdue} försenad</span>`:svcSoon>0?`<span class="badge b-amber">${svcSoon} snart</span>`:''}
      </div>
      <div class="stat-val" style="color:${svcOverdue>0?'var(--rose)':svcSoon>0?'var(--amber)':'var(--ink1)'}">${A.svcs.length}</div>
      <div class="stat-label">${svcOverdue>0?'Service försenad':svcSoon>0?'Service snart':'Service & underhåll'}</div>
      <div class="stat-sub">${svcOverdue>0?`${svcOverdue} försenad, ${svcSoon} snart`:svcSoon>0?`${svcSoon} inom 30 dagar`:A.svcs.length>0?`${A.svcs.length} schemalagda`:'Lägg till service'}</div>
    </div>
    <div class="stat" onclick="go('tasks')">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${activeTasks>0?'var(--amber)':'var(--green)'};border-radius:var(--r) var(--r) 0 0"></div>
      <div class="stat-top"><span class="stat-icon">📋</span>${activeTasks>0?`<span class="badge b-amber">${activeTasks} kvar</span>`:''}</div>
      <div class="stat-val">${activeTasks}</div>
      <div class="stat-label">${activeTasks?'Aktiva uppgifter':'Uppgifter klara!'}</div>
      <div class="stat-sub">${doneTasks} avklarade totalt</div>
    </div>`;

  renderDashAlerts();
  renderDashTasks();

  document.getElementById('d-items').innerHTML = A.items.slice(0,4).map(i=>
    `<div class="task-row" onclick="showDetail(${i.id})">
      <div style="width:36px;height:36px;background:var(--surface2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;overflow:hidden">
        ${i.photo?`<img src="${esc(i.photo)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px">`:cIcon(i.category)}
      </div>
      <div class="task-txt"><strong>${esc(i.name)}</strong><span>${esc(i.category)}${i.price?' · '+fmtMoney(i.price):''}</span></div>
    </div>`).join('')
    || '<div style="text-align:center;padding:20px;color:var(--ink3);font-size:13px">Inga saker ännu</div>';

  renderDashEco();
}

// ── Alerts panel ───────────────────────────────────────────────────
function renderDashAlerts(){
  const el = document.getElementById('d-alerts'); if(!el) return;
  const al = getAlerts();
  if(!al.length){
    el.innerHTML='<div style="text-align:center;padding:20px;color:var(--green);font-size:13px">✅ Inga akuta påminnelser!</div>';
    return;
  }
  el.innerHTML = al.slice(0,6).map(a=>`
    <div class="alert-row ${a.type}" onclick="${a.click}" style="cursor:pointer">
      <span style="font-size:18px">${a.icon}</span>
      <div class="alert-txt">
        <strong>${esc(a.title)}</strong>
        <span>${a.sub}</span>
      </div>
      <span class="badge ${a.type==='overdue'?'b-rose':'b-amber'}">${a.label}</span>
    </div>`).join('');
}

// ── Service panel ──────────────────────────────────────────────────
function renderDashService(){
  const el = document.getElementById('d-svc'); if(!el) return;
  if(!A.svcs.length){
    el.innerHTML='<div style="text-align:center;padding:20px;color:var(--ink3);font-size:13px">Ingen service inlagd<br><button class="btn btn-s btn-sm" style="margin-top:8px" onclick="openSvc()">+ Lägg till</button></div>';
    return;
  }
  const sorted = [...A.svcs].sort((a,b) => (daysTo(a.next_date)??99999) - (daysTo(b.next_date)??99999));
  el.innerHTML = sorted.slice(0,5).map(sv => {
    const d = daysTo(sv.next_date);
    const isOverdue = d!==null && d<0;
    const isSoon    = d!==null && d>=0 && d<=30;
    const bdg = d===null ? `<span class="badge b-blue" style="background:var(--surface3);color:var(--ink3)">–</span>`
      : isOverdue ? `<span class="badge b-rose">Försenad ${Math.abs(d)}d</span>`
      : isSoon    ? `<span class="badge b-amber">Om ${d}d</span>`
      : `<span class="badge b-blue">Om ${Math.round(d/30)}mån</span>`;
    return `<div class="alert-row ${isOverdue?'overdue':isSoon?'soon':''}" onclick="editSvc(${sv.id})">
      <span style="font-size:18px">${isOverdue?'🔴':isSoon?'🟡':'🔧'}</span>
      <div class="alert-txt">
        <strong>${esc(sv.title)}</strong>
        <span>${sv.item_name?'🔗 '+esc(sv.item_name)+' · ':''}${fmtDate(sv.next_date)}</span>
      </div>
      ${bdg}
    </div>`;
  }).join('');
}

// ── Tasks panel with collapsible done section ──────────────────────
let _dashShowDone = false;
function renderDashTasks(){
  const el = document.getElementById('d-tasks'); if(!el) return;
  const po = {urgent:0,high:1,medium:2,low:3};
  const active = A.tasks.filter(t=>!t.done).sort((a,b)=>po[a.priority]-po[b.priority]).slice(0,6);
  const done   = A.tasks.filter(t=>t.done).slice(0,8);

  let html = '';
  if(!active.length){
    html += '<div style="text-align:center;padding:16px 16px 8px;color:var(--green);font-size:13px">🎉 Inga aktiva uppgifter!</div>';
  } else {
    html += active.map(t=>`
      <div class="task-row" onclick="editTask(${t.id})">
        <div class="chk" onclick="event.stopPropagation();toggleTask(${t.id})"></div>
        <div class="task-txt">
          <strong>${esc(t.title)}</strong>
          <span>${t.due_date?'📅 '+fmtDate(t.due_date):''}${t.assigned_name?' · 👤 '+esc(t.assigned_name):''}</span>
        </div>
        <span class="pri pri-${t.priority[0]}">${{urgent:'Akut',high:'Hög',medium:'Medel',low:'Låg'}[t.priority]}</span>
      </div>`).join('');
  }

  if(done.length){
    html += `<div class="dash-done-toggle" onclick="toggleDashDone()">
      ${_dashShowDone?'▲':'▼'} ${done.length} avklarade
    </div>`;
    if(_dashShowDone){
      html += done.map(t=>`
        <div class="task-row done">
          <div class="chk on" onclick="toggleTask(${t.id})">✓</div>
          <div class="task-txt" style="text-decoration:line-through;opacity:.5"><strong>${esc(t.title)}</strong></div>
        </div>`).join('');
    }
  }

  el.innerHTML = html;
}
function toggleDashDone(){ _dashShowDone = !_dashShowDone; renderDashTasks(); }

// ── Economy panel with inline month nav ───────────────────────────
const _ECO_SV = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
const _ECO_SV_FULL = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];

function renderDashEco(){
  const el = document.getElementById('d-eco'); if(!el) return;
  const [y,m] = A.ecoMonth.split('-');
  const lbl = _ECO_SV[parseInt(m)-1] + ' ' + y;

  // Inject month nav into card header
  const hd = document.getElementById('d-eco-hd');
  if(hd) hd.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
      <h3>💰 Ekonomi</h3>
      <div style="display:flex;align-items:center;gap:4px">
        <button class="btn btn-g btn-xs" style="padding:2px 8px;font-size:13px" onclick="dashEcoStep(-1)">‹</button>
        <span style="font-size:12px;font-weight:600;min-width:64px;text-align:center">${lbl}</span>
        <button class="btn btn-g btn-xs" style="padding:2px 8px;font-size:13px" onclick="dashEcoStep(1)">›</button>
        <button class="btn btn-g btn-xs" onclick="go('eco')" style="margin-left:4px">Se mer →</button>
      </div>
    </div>`;

  if(!A.ecoSummary){
    el.innerHTML='<div style="text-align:center;padding:20px;color:var(--ink3);font-size:13px">Inga transaktioner</div>';
    return;
  }
  const s = A.ecoSummary;
  el.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-bottom:1px solid var(--border)">
      <div style="padding:12px 14px;border-right:1px solid var(--border)">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--ink3);margin-bottom:3px">Inkomst</div>
        <div style="font-size:14px;font-weight:700;font-family:var(--mono);color:var(--green)">${fmtMoney(s.income)}</div>
      </div>
      <div style="padding:12px 14px;border-right:1px solid var(--border)">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--ink3);margin-bottom:3px">Utgifter</div>
        <div style="font-size:14px;font-weight:700;font-family:var(--mono);color:var(--rose)">${fmtMoney(s.expense)}</div>
      </div>
      <div style="padding:12px 14px">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--ink3);margin-bottom:3px">Balans</div>
        <div style="font-size:14px;font-weight:700;font-family:var(--mono);color:${s.balance>=0?'var(--accent2)':'var(--rose)'}">${fmtMoney(s.balance)}</div>
      </div>
    </div>
    ${(s.by_category||[]).slice(0,3).map(c=>`
      <div style="display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid var(--border)">
        <span style="font-size:15px">${c.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:500">${esc(c.name)}</div>
          <div style="height:3px;background:var(--surface2);border-radius:2px;margin-top:3px">
            <div style="height:100%;width:${Math.min(100,s.expense>0?c.total/s.expense*100:0)}%;background:${c.color||'var(--accent)'};border-radius:2px"></div>
          </div>
        </div>
        <div style="font-size:12px;font-weight:700;font-family:var(--mono)">${fmtMoney(c.total)}</div>
      </div>`).join('')}`;
}

async function dashEcoStep(dir){
  const [y,m] = A.ecoMonth.split('-');
  let nm=parseInt(m)+dir, ny=parseInt(y);
  if(nm>12){nm=1;ny++;} if(nm<1){nm=12;ny--;}
  A.ecoMonth = ny+'-'+String(nm).padStart(2,'0');
  // Sync eco page label immediately
  const ecol = document.getElementById('eco-month-lbl');
  if(ecol) ecol.textContent = _ECO_SV_FULL[parseInt(A.ecoMonth.split('-')[1])-1]+' '+A.ecoMonth.split('-')[0];
  try {
    const [summary, trans] = await Promise.all([
      api('GET','economy/summary?month='+A.ecoMonth),
      api('GET','economy/transactions?month='+A.ecoMonth)
    ]);
    A.ecoSummary = summary;
    A.ecoTrans = trans || [];
  } catch(e){ console.error('dashEcoStep:', e); }
  renderDashEco();
}
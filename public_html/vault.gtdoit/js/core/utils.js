// ── Utilities ──────────────────────────────────────────────────────

/** Escape HTML to prevent XSS */
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

/** Days from now to a date string (positive = future, negative = past) */
function daysTo(d){
  if(!d||d==='0000-00-00') return null;
  return Math.round((new Date(d+'T00:00:00') - new Date()) / 86400000);
}

/** Format date string to readable Swedish format */
function fmtDate(d){
  if(!d||d==='0000-00-00') return '–';
  return new Date(d+'T00:00:00').toLocaleDateString('sv-SE',{year:'numeric',month:'short',day:'numeric'});
}

/** Format number as Swedish currency */
function fmtMoney(v){
  return Number(v||0).toLocaleString('sv-SE',{style:'currency',currency:'SEK',maximumFractionDigits:0});
}

/** Warranty status */
function wSt(w){
  const d = daysTo(w);
  if(d===null) return null;
  if(d<0) return 'expired';
  if(d<90) return 'soon';
  return 'ok';
}

/** Get category icon */
function cIcon(name){
  const c = A.cats.find(c=>c.name===name);
  return c ? c.icon : '📦';
}

/** Get initials from a name */
function initials(n){
  return (n||'V').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
}

/** Show a toast notification */
function toast(msg, type='ok'){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.className = 'toast ' + type + ' on';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('on'), 3000);
}

/** Update navigation badges (sidebar + mobile tab bar) */
function badges(){
  const activeTasks = A.tasks.filter(t=>!t.done).length;
  const alerts = A.svcs.filter(s => {
    const d = daysTo(s.next_date);
    return d !== null && d < 30;
  }).length;

  // Sidebar badges
  const bt = document.getElementById('b-tasks');
  if(bt){ bt.textContent=activeTasks; bt.style.display=activeTasks?'':'none'; }
  const bs = document.getElementById('b-svc');
  if(bs){ bs.textContent=alerts; bs.style.display=alerts?'':'none'; }

  // Mobile tab bar dot
  const mtTasks = document.getElementById('mt-tasks');
  if(mtTasks) mtTasks.classList.toggle('on', activeTasks > 0);
}

/** Get alerts for dashboard (overdue service, expiring warranties) */
function getAlerts(){
  const a = [];
  A.svcs.forEach(s => {
    const d = daysTo(s.next_date);
    if(d===null) return;
    if(d<0) a.push({type:'overdue',icon:'🔴',title:s.title,sub:`Försenad ${Math.abs(d)} dagar`,label:'Försenad',click:`editSvc(${s.id})`});
    else if(d<=30) a.push({type:'soon',icon:'🟡',title:s.title,sub:`Om ${d} dagar`,label:d===0?'Idag':`${d}d`,click:`editSvc(${s.id})`});
  });
  A.items.forEach(i => {
    if(!i.warranty) return;
    const d = daysTo(i.warranty);
    if(d!==null && d>=0 && d<=60)
      a.push({type:d<30?'soon':'info',icon:'🛡️',title:`Garanti: ${i.name}`,sub:`Utgår om ${d} dagar`,label:`${d}d`,click:`showDetail(${i.id})`});
  });
  return a.sort((x,y) => x.type==='overdue' ? -1 : 1);
}

/** Get highest-priority uncompleted task */
function getNextTask(){
  const po = {urgent:0,high:1,medium:2,low:3};
  return A.tasks.filter(t=>!t.done).sort((a,b) => {
    if(po[a.priority] !== po[b.priority]) return po[a.priority]-po[b.priority];
    if(a.due_date && b.due_date) return new Date(a.due_date)-new Date(b.due_date);
    if(a.due_date) return -1;
    if(b.due_date) return 1;
    return 0;
  })[0] || null;
}

/** Close a modal by ID */
function closeModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove('on');
}

// Close modals on Escape key or overlay click
document.addEventListener('keydown', e => {
  if(e.key==='Escape'){
    document.querySelectorAll('.overlay.on').forEach(o => o.classList.remove('on'));
  }
});
document.addEventListener('click', e => {
  if(e.target.classList.contains('overlay')){
    e.target.classList.remove('on');
  }
});

/** Populate item select */
function fillItemSel(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.innerHTML = '<option value="">Ingen</option>' +
    A.items.map(i=>`<option value="${i.id}">${cIcon(i.category)} ${esc(i.name)}</option>`).join('');
}

/** Populate category select */
function fillCatSel(id){
  const el = document.getElementById(id);
  if(!el) return;
  const cur = el.value;
  el.innerHTML = '<option value="">– Välj kategori –</option>' +
    A.cats.map(c=>`<option value="${esc(c.name)}">${c.icon} ${esc(c.name)}</option>`).join('');
  if(cur) el.value = cur;
}

/** Populate assignee select */
function fillAssignSel(selectedId){
  const el = document.getElementById('ti-assign');
  if(!el) return;
  el.innerHTML = '<option value="">Ingen tilldelad</option>' +
    A.members.map(m=>`<option value="${m.id}" ${m.id==selectedId?'selected':''}>${esc(m.username)}</option>`).join('');
}

/** Highlight search query in text */
function hl(text, q){
  if(!q) return text;
  const re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
  return text.replace(re,'<mark style="background:rgba(79,127,255,.2);color:var(--accent2);border-radius:2px">$1</mark>');
}

/** Format duration in days to human readable */
function intLbl(d){
  return d>=365 ? Math.round(d/365)+' år' : Math.round(d/30)+' mån';
}

/** Today's date as YYYY-MM-DD string */
function todayStr(){
  return new Date().toISOString().slice(0,10);
}
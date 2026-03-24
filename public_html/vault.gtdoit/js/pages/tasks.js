// ── Tasks ──────────────────────────────────────────────────────────
function renderTasks(){
  const priLbl={urgent:'Akut',high:'Hög',medium:'Medel',low:'Låg'};
  const renderT = t=>`<div class="full-task-row ${t.done?'done':''}">
    <div class="chk ${t.done?'on':''}" onclick="toggleTask(${t.id})">${t.done?'✓':''}</div>
    <div class="task-txt" onclick="editTask(${t.id})" style="cursor:pointer;flex:1">
      <strong>${esc(t.title)}</strong>${t.interval_days>0?` <span class="badge b-purple" title="Återkommande var ${intLbl(t.interval_days)}">🔄</span>`:''}
      ${t.description?`<div style="font-size:12px;color:var(--ink3);margin-top:2px">${esc(t.description)}</div>`:''}
      <div class="task-meta">${t.category?'🏷 '+esc(t.category):''}${t.due_date?' 📅 '+fmtDate(t.due_date):''}${t.assigned_name?' 👤 '+esc(t.assigned_name):''}${t.interval_days>0?' 🔄 var '+intLbl(t.interval_days):''}</div>
    </div>
    <span class="pri pri-${t.priority[0]}">${priLbl[t.priority]}</span>
    <div class="task-acts">
      <button class="btn btn-g btn-icon btn-sm" onclick="editTask(${t.id})">✏️</button>
      <button class="btn btn-g btn-icon btn-sm" onclick="delTask(${t.id})">🗑️</button>
    </div>
  </div>`;
  const act=A.tasks.filter(t=>!t.done), done=A.tasks.filter(t=>t.done);
  document.getElementById('tasks-cnt').textContent = `${act.length} aktiva`;
  document.getElementById('t-active').innerHTML = act.length ? act.map(renderT).join('') : `<div class="empty" style="padding:32px"><div class="empty-icon" style="font-size:36px">🎉</div><h3>Allt klart!</h3></div>`;
  document.getElementById('t-done').innerHTML   = done.length ? done.map(renderT).join('') : `<div style="text-align:center;padding:24px;font-size:13px;color:var(--ink3)">Inga avklarade ännu</div>`;
}

function openTask(){
  ['ti-title','ti-desc','ti-cat','ti-due'].forEach(x=>document.getElementById(x).value='');
  document.getElementById('ti-prio').value='medium';
  document.getElementById('ti-id').value='';
  const intEl=document.getElementById('ti-interval'); if(intEl) intEl.value='0';
  fillAssignSel(); document.getElementById('m-task-title').textContent='Ny uppgift';
  document.getElementById('m-task').classList.add('on');
}
function editTask(id){
  const t=A.tasks.find(x=>x.id==id); if(!t) return;
  document.getElementById('ti-title').value=t.title;
  document.getElementById('ti-desc').value=t.description||'';
  document.getElementById('ti-prio').value=t.priority||'medium';
  document.getElementById('ti-cat').value=t.category||'';
  document.getElementById('ti-due').value=t.due_date&&t.due_date!=='0000-00-00'?t.due_date:'';
  document.getElementById('ti-id').value=id;
  const intEl=document.getElementById('ti-interval'); if(intEl) intEl.value=t.interval_days||0;
  fillAssignSel(t.assigned_to);
  document.getElementById('m-task-title').textContent='Redigera uppgift';
  document.getElementById('m-task').classList.add('on');
}
async function saveTask(){
  const title=document.getElementById('ti-title').value.trim(); if(!title){ toast('⚠️ Titel krävs','err'); return; }
  const eid=document.getElementById('ti-id').value;
  const interval=parseInt(document.getElementById('ti-interval')?.value||'0')||0;
  const body={title,description:document.getElementById('ti-desc').value,priority:document.getElementById('ti-prio').value,category:document.getElementById('ti-cat').value,due_date:document.getElementById('ti-due').value||null,assigned_to:parseInt(document.getElementById('ti-assign').value)||null,done:eid?(A.tasks.find(t=>t.id==eid)?.done||0):0,interval_days:interval};
  try {
    if(eid){ const u=await api('PUT','tasks/'+eid,body); A.tasks=A.tasks.map(t=>t.id==eid?u:t); toast('✅ Uppdaterad!'); }
    else { const c=await api('POST','tasks',body); A.tasks.unshift(c); toast('✅ Uppgift sparad!'); }
    badges(); closeModal('m-task'); render(A.page);
  } catch(e){ toast(e.message,'err'); }
}
async function toggleTask(id){
  const t=A.tasks.find(x=>x.id==id); if(!t) return;
  const u=await api('PUT','tasks/'+id,{...t,done:t.done?0:1});
  // If recurring, server creates a new task — reload list
  if(!t.done && t.interval_days>0){
    const fresh=await api('GET','tasks'); A.tasks=fresh;
  } else {
    A.tasks=A.tasks.map(x=>x.id==id?u:x);
  }
  badges(); render(A.page);
  if(!t.done) toast(t.interval_days>0?`🔄 Klar! Nästa om ${intLbl(t.interval_days)}`:'🎉 Uppgift avklarad!');
}
async function delTask(id){
  if(!confirm('Ta bort uppgiften?')) return;
  await api('DELETE','tasks/'+id); A.tasks=A.tasks.filter(t=>t.id!=id); badges(); render(A.page);
}

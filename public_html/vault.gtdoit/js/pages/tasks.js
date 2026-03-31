// ── Tasks ──────────────────────────────────────────────────────────
function renderTasks(){
  const priLbl = {
    urgent: t('tasks.priority.urgent'),
    high:   t('tasks.priority.high'),
    medium: t('tasks.priority.medium'),
    low:    t('tasks.priority.low'),
  };
  const priOrder = {urgent:0, high:1, medium:2, low:3};

  // Fill person filter
  const personSel = document.getElementById('task-filter-person');
  if(personSel){
    const cur = personSel.value;
    personSel.innerHTML = '<option value="">Alla personer</option>' +
      (A.members||[]).map(m=>`<option value="${m.id}" ${m.id==cur?'selected':''}>${esc(m.username)}</option>`).join('');
  }

  const filterPri    = document.getElementById('task-filter-pri')?.value || '';
  const filterPerson = parseInt(document.getElementById('task-filter-person')?.value) || 0;
  const sortMode     = document.getElementById('task-sort')?.value || 'priority';

  const today = new Date(); today.setHours(0,0,0,0);

  function sortTasks(arr){
    return [...arr].sort((a,b)=>{
      if(sortMode==='due'){
        if(a.due_date && b.due_date) return new Date(a.due_date)-new Date(b.due_date);
        if(a.due_date) return -1; if(b.due_date) return 1;
      }
      if(sortMode==='newest') return (b.id||0)-(a.id||0);
      // priority (default)
      if(priOrder[a.priority]!==priOrder[b.priority]) return priOrder[a.priority]-priOrder[b.priority];
      if(a.due_date && b.due_date) return new Date(a.due_date)-new Date(b.due_date);
      if(a.due_date) return -1; if(b.due_date) return 1;
      return 0;
    });
  }

  function isOverdue(tk){ return tk.due_date && new Date(tk.due_date) < today; }

  const renderT = tk => {
    const overdue = isOverdue(tk);
    return `<div class="full-task-row ${tk.done?'done':''} pri-${tk.priority[0]} ${overdue&&!tk.done?'overdue-row':''}">
      <div class="chk ${tk.done?'on':''}" onclick="toggleTask(${tk.id})" style="flex-shrink:0;margin-top:1px">${tk.done?'✓':''}</div>
      <div class="task-txt" onclick="editTask(${tk.id})" style="cursor:pointer;flex:1;min-width:0">
        <strong style="font-size:13px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(tk.title)}${tk.interval_days>0?` <span class="badge b-purple" style="font-size:9px">🔄</span>`:''}</strong>
        ${tk.description?`<div style="font-size:12px;color:var(--ink3);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(tk.description)}</div>`:''}
        <div class="task-meta">
          ${tk.category?`<span>🏷 ${esc(tk.category)}</span>`:''}
          ${tk.due_date?`<span style="color:${overdue?'var(--rose)':''};font-weight:${overdue?'600':'400'}">📅 ${overdue?'⚠️ ':''}${fmtDate(tk.due_date)}</span>`:''}
          ${tk.assigned_name?`<span>👤 ${esc(tk.assigned_name)}</span>`:''}
          ${tk.interval_days>0?`<span>🔄 var ${intLbl(tk.interval_days)}</span>`:''}
        </div>
      </div>
      <span class="pri pri-${tk.priority[0]}" style="flex-shrink:0">${priLbl[tk.priority]}</span>
      <div class="task-acts">
        <button class="btn btn-g btn-icon btn-sm" onclick="editTask(${tk.id})">✏️</button>
        <button class="btn btn-d btn-icon btn-sm" onclick="delTask(${tk.id})">🗑️</button>
      </div>
    </div>`;
  };

  let allActive = A.tasks.filter(tk=>!tk.done);
  let allDone   = A.tasks.filter(tk=>tk.done);

  // Apply filters
  if(filterPri)    allActive = allActive.filter(tk=>tk.priority===filterPri);
  if(filterPerson) allActive = allActive.filter(tk=>tk.assigned_to==filterPerson);
  if(filterPri)    allDone   = allDone.filter(tk=>tk.priority===filterPri);
  if(filterPerson) allDone   = allDone.filter(tk=>tk.assigned_to==filterPerson);

  const act  = sortTasks(allActive);
  const done = sortTasks(allDone).slice(0,20);

  // Update counts
  document.getElementById('tasks-cnt').textContent = `${act.length} ${t('tasks.active')}`;
  const acEl = document.getElementById('t-active-cnt'); if(acEl) acEl.textContent = act.length;
  const dnEl = document.getElementById('t-done-cnt');   if(dnEl) dnEl.textContent = done.length;

  // My tasks (tasks assigned to me, unfiltered)
  const myTasks = sortTasks(A.tasks.filter(tk=>!tk.done && tk.assigned_to && tk.assigned_to==A.user?.id));
  const mineWrap = document.getElementById('t-mine-wrap');
  const mineCnt  = document.getElementById('t-mine-cnt');
  if(mineWrap){
    if(myTasks.length){
      mineWrap.style.display='';
      if(mineCnt) mineCnt.textContent = `(${myTasks.length})`;
      document.getElementById('t-mine').innerHTML = myTasks.map(renderT).join('');
    } else {
      mineWrap.style.display='none';
    }
  }

  // Active column
  document.getElementById('t-active').innerHTML = act.length
    ? act.map(renderT).join('')
    : `<div class="empty" style="padding:32px 16px"><div class="empty-icon" style="font-size:36px">🎉</div><h3>${t('tasks.allclear')}</h3></div>`;

  // Done column
  document.getElementById('t-done').innerHTML = done.length
    ? done.map(renderT).join('')
    : `<div style="text-align:center;padding:24px 16px;font-size:13px;color:var(--ink3)">${t('tasks.done')}</div>`;
}

function openTask(){
  ['ti-title','ti-desc','ti-cat','ti-due'].forEach(x=>document.getElementById(x).value='');
  document.getElementById('ti-prio').value='medium';
  document.getElementById('ti-id').value='';
  const intEl=document.getElementById('ti-interval'); if(intEl) intEl.value='0';
  fillAssignSel();
  document.getElementById('m-task-title').textContent=t('modal.task.new');
  document.getElementById('m-task').classList.add('on');
}

function editTask(id){
  const tk=A.tasks.find(x=>x.id==id); if(!tk) return;
  document.getElementById('ti-title').value=tk.title;
  document.getElementById('ti-desc').value=tk.description||'';
  document.getElementById('ti-prio').value=tk.priority||'medium';
  document.getElementById('ti-cat').value=tk.category||'';
  document.getElementById('ti-due').value=tk.due_date&&tk.due_date!=='0000-00-00'?tk.due_date:'';
  document.getElementById('ti-id').value=id;
  const intEl=document.getElementById('ti-interval'); if(intEl) intEl.value=tk.interval_days||0;
  fillAssignSel(tk.assigned_to);
  document.getElementById('m-task-title').textContent=t('modal.task.edit');
  document.getElementById('m-task').classList.add('on');
}

async function saveTask(){
  const title=document.getElementById('ti-title').value.trim();
  if(!title){ toast('⚠️ Titel krävs','err'); return; }
  const eid=document.getElementById('ti-id').value;
  const interval=parseInt(document.getElementById('ti-interval')?.value||'0')||0;
  const body={
    title,
    description: document.getElementById('ti-desc').value,
    priority:    document.getElementById('ti-prio').value,
    category:    document.getElementById('ti-cat').value,
    due_date:    document.getElementById('ti-due').value||null,
    assigned_to: parseInt(document.getElementById('ti-assign').value)||null,
    done:        eid?(A.tasks.find(tk=>tk.id==eid)?.done||0):0,
    interval_days: interval,
  };
  try {
    if(eid){ const u=await api('PUT','tasks/'+eid,body); A.tasks=A.tasks.map(tk=>tk.id==eid?u:tk); toast(t('toast.saved')); }
    else   { const c=await api('POST','tasks',body); A.tasks.unshift(c); toast(t('toast.saved')); }
    badges(); closeModal('m-task'); render(A.page);
  } catch(e){ toast(e.message,'err'); }
}

async function toggleTask(id){
  const tk=A.tasks.find(x=>x.id==id); if(!tk) return;
  const u=await api('PUT','tasks/'+id,{...tk,done:tk.done?0:1});
  if(!tk.done && tk.interval_days>0){
    const fresh=await api('GET','tasks'); A.tasks=fresh;
  } else {
    A.tasks=A.tasks.map(x=>x.id==id?u:x);
  }
  badges(); render(A.page);
  if(!tk.done) toast(tk.interval_days>0?`🔄 Klar! Nästa om ${intLbl(tk.interval_days)}`:'🎉 Uppgift avklarad!');
}

async function delTask(id){
  if(!confirm('Ta bort uppgiften?')) return;
  await api('DELETE','tasks/'+id);
  A.tasks=A.tasks.filter(tk=>tk.id!=id);
  badges(); render(A.page);
}

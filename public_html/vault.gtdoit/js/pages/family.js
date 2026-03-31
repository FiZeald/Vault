// ── Family ─────────────────────────────────────────────────────────
function renderFamily(){
  const fam = A.families.find(f=>f.id===A.activeFamilyId) || A.families[0];

  // Hero card
  const heroName = document.getElementById('fam-hero-name');
  if(heroName) heroName.textContent = fam?.name || 'Min familj';
  const ic = document.getElementById('invite-code');
  if(ic) ic.textContent = fam?.invite_code || '———';

  // Member count badge
  const cnt = document.getElementById('fam-member-count');
  if(cnt) cnt.textContent = A.members.length ? A.members.length + ' st' : '';

  // Members list
  const amOwner = A.members.some(m => m.id === A.user?.id && m.family_role === 'owner');
  document.getElementById('members-list').innerHTML = A.members.length
    ? A.members.map(m => {
        const isOwner = m.family_role === 'owner';
        const isMe    = m.id === A.user?.id;
        const avContent = m.avatar_url
          ? `<img src="${esc(m.avatar_url)}" alt="${initials(m.username)}">`
          : initials(m.username);
        const kickBtn = amOwner && !isOwner
          ? `<button class="btn btn-d btn-xs" onclick="kickMember(${m.id},'${esc(m.username)}')" title="Sparka ut">✕</button>`
          : '';
        return `
        <div class="member-row">
          <div class="member-av" style="background:${m.avatar_url?'transparent':m.avatar_color||'#5B8EF0'}">${avContent}</div>
          <div class="member-info">
            <strong>${esc(m.username)}${isMe?' (du)':''}</strong>
            <span>${esc(m.email)}</span>
          </div>
          <span class="badge ${isOwner?'b-amber':'b-blue'}">${isOwner?'👑 Ägare':'Medlem'}</span>
          ${kickBtn}
        </div>`;
      }).join('')
    : `<div style="padding:24px;text-align:center;font-size:13px;color:var(--ink3)">Inga medlemmar ännu</div>`;

  // Families list
  document.getElementById('families-list').innerHTML = A.families.length
    ? A.families.map(f => {
        const isAct = f.id === A.activeFamilyId;
        const isOwner = f.family_role === 'owner';
        return `
        <div class="fam-row ${isAct?'fam-row-act':''}">
          <div class="fam-row-left">
            <div class="fam-row-icon" style="background:${isOwner?'var(--accent-bg)':'var(--surface2)'}">
              ${isOwner?'👑':'🏠'}
            </div>
            <div style="min-width:0">
              <div class="fam-row-name">${esc(f.name)}</div>
              <div class="fam-row-meta">${isOwner?'Ägare':'Medlem'}</div>
            </div>
          </div>
          <div class="fam-row-acts">
            ${isAct
              ? '<span class="badge b-blue">Aktiv</span>'
              : `<button class="btn btn-s btn-xs" onclick="switchFamily(${f.id})">Byt →</button>`}
            ${isOwner
              ? `<button class="btn btn-d btn-xs" onclick="deleteFamily(${f.id},'${esc(f.name)}')">🗑️</button>`
              : `<button class="btn btn-xs" style="background:var(--surface2);color:var(--ink3);border:1px solid var(--border)" onclick="leaveFamily(${f.id})">Lämna</button>`}
          </div>
        </div>`;
      }).join('')
    : `<div style="padding:24px;text-align:center;font-size:13px;color:var(--ink3)">Inga familjer — skapa eller gå med i en.</div>`;
}

async function deleteFamily(famId, famName) {
  const msg = t('family.delete.confirm').replace('{name}', famName);
  const confirmWord = t('family.delete.confirm_word');
  const input = prompt(msg);
  if (input?.toLowerCase().trim() !== confirmWord) {
    if (input !== null) toast(t('family.delete.wrong'), 'err');
    return;
  }
  try {
    await api('POST', 'family/delete', { family_id: famId });
    A.families = A.families.filter(f => f.id !== famId);
    if (A.activeFamilyId === famId) {
      A.activeFamilyId = A.families[0]?.id || null;
      if (A.activeFamilyId) localStorage.setItem('vault_active_family', A.activeFamilyId);
      else localStorage.removeItem('vault_active_family');
    }
    toast('🗑️ ' + t('family.delete.success'));
    await loadAll(); go('family');
  } catch(e) { toast(e.message, 'err'); }
}

async function copyInvite(){
  const fam = A.families.find(f=>f.id===A.activeFamilyId), code = fam?.invite_code||'';
  try { await navigator.clipboard.writeText(code); toast('📋 Kod kopierad!'); }
  catch { toast('Koden: '+code); }
}
async function sendInvite(){
  const email = document.getElementById('inv-email').value.trim();
  if(!email){ toast('E-post krävs','err'); return; }
  try { await api('POST','family/invite',{email}); toast('✅ Inbjudan skickad!'); document.getElementById('inv-email').value=''; }
  catch(e){ toast(e.message,'err'); }
}
async function kickMember(userId, username){
  if(!confirm(t('family.kick.confirm').replace('{name}', username))) return;
  try {
    await api('POST','family/kick',{user_id:userId});
    A.members = A.members.filter(m=>m.id!=userId);
    toast('🚫 ' + t('family.kick.success').replace('{name}', username));
    renderFamily();
  } catch(e){ toast(e.message,'err'); }
}

async function leaveFamily(famId){
  if(!confirm(t('family.leave.confirm'))) return;
  try {
    await api('POST','family/leave',{family_id:famId});
    toast(t('family.leave.success'));
    await loadAll();
    A.families.length === 0 ? logout() : go('family');
  } catch(e){ toast(e.message,'err'); }
}
function openCreateFamily(){ document.getElementById('cf-name').value=''; document.getElementById('m-create-family').classList.add('on'); }
async function createFamily(){
  const name = document.getElementById('cf-name').value.trim();
  if(!name){ toast('Namn krävs','err'); return; }
  try {
    const f = await api('POST','family/create',{name});
    A.families.push(f); A.activeFamilyId = f.id;
    localStorage.setItem('vault_active_family', f.id);
    closeModal('m-create-family'); toast('✅ Familj skapad!');
    await loadAll(); go('family');
  } catch(e){ toast(e.message,'err'); }
}
function openJoinFamily(){ document.getElementById('jf-code').value=''; document.getElementById('m-join-family').classList.add('on'); }
async function joinFamilyModal(){
  const code = document.getElementById('jf-code').value.trim().toUpperCase();
  if(!code){ toast('Kod krävs','err'); return; }
  try {
    const f = await api('POST','family/join',{invite_code:code});
    closeModal('m-join-family'); toast('✅ Välkommen till '+f.family_name+'!');
    await loadAll(); go('family');
  } catch(e){ toast(e.message,'err'); }
}
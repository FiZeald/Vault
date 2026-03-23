// ── Settings ───────────────────────────────────────────────────────

function getSettings(){
  try { return JSON.parse(localStorage.getItem('vault_settings')||'{}'); } catch{ return {}; }
}
function setSetting(key, val){
  const s = getSettings(); s[key]=val; localStorage.setItem('vault_settings', JSON.stringify(s));
}
function getSetting(key, def){
  const v = getSettings()[key]; return v===undefined ? def : v;
}

function saveSettingsBool(key, val){ setSetting(key, val); }
function saveSettingsVal(key, val){ setSetting(key, val); }

function renderSettings(){
  const s = getSettings();
  // Populate user info
  const u = A.user;
  const uname = document.getElementById('set-username-display');
  const uemail = document.getElementById('set-email-display');
  if(uname) uname.textContent = u?.username || '—';
  if(uemail) uemail.textContent = u?.email || '—';

  // Family info
  const fam = A.families.find(f=>f.id===A.activeFamilyId) || A.families[0];
  const fdisp = document.getElementById('set-family-display');
  if(fdisp) fdisp.textContent = fam ? fam.name+' ('+A.members.length+' medlemmar)' : '—';

  // Toggle states
  _setCheckbox('set-compact',      getSetting('compact', false));
  _setCheckbox('set-svc-warn',     getSetting('svc_warn', true));
  _setCheckbox('set-warr-warn',    getSetting('warr_warn', true));
  _setCheckbox('set-show-total',   getSetting('show_inv_total', true));
  _setSelect('set-svc-days',       getSetting('svc_warn_days', '30'));
  _setSelect('set-currency',       getSetting('currency', 'SEK'));

  // Apply compact mode on load
  applyCompact();
}

function _setCheckbox(id, val){
  const el = document.getElementById(id); if(el) el.checked = !!val;
}
function _setSelect(id, val){
  const el = document.getElementById(id); if(!el) return;
  for(const opt of el.options){ if(opt.value===String(val)){ opt.selected=true; break; } }
}

function toggleCompact(cb){
  setSetting('compact', cb.checked);
  applyCompact();
  toast(cb.checked ? '📐 Kompaktläge aktiverat' : '📐 Kompaktläge avaktiverat');
}
function applyCompact(){
  document.body.classList.toggle('compact', getSetting('compact', false));
}

// ── Edit profile modal ─────────────────────────────────────────────
function openEditProfile(){
  document.getElementById('ep-name').value = A.user?.username || '';
  document.getElementById('m-edit-profile').classList.add('on');
}
async function saveProfile(){
  const name = document.getElementById('ep-name').value.trim();
  if(!name){ toast('Namn krävs','err'); return; }
  try {
    const u = await api('PUT','auth/profile',{ username: name });
    A.user.username = u.username;
    updateSidebar();
    renderSettings();
    closeModal('m-edit-profile');
    toast('✅ Profil uppdaterad!');
  } catch(e){ toast(e.message,'err'); }
}

// ── Change password modal ──────────────────────────────────────────
function openChangePassword(){
  ['cp-old','cp-new','cp-new2'].forEach(x=>document.getElementById(x).value='');
  document.getElementById('m-change-pw').classList.add('on');
}
async function savePassword(){
  const oldPw  = document.getElementById('cp-old').value;
  const newPw  = document.getElementById('cp-new').value;
  const newPw2 = document.getElementById('cp-new2').value;
  if(newPw.length < 6){ toast('Lösenordet måste vara minst 6 tecken','err'); return; }
  if(newPw !== newPw2){ toast('Lösenorden matchar inte','err'); return; }
  try {
    await api('PUT','auth/password',{ old_password: oldPw, new_password: newPw });
    closeModal('m-change-pw');
    toast('✅ Lösenordet är bytt!');
  } catch(e){ toast(e.message,'err'); }
}

// ── Clear local cache ──────────────────────────────────────────────
function clearLocalCache(){
  if(!confirm('Rensa lokalt cachad data (checklists, service-historik)? Data på servern påverkas inte.')) return;
  // Remove vault-specific localStorage keys, keep token + settings + theme
  const keep = ['vault_t','vault_settings','vault_theme','vault_active_family'];
  Object.keys(localStorage).filter(k => k.startsWith('vault_') && !keep.includes(k))
    .forEach(k => localStorage.removeItem(k));
  A.checklists = [];
  toast('🗑️ Cache rensad!');
  renderSettings();
}

// Apply compact mode on startup
applyCompact();
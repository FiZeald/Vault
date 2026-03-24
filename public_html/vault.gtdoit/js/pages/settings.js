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
  // Render avatar in settings
  _renderSettingsAvatar();
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

  // Widget toggles
  _setCheckbox('set-widget-tasks',    getSetting('widget_tasks',    true));
  _setCheckbox('set-widget-eco',      getSetting('widget_eco',      true));
  _setCheckbox('set-widget-service',  getSetting('widget_service',  true));
  _setCheckbox('set-widget-recent',   getSetting('widget_recent',   true));
  _setCheckbox('set-widget-activity', getSetting('widget_activity', true));
  _setCheckbox('set-widget-chart',    getSetting('widget_value_chart', true));

  // Apply compact mode on load
  applyCompact();

  // Load notification settings from API
  loadNotifSettings();
}

// ── Notification settings ──────────────────────────────────────────
async function loadNotifSettings(){
  try {
    const data = await api('GET','notifications');
    _setCheckbox('set-notif-email', data.email_enabled);
    const sdEl = document.getElementById('set-notif-svc-days');  if(sdEl) sdEl.value = data.email_service_days  || 7;
    const wdEl = document.getElementById('set-notif-warr-days'); if(wdEl) wdEl.value = data.email_warranty_days || 30;
  } catch { /* not critical */ }
}

async function saveNotifSettings(){
  try {
    await api('POST','notifications',{
      email_enabled:      document.getElementById('set-notif-email')?.checked ? 1 : 0,
      email_service_days: parseInt(document.getElementById('set-notif-svc-days')?.value||'7'),
      email_warranty_days:parseInt(document.getElementById('set-notif-warr-days')?.value||'30'),
    });
    toast('✅ Notifikationsinställningar sparade!');
  } catch(e){ toast(e.message,'err'); }
}

// ── Widget config ──────────────────────────────────────────────────
function toggleWidget(key, cb){
  setSetting('widget_'+key, cb.checked);
  toast(cb.checked ? '✅ Widget visas' : 'Widget dold');
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

// ── Avatar (profile picture) ───────────────────────────────────────
function _renderSettingsAvatar(){
  const wrap = document.getElementById('set-avatar-wrap');
  if(!wrap) return;
  const av = A.user;
  if(av?.avatar_url){
    wrap.innerHTML = `
      <div class="set-av-photo" style="position:relative;display:inline-block">
        <img src="${esc(av.avatar_url)}" alt="${esc(av.username)}"
             style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid var(--accent)">
        <button class="set-av-del" onclick="deleteAvatar()" title="${t('settings.remove_photo')}">×</button>
      </div>`;
  } else {
    wrap.innerHTML = `
      <div class="sb-av" style="width:72px;height:72px;font-size:26px;background:${av?.avatar_color||'#5B8EF0'};border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700">
        ${initials(av?.username)}
      </div>`;
  }
}

async function uploadAvatar(input){
  const file = input.files[0]; if(!file) return;
  const fd = new FormData(); fd.append('avatar', file);
  try {
    toast(t('toast.uploading'));
    const res = await fetch('api/auth/avatar', { method:'POST', headers:{'Authorization':'Bearer '+A.token}, body:fd });
    if(!res.ok){ const e=await res.json(); throw new Error(e.error||'Fel'); }
    const data = await res.json();
    A.user.avatar_url = data.url;
    updateSidebar();
    _renderSettingsAvatar();
    toast('✅ Profilbild uppdaterad!');
  } catch(e){ toast(e.message,'err'); }
  input.value = '';
}

async function deleteAvatar(){
  if(!confirm('Ta bort profilbilden?')) return;
  try {
    await api('DELETE','auth/avatar');
    A.user.avatar_url = null;
    updateSidebar();
    _renderSettingsAvatar();
    toast('🗑️ Profilbild borttagen');
  } catch(e){ toast(e.message,'err'); }
}

// ── Language switcher ──────────────────────────────────────────────
function changeLang(lang){
  if(typeof setLang === 'function') setLang(lang);
  // Re-render settings to refresh translated labels
  renderSettings();
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
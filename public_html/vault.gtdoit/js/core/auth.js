// ── Auth ────────────────────────────────────────────────────────────

function switchTab(t){
  ['login','reg','join','forgot'].forEach(x => {
    const tab = document.getElementById('t-'+x);
    const form = document.getElementById('f-'+x);
    if(tab){
      tab.classList.toggle('on', x===t);
      tab.setAttribute('aria-selected', String(x===t));
    }
    if(form) form.classList.toggle('on', x===t);
  });
  const m = document.getElementById('auth-msg');
  if(m){ m.className='auth-msg'; m.textContent=''; }

  // Auto-focus first field in the active form
  setTimeout(() => {
    const activeForm = document.getElementById('f-'+t);
    if(activeForm){
      const firstInput = activeForm.querySelector('input');
      if(firstInput) firstInput.focus();
    }
  }, 50);
}

function authMsg(msg, type='err'){
  const m = document.getElementById('auth-msg');
  if(!m) return;
  m.textContent = msg;
  m.className = 'auth-msg on ' + type;
}

function setLoading(btnEl, loading){
  if(!btnEl) return;
  btnEl.classList.toggle('loading', loading);
  btnEl.disabled = loading;
}

async function doLogin(){
  const btn = document.querySelector('#f-login .btn-p');
  setLoading(btn, true);
  try {
    const email = document.getElementById('l-email').value.trim();
    const password = document.getElementById('l-pw').value;
    if(!email || !password){ authMsg('Fyll i e-post och lösenord'); return; }
    const d = await api('POST','auth/login',{email, password});
    A.token = d.token;
    localStorage.setItem('vault_t', d.token);
    A.user = d.user;
    startApp();
  } catch(e){
    authMsg(e.message);
  } finally {
    setLoading(btn, false);
  }
}

async function doRegister(){
  const btn = document.querySelector('#f-reg .btn-p');
  setLoading(btn, true);
  try {
    const username = document.getElementById('r-name').value.trim();
    const email = document.getElementById('r-email').value.trim();
    const password = document.getElementById('r-pw').value;
    if(!username){ authMsg('Ange ditt namn'); return; }
    if(!email){ authMsg('Ange din e-postadress'); return; }
    if(password.length < 6){ authMsg('Lösenordet måste vara minst 6 tecken'); return; }
    const d = await api('POST','auth/register',{username, email, password});
    A.token = d.token;
    localStorage.setItem('vault_t', d.token);
    A.user = d.user;
    startApp();
  } catch(e){
    authMsg(e.message);
  } finally {
    setLoading(btn, false);
  }
}

async function doJoin(){
  const code = document.getElementById('j-code').value.trim().toUpperCase();
  if(!code){ authMsg('Inbjudningskod krävs'); return; }
  const btn = document.querySelector('#f-join .btn-p');
  setLoading(btn, true);
  try {
    const username = document.getElementById('j-name').value.trim();
    const email = document.getElementById('j-email').value.trim();
    const password = document.getElementById('j-pw').value;
    if(!username){ authMsg('Ange ditt namn'); return; }
    if(!email){ authMsg('Ange din e-postadress'); return; }
    if(password.length < 6){ authMsg('Lösenordet måste vara minst 6 tecken'); return; }
    const d = await api('POST','auth/register',{username, email, password});
    A.token = d.token;
    localStorage.setItem('vault_t', d.token);
    A.user = d.user;
    await api('POST','family/join',{invite_code:code});
    A.user = await api('GET','auth/me');
    startApp();
  } catch(e){
    authMsg(e.message);
  } finally {
    setLoading(btn, false);
  }
}

async function doForgot(){
  const btn = document.querySelector('#f-forgot .btn-p');
  setLoading(btn, true);
  try {
    const email = document.getElementById('fg-email').value.trim();
    if(!email){ authMsg('Ange din e-postadress'); return; }
    await api('POST','auth/forgot',{email});
    authMsg('Om e-posten finns skickar vi en återställningslänk!','ok');
  } catch(e){
    authMsg(e.message);
  } finally {
    setLoading(btn, false);
  }
}

function logout(){
  A.token = null;
  localStorage.removeItem('vault_t');
  const app = document.getElementById('app');
  const auth = document.getElementById('auth');
  if(app){ app.style.display='none'; app.classList.remove('on'); }
  if(auth) auth.style.display = 'flex';
  closeModal('m-user');
  // Reset state
  Object.assign(A, {user:null, families:[], activeFamilyId:null, items:[], cats:[], tasks:[], svcs:[], members:[], receipts:[], ecoBudgetCats:[], ecoTrans:[], ecoSummary:null});
}

function showResetForm(token){
  const box = document.querySelector('.auth-box');
  if(!box) return;
  box.innerHTML = `
    <div class="auth-logo">
      <div class="auth-logo-mark" aria-hidden="true">🔐</div>
      <h1>Vault</h1>
      <p>Återställ lösenord</p>
    </div>
    <div id="auth-msg" class="auth-msg" role="alert" aria-live="polite"></div>
    <div style="display:flex;flex-direction:column;gap:12px">
      <input class="fi" id="rp-pw" type="password" placeholder="Nytt lösenord (min 6 tecken)" autocomplete="new-password">
      <input class="fi" id="rp-pw2" type="password" placeholder="Bekräfta nytt lösenord" autocomplete="new-password">
      <button class="btn btn-p" style="width:100%;justify-content:center" onclick="doReset('${token}')">Spara nytt lösenord →</button>
    </div>`;
}

async function doReset(token){
  const pw = document.getElementById('rp-pw').value;
  const pw2 = document.getElementById('rp-pw2').value;
  const m = document.getElementById('auth-msg');
  if(pw.length < 6){ m.className='auth-msg on err'; m.textContent='Minst 6 tecken krävs'; return; }
  if(pw !== pw2){ m.className='auth-msg on err'; m.textContent='Lösenorden matchar inte'; return; }
  try {
    await api('POST','auth/reset',{token, password:pw});
    m.className = 'auth-msg on ok';
    m.textContent = '✅ Lösenordet är sparat! Loggar in…';
    setTimeout(() => window.location.reload(), 1500);
  } catch(e){
    m.className = 'auth-msg on err';
    m.textContent = e.message;
  }
}

// ── Event listeners ─────────────────────────────────────────────────
// Enter key submits forms
document.addEventListener('DOMContentLoaded', () => {
  const enterMap = [
    ['l-pw', doLogin], ['l-email', doLogin],
    ['r-pw', doRegister],
    ['j-pw', doJoin], ['j-code', doJoin],
    ['fg-email', doForgot],
  ];
  enterMap.forEach(([id, fn]) => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('keydown', e => { if(e.key==='Enter') fn(); });
  });

  // Auto-uppercase invite code fields
  ['j-code','jf-code'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
  });

  // Focus email on load
  const emailInput = document.getElementById('l-email');
  if(emailInput && !document.getElementById('app')?.classList.contains('on')){
    setTimeout(() => emailInput.focus(), 100);
  }
});
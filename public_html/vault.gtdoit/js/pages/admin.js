// ── Admin ──────────────────────────────────────────────────────────
function renderAdmin(){
  if(A.user?.email !== ADMIN_EMAIL) return;
  document.getElementById('admin-stats').innerHTML=`
    <div class="stat"><div class="stat-top"><span class="stat-icon">📦</span></div><div class="stat-val">${A.items.length}</div><div class="stat-label">Saker</div></div>
    <div class="stat"><div class="stat-top"><span class="stat-icon">✅</span></div><div class="stat-val">${A.tasks.length}</div><div class="stat-label">Uppgifter</div></div>
    <div class="stat"><div class="stat-top"><span class="stat-icon">🔧</span></div><div class="stat-val">${A.svcs.length}</div><div class="stat-label">Service</div></div>
    <div class="stat"><div class="stat-top"><span class="stat-icon">👥</span></div><div class="stat-val">${A.members.length}</div><div class="stat-label">Medlemmar</div></div>`;
  document.getElementById('admin-users').innerHTML=`<thead><tr><th style="text-align:left;padding:6px 0;font-size:11px;color:var(--ink3)">Namn</th><th style="text-align:left;padding:6px 0;font-size:11px;color:var(--ink3)">E-post</th><th style="text-align:left;padding:6px 0;font-size:11px;color:var(--ink3)">Roll</th></tr></thead><tbody>${A.members.map(m=>`<tr><td style="padding:6px 0"><strong>${esc(m.username)}</strong></td><td style="padding:6px 0;color:var(--ink2);font-size:12px">${esc(m.email)}</td><td style="padding:6px 0"><span class="${m.family_role==='owner'?'badge b-amber':'badge b-blue'}">${m.family_role==='owner'?'👑':'Medlem'}</span></td></tr>`).join('')}</tbody>`;
  document.getElementById('admin-items').innerHTML=`<thead><tr><th style="text-align:left;padding:6px 0;font-size:11px;color:var(--ink3)">Sak</th><th style="text-align:left;padding:6px 0;font-size:11px;color:var(--ink3)">Kategori</th><th style="text-align:left;padding:6px 0;font-size:11px;color:var(--ink3)">Plats</th></tr></thead><tbody>${A.items.slice(0,10).map(i=>`<tr><td style="padding:6px 0"><strong>${esc(i.name)}</strong></td><td style="padding:6px 0">${cIcon(i.category)} ${esc(i.category)}</td><td style="padding:6px 0;color:var(--ink2)">${esc(i.location||'–')}</td></tr>`).join('')}</tbody>`;
}

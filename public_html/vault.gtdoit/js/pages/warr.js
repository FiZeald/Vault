// ── Warranties ─────────────────────────────────────────────────────
function renderWarr(){
  const items=A.items.filter(i=>i.warranty&&i.warranty!=='0000-00-00').sort((a,b)=>new Date(a.warranty)-new Date(b.warranty));
  const wc={ok:'b-green',soon:'b-amber',expired:'b-rose'}, wl={ok:'Giltig',soon:'Snart ut',expired:'Utgången'};
  document.getElementById('warr-list').innerHTML = items.length===0
    ? `<div class="empty"><div class="empty-icon">🛡️</div><h3>Inga garantier</h3><p>Lägg till garantidatum på dina saker</p></div>`
    : items.map(i=>{ const ws=wSt(i.warranty);
      return `<div class="warr-row" onclick="showDetail(${i.id})">
        <span style="font-size:22px">${cIcon(i.category)}</span>
        <div style="flex:1;min-width:0"><strong style="font-size:13px">${esc(i.name)}</strong><div style="font-size:11px;color:var(--ink3)">${esc(i.category)} · ${esc(i.location||'')}</div></div>
        <div style="font-size:12px;color:var(--ink3);margin-right:10px">${fmtDate(i.warranty)}</div>
        ${ws?`<span class="badge ${wc[ws]}">${wl[ws]}</span>`:''}
      </div>`;
    }).join('');
}

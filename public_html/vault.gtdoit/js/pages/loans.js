// ── Loans (lent-out tracking) ──────────────────────────────────────
// Used inside the item detail modal (injected by inv.js).
// Also exposes a standalone active-loans list for the dashboard.

let _loanItemId = null;

async function loadLoans(itemId) {
  try {
    const data = await api('GET', 'items/' + itemId + '/loans');
    return data || [];
  } catch { return []; }
}

function renderLoansSection(itemId, loans) {
  _loanItemId = itemId;
  const active   = loans.filter(l => !l.returned_at);
  const returned = loans.filter(l =>  l.returned_at);
  let html = `<div class="loan-section">
    <div class="loan-hd">
      <span>📤 Utlånat</span>
      <button class="btn btn-s btn-sm" onclick="openLoanModal(${itemId})">+ Registrera lån</button>
    </div>`;
  if (!loans.length) {
    html += `<div style="font-size:12px;color:var(--ink3);padding:6px 0">Inga lån registrerade</div>`;
  } else {
    if (active.length) {
      html += active.map(l => `
        <div class="loan-row loan-active">
          <div class="loan-to">👤 ${esc(l.loaned_to)}</div>
          <div class="loan-meta">${esc(l.loan_date)}${l.return_date ? ' · åter ' + esc(l.return_date) : ''}</div>
          <button class="btn btn-g btn-xs" onclick="returnLoan(${l.id}, ${itemId})">↩ Återlämnad</button>
        </div>`).join('');
    }
    if (returned.length) {
      html += `<details style="margin-top:6px"><summary style="font-size:11px;color:var(--ink3);cursor:pointer">Tidigare lån (${returned.length})</summary>`;
      html += returned.map(l => `
        <div class="loan-row loan-done">
          <div class="loan-to">✓ ${esc(l.loaned_to)}</div>
          <div class="loan-meta">${esc(l.loan_date)} → ${l.returned_at ? l.returned_at.slice(0,10) : '?'}</div>
        </div>`).join('');
      html += `</details>`;
    }
  }
  html += `</div>`;
  return html;
}

function openLoanModal(itemId) {
  _loanItemId = itemId;
  document.getElementById('ln-to').value          = '';
  document.getElementById('ln-date').value         = new Date().toISOString().slice(0,10);
  document.getElementById('ln-return-date').value  = '';
  document.getElementById('ln-notes').value        = '';
  document.getElementById('m-loan').classList.add('on');
}

async function saveLoan() {
  const to = document.getElementById('ln-to').value.trim();
  if (!to) { toast('⚠️ Låntagare krävs', 'err'); return; }
  try {
    await api('POST', 'items/' + _loanItemId + '/loans', {
      loaned_to:   to,
      loan_date:   document.getElementById('ln-date').value,
      return_date: document.getElementById('ln-return-date').value || null,
      notes:       document.getElementById('ln-notes').value.trim(),
    });
    // Update local item status
    const item = A.items.find(i => i.id == _loanItemId);
    if (item) item.status = 'lent';
    toast('📤 Lån registrerat!');
    closeModal('m-loan');
    // Refresh detail if open
    if (typeof refreshItemDetail === 'function') refreshItemDetail(_loanItemId);
  } catch(e) { toast(e.message, 'err'); }
}

async function returnLoan(loanId, itemId) {
  try {
    await api('POST', 'loans/' + loanId + '/return');
    // Refresh item status from server
    const updated = await api('GET', 'items/' + itemId);
    const item = A.items.find(i => i.id == itemId);
    if (item && updated) item.status = updated.status;
    toast('✅ Återlämnad!');
    if (typeof refreshItemDetail === 'function') refreshItemDetail(itemId);
  } catch(e) { toast(e.message, 'err'); }
}

// ── Active loans list (for dashboard widget) ───────────────────────
async function loadActiveLoans() {
  try {
    return await api('GET', 'loans/active') || [];
  } catch { return []; }
}

// ── Receipts (Kvitton med garanti) ────────────────────────────────

function renderReceipts() {
  const list = document.getElementById('receipts-list');
  if (!A.receipts.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">🧾</div><h3>Inga kvitton</h3><p>Ladda upp kvitton på delar och produkter</p><button class="btn btn-p" onclick="openReceipt()">+ Ladda upp kvitto</button></div>`;
    return;
  }

  // Group: with warranty vs without
  const withWarr = A.receipts.filter(r => r.warranty_months && r.warranty_months > 0);
  const noWarr   = A.receipts.filter(r => !r.warranty_months || r.warranty_months === 0);

  let html = '';

  if (withWarr.length) {
    html += `<div class="rec-group-hd">🛡️ Med garanti</div>`;
    html += withWarr.map(r => receiptRow(r)).join('');
  }
  if (noWarr.length) {
    if (withWarr.length) html += `<div class="rec-group-hd" style="margin-top:18px">🧾 Utan garanti</div>`;
    html += noWarr.map(r => receiptRow(r)).join('');
  }

  list.innerHTML = html;
}

function receiptRow(r) {
  // Compute warranty status
  let warrBadge = '';
  if (r.warranty_months && r.warranty_months > 0 && r.receipt_date && r.receipt_date !== '0000-00-00') {
    const expDate = new Date(r.receipt_date + 'T00:00:00');
    expDate.setMonth(expDate.getMonth() + parseInt(r.warranty_months));
    const daysLeft = Math.round((expDate - new Date()) / 86400000);
    if (daysLeft < 0)       warrBadge = `<span class="badge b-rose">Utgången</span>`;
    else if (daysLeft < 90) warrBadge = `<span class="badge b-amber">🛡️ ${daysLeft}d kvar</span>`;
    else                     warrBadge = `<span class="badge b-green">🛡️ ${Math.round(daysLeft/30)}mån kvar</span>`;
  }
  // Linked transaction count
  const linkedTrans = (A.ecoTrans||[]).filter(t=>t.receipt_id==r.id).length;
  const transBadge = linkedTrans > 0
    ? `<span class="badge b-blue" title="${linkedTrans} transaktion(er) kopplade">💰 ${linkedTrans}tr</span>` : '';

  return `<div class="rec-row" onclick="viewReceipt(${r.id})">
    <div class="rec-thumb">${r.photo ? `<img src="${esc(r.photo)}">` : '🧾'}</div>
    <div class="rec-info">
      <div class="rec-title">${esc(r.title)}</div>
      <div class="rec-meta">${r.item_name ? '🔗 ' + esc(r.item_name) + ' · ' : ''}${r.store ? esc(r.store) + ' · ' : ''}${fmtDate(r.receipt_date)}</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
      ${r.amount ? `<div class="rec-amount">${fmtMoney(r.amount)}</div>` : ''}
      ${warrBadge}
      ${transBadge}
    </div>
    <div style="display:flex;gap:4px;margin-left:8px">
      <button class="btn btn-g btn-icon btn-sm" onclick="event.stopPropagation();editReceipt(${r.id})">✏️</button>
      <button class="btn btn-g btn-icon btn-sm" onclick="event.stopPropagation();delReceipt(${r.id})">🗑️</button>
    </div>
  </div>`;
}

function openReceipt() {
  A.photo = null;
  ['ri-title','ri-store','ri-notes','ri-amount','ri-date'].forEach(x => document.getElementById(x).value = '');
  document.getElementById('ri-item').value = '';
  document.getElementById('ri-id').value = '';
  document.getElementById('ri-warr-toggle').checked = false;
  document.getElementById('ri-warr-months').value = '12';
  document.getElementById('ri-warr-section').style.display = 'none';
  document.getElementById('ri-ph-prev').innerHTML = '📷 <span style="font-size:12px">Klicka eller ta foto med kameran</span>';
  fillItemSel('ri-item');
  document.getElementById('m-receipt-title').textContent = 'Ladda upp kvitto';
  document.getElementById('m-receipt').classList.add('on');
}

function openReceiptFor(itemId) { openReceipt(); document.getElementById('ri-item').value = itemId; }

function editReceipt(id) {
  const r = A.receipts.find(x => x.id == id); if (!r) return;
  A.photo = r.photo || null;
  document.getElementById('ri-title').value = r.title;
  document.getElementById('ri-store').value = r.store || '';
  document.getElementById('ri-amount').value = r.amount || '';
  document.getElementById('ri-date').value = r.receipt_date && r.receipt_date !== '0000-00-00' ? r.receipt_date : '';
  document.getElementById('ri-notes').value = r.notes || '';
  document.getElementById('ri-id').value = id;

  const hasWarr = r.warranty_months && r.warranty_months > 0;
  document.getElementById('ri-warr-toggle').checked = hasWarr;
  document.getElementById('ri-warr-months').value = r.warranty_months || '12';
  document.getElementById('ri-warr-section').style.display = hasWarr ? '' : 'none';

  document.getElementById('ri-ph-prev').innerHTML = r.photo ? `<img src="${esc(r.photo)}" class="phprev">` : '📷 <span>Klicka för att byta bild</span>';
  fillItemSel('ri-item'); document.getElementById('ri-item').value = r.item_id || '';
  document.getElementById('m-receipt-title').textContent = 'Redigera kvitto';
  document.getElementById('m-receipt').classList.add('on');
}

function toggleWarrSection(cb) {
  document.getElementById('ri-warr-section').style.display = cb.checked ? '' : 'none';
}

async function uploadReceiptPhoto(input) { await uploadFile(input.files[0], 'ri-ph-prev', 'ri-uploading'); }

async function saveReceipt() {
  const title = document.getElementById('ri-title').value.trim();
  if (!title) { toast('⚠️ Titel krävs', 'err'); return; }
  const eid = document.getElementById('ri-id').value;
  const hasWarr = document.getElementById('ri-warr-toggle').checked;
  const warrMonths = hasWarr ? (parseInt(document.getElementById('ri-warr-months').value) || 12) : 0;

  const body = {
    title,
    item_id: parseInt(document.getElementById('ri-item').value) || null,
    amount: parseFloat(document.getElementById('ri-amount').value) || null,
    store: document.getElementById('ri-store').value,
    receipt_date: document.getElementById('ri-date').value || null,
    notes: document.getElementById('ri-notes').value,
    photo: A.photo || '',
    warranty_months: warrMonths
  };
  try {
    if (eid) {
      const u = await api('PUT', 'receipts/' + eid, body);
      A.receipts = A.receipts.map(r => r.id == eid ? u : r);
      toast('✅ Kvitto uppdaterat!');
    } else {
      const c = await api('POST', 'receipts', body);
      A.receipts.unshift(c);
      toast('🧾 Kvitto sparat!');
    }
    closeModal('m-receipt'); render(A.page);
  } catch(e) { toast(e.message, 'err'); }
}

function viewReceipt(id) {
  const r = A.receipts.find(x => x.id == id); if (!r) return;
  document.getElementById('rv-title').textContent = r.title;
  document.getElementById('rv-store').textContent = r.store || '–';
  document.getElementById('rv-date').textContent = fmtDate(r.receipt_date);
  document.getElementById('rv-amount').textContent = r.amount ? fmtMoney(r.amount) : '–';
  document.getElementById('rv-item').textContent = r.item_name || '–';
  document.getElementById('rv-notes').textContent = r.notes || '';

  // Warranty badge
  const warrEl = document.getElementById('rv-warr');
  if (r.warranty_months && r.warranty_months > 0) {
    let warrTxt = `${r.warranty_months} månader`;
    if (r.receipt_date && r.receipt_date !== '0000-00-00') {
      const expDate = new Date(r.receipt_date + 'T00:00:00');
      expDate.setMonth(expDate.getMonth() + parseInt(r.warranty_months));
      const daysLeft = Math.round((expDate - new Date()) / 86400000);
      const expFmt = expDate.toLocaleDateString('sv-SE', {year:'numeric',month:'short',day:'numeric'});
      if (daysLeft < 0) warrTxt += ` · <span class="badge b-rose">Utgången ${expFmt}</span>`;
      else if (daysLeft < 90) warrTxt += ` · <span class="badge b-amber">Utgår ${expFmt} (${daysLeft}d)</span>`;
      else warrTxt += ` · <span class="badge b-green">Giltig t.o.m. ${expFmt}</span>`;
    }
    warrEl.innerHTML = `<div style="display:flex;align-items:center;gap:8px">🛡️ ${warrTxt}</div>`;
    warrEl.style.display = '';
  } else {
    warrEl.style.display = 'none';
  }

  // Linked transactions
  const linked = (A.ecoTrans||[]).filter(t=>t.receipt_id==id);
  const notesEl = document.getElementById('rv-notes');
  let linkedHtml = '';
  if (linked.length) {
    linkedHtml = `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--ink3);margin-bottom:8px">💰 Kopplade transaktioner</div>
      ${linked.map(t=>`<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;padding:4px 0;border-bottom:1px solid var(--border)">
        <span>${esc(t.description)} · <span style="color:var(--ink3)">${fmtDate(t.trans_date)}</span></span>
        <span class="trans-amount ${t.type}" style="font-size:13px">${t.type==='income'?'+':'−'}${fmtMoney(t.amount)}</span>
      </div>`).join('')}
    </div>`;
  }
  if (notesEl) notesEl.innerHTML = (r.notes ? `<p style="margin-bottom:0">${esc(r.notes)}</p>` : '') + linkedHtml;

  document.getElementById('rv-img').innerHTML = r.photo
    ? `<img src="${esc(r.photo)}" style="max-width:100%;max-height:400px;border-radius:var(--r)">`
    : `<div style="padding:40px;color:var(--ink3);font-size:13px">Inget foto</div>`;

  document.getElementById('rv-edit').onclick = () => { closeModal('m-receipt-view'); editReceipt(id); };

  // Wire up create-transaction button with receipt pre-fill
  const ctBtn = document.getElementById('rv-create-trans');
  if (ctBtn) ctBtn.onclick = () => {
    closeModal('m-receipt-view');
    openTransModal(id);
    go('eco');
  };

  document.getElementById('m-receipt-view').classList.add('on');
}

async function delReceipt(id) {
  if (!confirm('Ta bort kvittot?')) return;
  await api('DELETE', 'receipts/' + id);
  A.receipts = A.receipts.filter(r => r.id != id);
  toast('🗑️ Borttaget'); render(A.page);
}
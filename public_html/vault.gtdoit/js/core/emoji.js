// ── Global Emoji Picker ─────────────────────────────────────────────
// tab:      icon shown in the category tab button
// keywords: Swedish search terms (space-separated) for filtering
// emojis:   string of emojis in this category
const EMOJI_CATS = [
  { tab:'😀', keywords:'känslor glad ledsen skratt ansikte hjärta kärlek', emojis:'😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗😚😙😋😛😜🤪😝🤑🤗🤔🤐😐😑😶😏😒🙄😬🤥😌😔😪😷🤒🤕🤢🤧🥵🥶😵🤯🤠🥳😎🤓😕😟☹️😮😯😲😳🥺😦😧😨😢😭😱😖😣😞😩😫😤😡😠💀☠️💩🤡👿👻👾🤖❤️🧡💛💚💙💜🖤🤍💔❣️💕💞💓💗💖💘💝' },
  { tab:'🏠', keywords:'hem hus boende familj sovrum kök möbler städning',  emojis:'🏠🏡🏘🏗🏢🏣🏤🏥🏦🏨🏩🏪🏫🏬🏭🏯🏰🗼🏛🏟🏞🏝🏜🏔⛰🌋🗻🏕🛖🛏🛋🚪🪑🪞🪟🛁🚿🧹🧺🧻🪣🧼🫧🧽🪒🪥🪴🪵🧰🔑🗝🔐🔏🔒🔓🏆🥇🏅🎖🎗🧸🎎🎍🎄🎃🎆🎇🎉🎊🎈🎀🎁' },
  { tab:'🍕', keywords:'mat dryck äta lunch middag frukost kaffe restaurang livsmedel',  emojis:'🍎🍊🍋🍇🍓🍒🍑🥭🍍🥥🥝🍅🫐🍆🥑🥦🥬🥒🌽🌶🧄🧅🥔🍠🍞🥐🥖🧀🥚🍳🥞🧇🥓🥩🍗🍖🌭🍔🍟🍕🌮🌯🧆🥗🍲🍝🍜🍛🍣🍤🍙🍚🍘🥟🥡🍦🍧🍨🍩🍪🎂🍰🧁🍫🍬🍭🧃🥤🧋☕🍵🫖🍶🍾🍷🍸🍹🍺🧊🥛🍼' },
  { tab:'💼', keywords:'jobb arbete pengar ekonomi kontor affär budget',  emojis:'💰💵💴💶💷💸💳🪙💹📈📉📊💼🗂📁📂🗃🗄🗑📋📌📍📎🖇📏📐✂️🖊🖋✒️🖌🖍📝✏️🔍🔎🔬🔭📡💡🔦🕯🏆🥇🥈🥉🎖🏅🎗🎫🎟🎪🎭🎨🖼🎬🎤🎧🎼🎹🎸🎺🎻🥁🪘🎮🕹🎲♟🃏🎰' },
  { tab:'🚗', keywords:'transport bil resa flyg tåg buss cykel båt',  emojis:'🚗🚕🚙🚌🚎🏎🚓🚑🚒🚐🛻🚚🚛🚜🏍🛵🛺🚲🛴🛹🛼🚏🛣🚦🚥🛑🚧⚓🛟⛵🚤🛥🛳🚢✈️🛩🛫🛬🪂💺🚁🚂🚄🚅🚆🚇🚈🚉🚊🚝🚞🚋🛰🚀🛸🌍🌎🌏🗺🧭' },
  { tab:'💪', keywords:'hälsa sport träning gym apotek sjukvård fotboll basket tennis',  emojis:'💪🦾🦵🦶👁🧠🦷🦴💉🩸💊🩹🩺🩻🏋️🤼🤸⛹️🤺🧘🏄🚴🏊🤽🧗🏌️🎯🎳🏏🏑🏒🥍🏓🏸🥊🥋⛳🎣🤿🎿🛷⚽🏀🏈⚾🥎🏐🏉🥏🎾🏒🥌🏆🥇🎖🎽' },
  { tab:'🌿', keywords:'natur djur växt skog hav blommor hundar katter fåglar',  emojis:'🐶🐱🐭🐹🐰🦊🐻🐼🐨🐯🦁🐮🐷🐸🐵🙈🙉🙊🐔🐧🐦🐤🦆🦅🦉🦇🐺🐗🐴🦄🐝🐛🦋🐌🐞🐜🐢🐍🦎🐙🦑🦐🦀🐡🐠🐟🐬🐳🐋🦈🐊🦭🐘🦛🦏🦒🦓🦘🐃🦌🐕🐩🐈🐓🦃🕊🐇🦝🦨🦡🦦🦥🐁🐀🌱🌿🍀🍁🍂🍃🌾🌷🌹🌺🌸🌼🌻🌞🌝🌛🌚🌕⭐🌟✨💫⚡🌈☁️⛅🌤🌥🌦🌧⛈🌩🌨❄️☃️⛄💨🌊🌪🌄🌅🌆🌇🌃🌉🌌🌠' },
  { tab:'📦', keywords:'objekt teknik dator mobil kamera verktyg',  emojis:'📱💻🖥🖨⌨️🖱🖲💾💿📀📷📸📹🎥📽🎞📞☎️📟📠📺📻🧭⏱⏲⌚⏰🔋🔌💡🔦🕯🧯🛢🪜🧲🔧🔨⚒🛠⛏🪚🔩⚙️🗜🔗⛓🗡⚔️🛡🔭🔬🩺💉🩸💊🧬🦠🧪🧴🧷🧹🧺🧻🪣🧼🪥🪒📦📬📮📦📧💌📨📩📤📥📚📖📰🗞📓📔📒📕📗📘📙📃📄📑📊📈📉🗒🗓📅📆📇🗃🗂🗄' },
  { tab:'⭐', keywords:'symboler stjärna hjärta pil checkmark varning flagga',  emojis:'⭐🌟✨💫⚡🔥💥🌊🌈☀️🌙❄️🌸🌺🍀🎯🔑🏆💎🎵🎶✅❌❎🚫⛔🔞🆗🆘🆙🆚🆒🆓🆕🔝🔛🔜🔚🔙⬆️⬇️⬅️➡️↩️↪️↕️↔️🔃🔄🔀🔁🔂▶️⏩⏭⏯◀️⏪⏮⏫⏬⏸⏹⏺🎦📶📳📴📵📳🔈🔉🔊🔔🔕🔕🚀💯❓❗‼️⁉️🔅🔆📲💬🗨🗯💭🔴🟠🟡🟢🔵🟣⚫⚪🟤🔺🔻🔷🔶🔹🔸' },
];

// Segment a string into individual grapheme clusters (emoji-safe)
function _epSegment(str){
  if(typeof Intl?.Segmenter === 'function'){
    return [...new Intl.Segmenter().segment(str)].map(s => s.segment);
  }
  // Fallback: iterate by Unicode code points (handles basic emoji)
  return [...str];
}

let _epTarget = null; // { inputId, btnId }

function _buildPicker(){
  const el = document.createElement('div');
  el.id = 'ep-global';
  el.style.cssText = 'display:none;position:fixed;z-index:9999;background:var(--surface);border:1px solid var(--border);border-radius:var(--r2);box-shadow:0 8px 32px rgba(0,0,0,.3);width:300px;max-height:350px;overflow:hidden;flex-direction:column;font-family:var(--font)';

  el.innerHTML = `
    <div style="padding:8px;border-bottom:1px solid var(--border);flex-shrink:0">
      <input type="text" id="ep-search" class="fi" placeholder="🔍 Sök kategori…" style="margin:0;font-size:13px" oninput="_epSearch(this.value)" autocomplete="off">
    </div>
    <div id="ep-tabs" style="display:flex;overflow-x:auto;border-bottom:1px solid var(--border);flex-shrink:0;scrollbar-width:none;-webkit-overflow-scrolling:touch"></div>
    <div id="ep-grid" style="padding:6px;overflow-y:auto;flex:1;display:flex;flex-wrap:wrap;gap:0"></div>
  `;

  document.body.appendChild(el);

  // Render tabs using explicit .tab icon (not .emojis[0] which breaks on surrogates)
  const tabsEl = el.querySelector('#ep-tabs');
  EMOJI_CATS.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.textContent = c.tab;
    btn.title = c.label || c.keywords.split(' ')[0];
    btn.style.cssText = 'flex-shrink:0;padding:6px 10px;font-size:18px;border:none;background:none;cursor:pointer;opacity:.5;border-bottom:2px solid transparent;transition:opacity .12s,border-color .12s;line-height:1';
    btn.onmouseenter = () => { if(!btn.dataset.active) btn.style.opacity = '.85'; };
    btn.onmouseleave = () => { if(!btn.dataset.active) btn.style.opacity = '.5'; };
    btn.onclick = () => _epTab(i);
    btn.dataset.tabIdx = i;
    tabsEl.appendChild(btn);
  });

  // Close on outside click
  document.addEventListener('mousedown', e => {
    const ep = document.getElementById('ep-global');
    if(ep && ep.style.display !== 'none' && !ep.contains(e.target)){
      const triggerBtn = _epTarget?.btnId ? document.getElementById(_epTarget.btnId) : null;
      if(!triggerBtn || !triggerBtn.contains(e.target)) closeEmojiPicker();
    }
  }, true);

  return el;
}

function _epGetOrCreate(){
  return document.getElementById('ep-global') || _buildPicker();
}

let _epCurCat = 0;

function _epTab(i){
  _epCurCat = i;
  const tabs = document.querySelectorAll('#ep-global #ep-tabs button');
  tabs.forEach((btn, idx) => {
    const active = idx === i;
    btn.style.opacity = active ? '1' : '.5';
    btn.style.borderBottomColor = active ? 'var(--accent)' : 'transparent';
    btn.style.background = active ? 'var(--accent-bg)' : 'none';
    btn.dataset.active = active ? '1' : '';
  });
  const searchEl = document.getElementById('ep-search');
  if(searchEl) searchEl.value = '';
  _epRenderGrid(_epSegment(EMOJI_CATS[i].emojis));
}

function _epRenderGrid(emojis){
  const grid = document.getElementById('ep-grid'); if(!grid) return;
  grid.innerHTML = '';
  emojis.forEach(e => {
    const btn = document.createElement('button');
    btn.textContent = e;
    btn.title = e;
    btn.style.cssText = 'font-size:20px;padding:5px;border:none;background:none;cursor:pointer;border-radius:6px;line-height:1;transition:background .1s';
    btn.onmouseenter = () => btn.style.background = 'var(--surface2)';
    btn.onmouseleave = () => btn.style.background = 'none';
    btn.onclick = () => _epPick(e);
    grid.appendChild(btn);
  });
}

function _epSearch(q){
  // De-highlight all tabs
  document.querySelectorAll('#ep-global #ep-tabs button').forEach(b => {
    b.style.opacity = '.5';
    b.style.borderBottomColor = 'transparent';
    b.style.background = 'none';
    b.dataset.active = '';
  });

  if(!q){
    _epTab(_epCurCat);
    return;
  }

  const ql = q.toLowerCase().trim();

  // Find categories whose keywords contain the query
  const matches = EMOJI_CATS.filter(c => c.keywords.includes(ql));

  if(matches.length > 0){
    // Show emojis from all matching categories
    const emojis = matches.flatMap(c => _epSegment(c.emojis));
    _epRenderGrid(emojis);

    // Highlight matching tabs
    document.querySelectorAll('#ep-global #ep-tabs button').forEach((btn, idx) => {
      if(matches.includes(EMOJI_CATS[idx])){
        btn.style.opacity = '1';
        btn.style.borderBottomColor = 'var(--accent)';
        btn.style.background = 'var(--accent-bg)';
      }
    });
  } else {
    // No keyword match — show all emojis flat so user can scan
    const all = EMOJI_CATS.flatMap(c => _epSegment(c.emojis));
    _epRenderGrid(all);
  }
}

function _epPick(emoji){
  if(!_epTarget) return;
  const input = document.getElementById(_epTarget.inputId);
  const btn   = _epTarget.btnId ? document.getElementById(_epTarget.btnId) : null;
  if(input){ input.value = emoji; input.dispatchEvent(new Event('input')); }
  if(btn)  { btn.textContent = emoji; }
  closeEmojiPicker();
}

function openEmojiPicker(inputId, btnId){
  _epTarget = { inputId, btnId };
  const ep  = _epGetOrCreate();
  const anchor = btnId ? document.getElementById(btnId) : document.getElementById(inputId);
  if(!anchor) return;

  ep.style.display = 'flex';
  _epTab(0);

  // Position near the anchor element, staying within viewport
  const r   = anchor.getBoundingClientRect();
  const vpH = window.innerHeight, vpW = window.innerWidth;
  const pH  = 350, pW = 300;
  let top  = r.bottom + 6;
  let left = r.left;
  if(top + pH > vpH - 8)  top  = Math.max(8, r.top - pH - 6);
  if(left + pW > vpW - 8) left = Math.max(8, vpW - pW - 8);
  ep.style.top  = top  + 'px';
  ep.style.left = left + 'px';

  setTimeout(() => document.getElementById('ep-search')?.focus(), 60);
}

function closeEmojiPicker(){
  const ep = document.getElementById('ep-global');
  if(ep) ep.style.display = 'none';
  _epTarget = null;
}

// ── Backwards-compatible wrappers ────────────────────────────────────
function toggleEmojiPicker(){
  const ep = document.getElementById('ep-global');
  if(ep && ep.style.display !== 'none' && _epTarget?.inputId === 'ci-icon'){
    closeEmojiPicker(); return;
  }
  openEmojiPicker('ci-icon', 'ci-icon-btn');
}

function syncEmojiInput(val){
  const btn = document.getElementById('ci-icon-btn');
  if(btn && val) btn.textContent = val;
}

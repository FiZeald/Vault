// ── Vault i18n — internationalization ─────────────────────────────
// Usage: t('key') returns the translated string for the current language.
// setLang('en') switches language and re-renders the current page.

const TRANSLATIONS = {
  sv: {
    // Navigation
    'nav.dash':       'Dashboard',
    'nav.inv':        'Inventarie',
    'nav.cats':       'Kategorier',
    'nav.tasks':      'Uppgifter',
    'nav.svc':        'Service & underhåll',
    'nav.warr':       'Garantier',
    'nav.receipts':   'Kvitton',
    'nav.eco':        'Ekonomi',
    'nav.family':     'Familj',
    'nav.admin':      'Administration',
    'nav.settings':   'Inställningar',
    'nav.checklists': 'Listor',
    'nav.section.overview': 'Översikt',
    'nav.section.home':     'Hemmet',
    'nav.section.planning': 'Planering',
    'nav.section.economy':  'Ekonomi',
    'nav.section.other':    'Övrigt',

    // Add button labels
    'add.inv':      '+ Ny sak',
    'add.tasks':    '+ Ny uppgift',
    'add.svc':      '+ Ny påminnelse',
    'add.cats':     '+ Ny kategori',
    'add.receipts': '+ Nytt kvitto',

    // Common actions
    'action.save':   'Spara',
    'action.cancel': 'Avbryt',
    'action.delete': 'Ta bort',
    'action.edit':   'Redigera',
    'action.close':  'Stäng',
    'action.add':    'Lägg till',
    'action.back':   'Tillbaka',
    'action.done':   'Klar',
    'action.refresh':'Uppdatera',

    // Dashboard
    'dash.greeting.night':     'God natt',
    'dash.greeting.morning':   'God morgon',
    'dash.greeting.afternoon': 'God eftermiddag',
    'dash.greeting.evening':   'God kväll',
    'dash.qa.item':       'Ny sak',
    'dash.qa.task':       'Uppgift',
    'dash.qa.trans':      'Transaktion',
    'dash.qa.receipt':    'Kvitto',
    'dash.qa.service':    'Service',
    'dash.widget.tasks':    '📋 Uppgifter',
    'dash.widget.eco':      '💰 Ekonomi',
    'dash.widget.service':  '🔧 Kommande service',
    'dash.widget.items':    '📦 Senaste saker',
    'dash.widget.activity': '📜 Aktivitet',
    'dash.widget.value':    '📈 Inventarievärde',

    // Inventory
    'inv.title':      'Inventarie',
    'inv.search.ph':  'Sök namn, plats, tagg…',
    'inv.sort.newest':'Nyast',
    'inv.sort.oldest':'Äldst',
    'inv.sort.name':  'Namn A–Ö',
    'inv.sort.priceh':'Pris ↓',
    'inv.sort.pricel':'Pris ↑',
    'inv.empty':      'Inga saker',
    'inv.empty.sub':  'Börja bygga din inventarie',
    'inv.status.ok':       '✅ Fungerar',
    'inv.status.broken':   '🔴 Trasig',
    'inv.status.lent':     '📤 Utlånad',
    'inv.status.for_sale': '🏷️ Till salu',

    // Tasks
    'tasks.title':    'Uppgifter',
    'tasks.active':   'aktiva',
    'tasks.done':     'Inga avklarade ännu',
    'tasks.allclear': '🎉 Allt klart!',
    'tasks.priority.urgent': 'Akut',
    'tasks.priority.high':   'Hög',
    'tasks.priority.medium': 'Medel',
    'tasks.priority.low':    'Låg',

    // Economy
    'eco.balance':  'Nettosaldo',
    'eco.income':   '↑ Inkomst',
    'eco.expense':  '↓ Utgifter',

    // Settings
    'settings.title':   'Inställningar',
    'settings.sub':     'Anpassa Vault efter dina önskemål',
    'settings.account': 'Konto',
    'settings.appearance': 'Utseende',
    'settings.notifications': 'Påminnelser',
    'settings.email_notif': 'E-postpåminnelser',
    'settings.widgets': '📊 Dashboard-widgets',
    'settings.data':    'Data',
    'settings.language':'Språk / Language',

    'settings.dark_mode':     'Mörkt läge',
    'settings.dark_mode_sub': 'Växla mellan mörkt och ljust tema',
    'settings.dark_mode.sub': 'Växla mellan mörkt och ljust tema',
    'settings.compact':       'Kompaktläge',
    'settings.compact_sub':   'Tätare layout med mindre mellanrum',
    'settings.compact.sub':   'Tätare layout med mindre mellanrum',
    'settings.language_sub':  'Välj gränssnittsspråk',
    'settings.toggle_theme':  'Byt tema',
    'settings.edit':          '✏️ Redigera',
    'settings.upload_photo':  '📷 Byt bild',
    'settings.currency':     'Valuta',
    'settings.currency.sub': 'Valuta för ekonomimodulen',
    'settings.clear_cache':  'Rensa cache',
    'settings.clear_cache.sub':'Tar bort lokalt cachad data',
    'settings.theme_btn':    'Byt tema',
    'settings.profile_photo':'Profilbild',
    'settings.profile_photo.sub':'Ladda upp en profilbild',
    'settings.upload_photo': 'Ladda upp',
    'settings.remove_photo': 'Ta bort bild',
    'settings.family':       'Aktiv familj',
    'settings.password':     'Lösenord',
    'settings.password.sub': 'Byt ditt lösenord',
    'settings.change_pw':    'Byt →',
    'settings.manage_fam':   'Hantera →',
    'settings.svc_warn':      'Servicevarningar',
    'settings.svc_warn.sub':  'Visa varning vid kommande service',
    'settings.warr_warn':     'Garantivarningar',
    'settings.warr_warn.sub': 'Visa varning vid utgående garantier',
    'settings.svc_days':      'Varningsdagar service',
    'settings.svc_days.sub':  'Antal dagar i förväg för servicevarning',
    'settings.notif_email':   'Aktivera e-postpåminnelser',
    'settings.notif_email.sub':'Få e-post när service eller garanti är nära',
    'settings.notif_svc_days': 'Dagar före service',
    'settings.notif_svc_days.sub':'Skicka påminnelse X dagar före servicedatum',
    'settings.notif_warr_days': 'Dagar före garanti',
    'settings.notif_warr_days.sub':'Skicka påminnelse X dagar innan garantin utgår',
    'settings.save_notif':   'Spara e-postinställningar',
    'settings.inv_total':    'Visa totalt inventarievärde',

    // Modal titles
    'modal.item.new':    'Ny sak',
    'modal.item.edit':   'Redigera sak',
    'modal.task.new':    'Ny uppgift',
    'modal.task.edit':   'Redigera uppgift',
    'modal.loan':        '📤 Registrera lån',
    'modal.qr':          '🔲 QR-kod',
    'modal.checklist.new': 'Ny lista',

    // Family
    'family.title':      'Familj',
    'family.invite_code':'Inbjudningskod',
    'family.members':    'Medlemmar',

    // Loans
    'loan.loaned_to':   'Låntagare',
    'loan.loaned_to.ph':'T.ex. Erik Johansson',
    'loan.date':        'Lånedatum',
    'loan.return_date': 'Förväntat återlämnande',
    'loan.save':        'Spara lån',
    'loan.return_btn':  '↩ Återlämnad',

    // Item fields
    'item.name':        'Namn',
    'item.category':    'Kategori',
    'item.location':    'Plats',
    'item.location.ph': 'T.ex. Garaget, Köket',
    'item.purchased':   'Inköpsdatum',
    'item.price':       'Pris (kr)',
    'item.warranty':    'Garanti t.o.m.',
    'item.serial':      'Serienummer',
    'item.notes':       'Anteckningar',
    'item.tags':        'Taggar',
    'item.tags.hint':   'Separera med komma. Max 10 taggar.',
    'item.status':      'Status',
    'item.photo':       'Foto',

    // Task fields
    'task.title':    'Titel',
    'task.desc':     'Beskrivning',
    'task.priority': 'Prioritet',
    'task.category': 'Kategori',
    'task.due':      'Förfallodatum',
    'task.assign':   'Tilldela',
    'task.interval': 'Återkommande (dagar)',
    'task.interval.hint': '0 = engångsuppgift. Sätt t.ex. 7 för veckovis, 30 för månadsvis.',

    // Toasts / messages
    'toast.saved':   '✅ Sparat!',
    'toast.deleted': '🗑️ Borttagen',
    'toast.error':   'Fel',
    'toast.network': 'Nätverksfel – kontrollera din anslutning',
    'toast.uploading':'⏳ Laddar upp…',

    // Auth
    'auth.login':     'Logga in',
    'auth.register':  'Skapa konto',
    'auth.email':     'E-postadress',
    'auth.password':  'Lösenord',
    'auth.username':  'Namn',
    'auth.logout':    'Logga ut',
    'auth.forgot':    'Glömt lösenord?',
  },

  en: {
    // Navigation
    'nav.dash':       'Dashboard',
    'nav.inv':        'Inventory',
    'nav.cats':       'Categories',
    'nav.tasks':      'Tasks',
    'nav.svc':        'Service & maintenance',
    'nav.warr':       'Warranties',
    'nav.receipts':   'Receipts',
    'nav.eco':        'Economy',
    'nav.family':     'Family',
    'nav.admin':      'Administration',
    'nav.settings':   'Settings',
    'nav.checklists': 'Lists',
    'nav.section.overview': 'Overview',
    'nav.section.home':     'Home',
    'nav.section.planning': 'Planning',
    'nav.section.economy':  'Economy',
    'nav.section.other':    'Other',

    // Add button labels
    'add.inv':      '+ New item',
    'add.tasks':    '+ New task',
    'add.svc':      '+ New reminder',
    'add.cats':     '+ New category',
    'add.receipts': '+ New receipt',

    // Common actions
    'action.save':   'Save',
    'action.cancel': 'Cancel',
    'action.delete': 'Delete',
    'action.edit':   'Edit',
    'action.close':  'Close',
    'action.add':    'Add',
    'action.back':   'Back',
    'action.done':   'Done',
    'action.refresh':'Refresh',

    // Dashboard
    'dash.greeting.night':     'Good night',
    'dash.greeting.morning':   'Good morning',
    'dash.greeting.afternoon': 'Good afternoon',
    'dash.greeting.evening':   'Good evening',
    'dash.qa.item':    'New item',
    'dash.qa.task':    'Task',
    'dash.qa.trans':   'Transaction',
    'dash.qa.receipt': 'Receipt',
    'dash.qa.service': 'Service',
    'dash.widget.tasks':    '📋 Tasks',
    'dash.widget.eco':      '💰 Economy',
    'dash.widget.service':  '🔧 Upcoming service',
    'dash.widget.items':    '📦 Recent items',
    'dash.widget.activity': '📜 Activity',
    'dash.widget.value':    '📈 Inventory value',

    // Inventory
    'inv.title':      'Inventory',
    'inv.search.ph':  'Search name, location, tag…',
    'inv.sort.newest':'Newest',
    'inv.sort.oldest':'Oldest',
    'inv.sort.name':  'Name A–Z',
    'inv.sort.priceh':'Price ↓',
    'inv.sort.pricel':'Price ↑',
    'inv.empty':      'No items',
    'inv.empty.sub':  'Start building your inventory',
    'inv.status.ok':       '✅ Working',
    'inv.status.broken':   '🔴 Broken',
    'inv.status.lent':     '📤 Lent out',
    'inv.status.for_sale': '🏷️ For sale',

    // Tasks
    'tasks.title':   'Tasks',
    'tasks.active':  'active',
    'tasks.done':    'No completed tasks yet',
    'tasks.allclear':'🎉 All done!',
    'tasks.priority.urgent': 'Urgent',
    'tasks.priority.high':   'High',
    'tasks.priority.medium': 'Medium',
    'tasks.priority.low':    'Low',

    // Economy
    'eco.balance':  'Net balance',
    'eco.income':   '↑ Income',
    'eco.expense':  '↓ Expenses',

    // Settings
    'settings.title':    'Settings',
    'settings.sub':      'Customize Vault to your liking',
    'settings.account':  'Account',
    'settings.appearance':'Appearance',
    'settings.notifications':'Reminders',
    'settings.email_notif':'Email notifications',
    'settings.widgets':  '📊 Dashboard widgets',
    'settings.data':     'Data',
    'settings.language': 'Språk / Language',

    'settings.dark_mode':     'Dark mode',
    'settings.dark_mode_sub': 'Toggle between dark and light theme',
    'settings.dark_mode.sub': 'Toggle between dark and light theme',
    'settings.compact':       'Compact mode',
    'settings.compact_sub':   'Denser layout with less spacing',
    'settings.compact.sub':   'Denser layout with less spacing',
    'settings.language_sub':  'Choose interface language',
    'settings.toggle_theme':  'Switch theme',
    'settings.edit':          '✏️ Edit',
    'settings.upload_photo':  '📷 Change photo',
    'settings.currency':     'Currency',
    'settings.currency.sub': 'Currency for the economy module',
    'settings.clear_cache':  'Clear cache',
    'settings.clear_cache.sub':'Removes locally cached data',
    'settings.theme_btn':    'Switch theme',
    'settings.profile_photo':'Profile picture',
    'settings.profile_photo.sub':'Upload a profile picture',
    'settings.upload_photo': 'Upload',
    'settings.remove_photo': 'Remove picture',
    'settings.family':       'Active family',
    'settings.password':     'Password',
    'settings.password.sub': 'Change your password',
    'settings.change_pw':    'Change →',
    'settings.manage_fam':   'Manage →',
    'settings.svc_warn':      'Service warnings',
    'settings.svc_warn.sub':  'Show warning for upcoming service',
    'settings.warr_warn':     'Warranty warnings',
    'settings.warr_warn.sub': 'Show warning for expiring warranties',
    'settings.svc_days':      'Service warning days',
    'settings.svc_days.sub':  'Days in advance for service warning',
    'settings.notif_email':   'Enable email notifications',
    'settings.notif_email.sub':'Get email when service or warranty is near',
    'settings.notif_svc_days': 'Days before service',
    'settings.notif_svc_days.sub':'Send reminder X days before service date',
    'settings.notif_warr_days': 'Days before warranty',
    'settings.notif_warr_days.sub':'Send reminder X days before warranty expires',
    'settings.save_notif':   'Save notification settings',
    'settings.inv_total':    'Show total inventory value',

    // Modal titles
    'modal.item.new':    'New item',
    'modal.item.edit':   'Edit item',
    'modal.task.new':    'New task',
    'modal.task.edit':   'Edit task',
    'modal.loan':        '📤 Register loan',
    'modal.qr':          '🔲 QR code',
    'modal.checklist.new':'New list',

    // Family
    'family.title':      'Family',
    'family.invite_code':'Invite code',
    'family.members':    'Members',

    // Loans
    'loan.loaned_to':   'Borrower',
    'loan.loaned_to.ph':'E.g. John Smith',
    'loan.date':        'Loan date',
    'loan.return_date': 'Expected return date',
    'loan.save':        'Save loan',
    'loan.return_btn':  '↩ Returned',

    // Item fields
    'item.name':        'Name',
    'item.category':    'Category',
    'item.location':    'Location',
    'item.location.ph': 'E.g. Garage, Kitchen',
    'item.purchased':   'Purchase date',
    'item.price':       'Price',
    'item.warranty':    'Warranty until',
    'item.serial':      'Serial number',
    'item.notes':       'Notes',
    'item.tags':        'Tags',
    'item.tags.hint':   'Separate with commas. Max 10 tags.',
    'item.status':      'Status',
    'item.photo':       'Photo',

    // Task fields
    'task.title':    'Title',
    'task.desc':     'Description',
    'task.priority': 'Priority',
    'task.category': 'Category',
    'task.due':      'Due date',
    'task.assign':   'Assign to',
    'task.interval': 'Recurring (days)',
    'task.interval.hint':'0 = one-time. Set e.g. 7 for weekly, 30 for monthly.',

    // Toasts / messages
    'toast.saved':    '✅ Saved!',
    'toast.deleted':  '🗑️ Deleted',
    'toast.error':    'Error',
    'toast.network':  'Network error – check your connection',
    'toast.uploading':'⏳ Uploading…',

    // Auth
    'auth.login':    'Log in',
    'auth.register': 'Create account',
    'auth.email':    'Email address',
    'auth.password': 'Password',
    'auth.username': 'Name',
    'auth.logout':   'Log out',
    'auth.forgot':   'Forgot password?',
  }
};

// ── Core ──────────────────────────────────────────────────────────
let _lang = localStorage.getItem('vault_lang') || 'sv';

function t(key){ return TRANSLATIONS[_lang]?.[key] ?? TRANSLATIONS['sv']?.[key] ?? key; }

function setLang(lang){
  if(!TRANSLATIONS[lang]) return;
  _lang = lang;
  localStorage.setItem('vault_lang', lang);
  applyI18n();
  // Re-render current page if app is running
  if(typeof render === 'function' && A?.page) render(A.page);
  // Update page title map dynamically used by go()
  _syncPageTitles();
}

function getLang(){ return _lang; }

// ── DOM walker — applies data-i18n attributes ─────────────────────
function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if(val) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    const val = t(key);
    if(val) el.placeholder = val;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const val = t(key);
    if(val) el.title = val;
  });
  // Update lang selector if present
  const sel = document.getElementById('lang-sel');
  if(sel) sel.value = _lang;
}

// ── Sync the PAGE_TITLES map used by go() ─────────────────────────
function _syncPageTitles(){
  if(typeof PAGE_TITLES !== 'undefined'){
    PAGE_TITLES.dash       = t('nav.dash');
    PAGE_TITLES.inv        = t('nav.inv');
    PAGE_TITLES.cats       = t('nav.cats');
    PAGE_TITLES.tasks      = t('nav.tasks');
    PAGE_TITLES.svc        = t('nav.svc');
    PAGE_TITLES.warr       = t('nav.warr');
    PAGE_TITLES.receipts   = t('nav.receipts');
    PAGE_TITLES.eco        = t('nav.eco');
    PAGE_TITLES.family     = t('nav.family');
    PAGE_TITLES.admin      = t('nav.admin');
    PAGE_TITLES.settings   = t('nav.settings');
    PAGE_TITLES.checklists = t('nav.checklists');
  }
  if(typeof ADD_LABELS !== 'undefined'){
    ADD_LABELS.inv      = t('add.inv');
    ADD_LABELS.tasks    = t('add.tasks');
    ADD_LABELS.svc      = t('add.svc');
    ADD_LABELS.cats     = t('add.cats');
    ADD_LABELS.receipts = t('add.receipts');
  }
}

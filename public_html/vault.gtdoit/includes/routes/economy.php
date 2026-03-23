<?php
// ── Economy routes ─────────────────────────────────────────────────

function eco_summary(): never {
    $u = require_auth(); $month = sf('month') ?: date('Y-m');
    [$y, $mo] = explode('-', $month);
    $db = get_db(); $fid = $u['active_family_id'];

    $s = $db->prepare('SELECT type, SUM(amount) AS total FROM transactions WHERE family_id=? AND YEAR(trans_date)=? AND MONTH(trans_date)=? GROUP BY type');
    $s->execute([$fid, $y, $mo]); $rows = $s->fetchAll();
    $income = 0; $expense = 0;
    foreach ($rows as $r) { if ($r['type']==='income') $income=$r['total']; else $expense=$r['total']; }

    $c = $db->prepare('SELECT bc.name,bc.icon,bc.color,bc.budget,SUM(t.amount) AS total
        FROM transactions t JOIN budget_categories bc ON bc.id=t.category_id
        WHERE t.family_id=? AND t.type="expense" AND YEAR(t.trans_date)=? AND MONTH(t.trans_date)=?
        GROUP BY bc.id ORDER BY total DESC');
    $c->execute([$fid, $y, $mo]); $by_cat = $c->fetchAll();

    $t = $db->prepare('SELECT YEAR(trans_date) AS y, MONTH(trans_date) AS m, type, SUM(amount) AS total
        FROM transactions WHERE family_id=? AND trans_date >= DATE_SUB(?,INTERVAL 6 MONTH)
        GROUP BY YEAR(trans_date),MONTH(trans_date),type ORDER BY y,m');
    $t->execute([$fid, $month . '-01']); $trend = $t->fetchAll();

    jout(['income' => (float)$income, 'expense' => (float)$expense, 'balance' => (float)($income - $expense), 'by_category' => $by_cat, 'trend' => $trend]);
}


function eco_trans_bulk_delete(): never {
    $u = require_auth();
    $ids = json_decode(file_get_contents('php://input'), true)['ids'] ?? [];
    if (empty($ids)) json_die(['error' => 'Inga ID angivna']);
    $ids = array_map('intval', $ids);
    $ph = implode(',', array_fill(0, count($ids), '?'));
    $params = array_merge([$u['active_family_id']], $ids);
    $deleted = get_db()->prepare("DELETE FROM transactions WHERE family_id=? AND id IN ($ph)");
    $deleted->execute($params);
    jout(['deleted' => $deleted->rowCount()]);
}
function eco_trans_list(): never {
    $u = require_auth(); $month = sf('month') ?: date('Y-m');
    [$y, $mo] = explode('-', $month);
    $s = get_db()->prepare('SELECT t.*,bc.name AS cat_name,bc.icon AS cat_icon,bc.color AS cat_color
        FROM transactions t LEFT JOIN budget_categories bc ON bc.id=t.category_id
        WHERE t.family_id=? AND YEAR(t.trans_date)=? AND MONTH(t.trans_date)=?
        ORDER BY t.trans_date DESC,t.created_at DESC');
    $s->execute([$u['active_family_id'], $y, $mo]); jout($s->fetchAll());
}

function eco_trans_create(): never {
    $u = require_auth(); $desc = sf('description'); if (!$desc) json_die(['error' => 'Beskrivning krävs']);
    $amt = ff('amount'); if ($amt <= 0) json_die(['error' => 'Belopp måste vara positivt']);
    $db = get_db(); $cid = intf('category_id') ?: null;
    $db->prepare('INSERT INTO transactions (family_id,created_by,category_id,type,amount,description,note,trans_date) VALUES (?,?,?,?,?,?,?,?)')->execute([$u['active_family_id'], $u['id'], $cid, sf('type') ?: 'expense', $amt, $desc, sf('note'), df('trans_date') ?: date('Y-m-d')]);
    $id = $db->lastInsertId();
    $s = get_db()->prepare('SELECT t.*,bc.name AS cat_name,bc.icon AS cat_icon,bc.color AS cat_color FROM transactions t LEFT JOIN budget_categories bc ON bc.id=t.category_id WHERE t.id=?');
    $s->execute([$id]); jout($s->fetch(), 201);
}

function eco_trans_update(int $id): never {
    $u = require_auth(); $db = get_db(); $cid = intf('category_id') ?: null;
    $db->prepare('UPDATE transactions SET category_id=?,type=?,amount=?,description=?,note=?,trans_date=? WHERE id=? AND family_id=?')->execute([$cid, sf('type') ?: 'expense', ff('amount'), sf('description'), sf('note'), df('trans_date') ?: date('Y-m-d'), $id, $u['active_family_id']]);
    $s = get_db()->prepare('SELECT t.*,bc.name AS cat_name,bc.icon AS cat_icon,bc.color AS cat_color FROM transactions t LEFT JOIN budget_categories bc ON bc.id=t.category_id WHERE t.id=?');
    $s->execute([$id]); jout($s->fetch());
}

function eco_trans_delete(int $id): never {
    $u = require_auth();
    get_db()->prepare('DELETE FROM transactions WHERE id=? AND family_id=?')->execute([$id, $u['active_family_id']]);
    jout(['ok' => true]);
}

function eco_cats_list(): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT * FROM budget_categories WHERE family_id=? ORDER BY type,name');
    $s->execute([$u['active_family_id']]); jout($s->fetchAll());
}

function eco_cats_create(): never {
    $u = require_auth(); $name = sf('name'); if (!$name) json_die(['error' => 'Namn krävs']);
    $db = get_db();
    $db->prepare('INSERT IGNORE INTO budget_categories (family_id,name,icon,color,type,budget) VALUES (?,?,?,?,?,?)')->execute([$u['active_family_id'], $name, sf('icon') ?: '💰', sf('color') ?: '#5B8EF0', sf('type') ?: 'expense', ff('budget') ?: null]);
    $id = $db->lastInsertId();
    $s = $db->prepare('SELECT * FROM budget_categories WHERE id=?'); $s->execute([$id]); jout($s->fetch(), 201);
}

function eco_cats_update(int $id): never {
    $u = require_auth();
    get_db()->prepare('UPDATE budget_categories SET name=?,icon=?,color=?,type=?,budget=? WHERE id=? AND family_id=?')->execute([sf('name'), sf('icon') ?: '💰', sf('color') ?: '#5B8EF0', sf('type') ?: 'expense', ff('budget') ?: null, $id, $u['active_family_id']]);
    $s = get_db()->prepare('SELECT * FROM budget_categories WHERE id=?'); $s->execute([$id]); jout($s->fetch());
}

function eco_cats_delete(int $id): never {
    $u = require_auth();
    get_db()->prepare('DELETE FROM budget_categories WHERE id=? AND family_id=?')->execute([$id, $u['active_family_id']]);
    jout(['ok' => true]);
}

function eco_import(): never {
    $u = require_auth();
    if (!isset($_FILES['file'])) json_die(['error' => 'Ingen fil']);
    $f = $_FILES['file'];
    if ($f['error'] !== UPLOAD_ERR_OK) json_die(['error' => 'Filfel ' . $f['error']]);
    if (!in_array(strtolower(pathinfo($f['name'], PATHINFO_EXTENSION)), ['csv','txt'])) json_die(['error' => 'Stöder CSV och TXT']);

    $content = file_get_contents($f['tmp_name']);
    if (str_starts_with($content, "\xEF\xBB\xBF")) $content = substr($content, 3);
    $content = str_replace(["\r\n","\r"], "\n", $content);
    $lines = array_values(array_filter(explode("\n", $content), fn($l) => trim($l) !== ''));
    if (count($lines) < 2) json_die(['error' => 'Filen verkar tom eller ogiltig']);

    $header = $lines[0];
    $sep = "\t";
    if (substr_count($header, ';') > substr_count($header, "\t")) $sep = ';';
    if (substr_count($header, ',') > substr_count($header, "\t") && substr_count($header, ',') > substr_count($header, ';')) $sep = ',';

    $headers = array_map(fn($h) => mb_strtolower(trim($h, " \t\r\n\"\xC2\xA0")), explode($sep, $header));
    $colDate   = col_index($headers, ['datum','date','bokföringsdag','bokf.dag','transaktionsdatum']);
    $colDesc   = col_index($headers, ['text','beskrivning','description','meddelande','rubrik','benämning']);
    $colAmount = col_index($headers, ['belopp','amount','transaktionsbelopp','summa','kronor']);
    $colType   = col_index($headers, ['typ','type','transaktionstyp']);

    if ($colDate === null || $colDesc === null || $colAmount === null)
        json_die(['error' => 'Kunde inte hitta kolumner. Kontrollera att filen är rätt exporterad.', 'headers_found' => $headers]);

    $db = get_db(); $fid = $u['active_family_id'];
    $cs = $db->prepare('SELECT id,name,type FROM budget_categories WHERE family_id=?');
    $cs->execute([$fid]); $budgetCats = $cs->fetchAll();


    // Count-based duplicate detection: handles identical transactions on same day
    $existCount = [];
    $existRows = $db->prepare('SELECT trans_date, ABS(amount) AS abs_amount, description, COUNT(*) AS cnt
        FROM transactions WHERE family_id=? GROUP BY trans_date, ABS(amount), description');
    $existRows->execute([$fid]);
    foreach ($existRows->fetchAll() as $row) {
        $key = $row['trans_date'].'|'.number_format((float)$row['abs_amount'],2,'.','').'|'.$row['description'];
        $existCount[$key] = (int)$row['cnt'];
    }

    $ins = $db->prepare('INSERT INTO transactions (family_id,created_by,category_id,type,amount,description,note,trans_date,source_file) VALUES (?,?,?,?,?,?,?,?,?)');
    $imported = $skipped = $dupes = 0;
    $fileCount = [];

    for ($i = 1; $i < count($lines); $i++) {
        $cols = array_map(fn($c) => trim($c, " \t\"\xC2\xA0"), explode($sep, $lines[$i]));
        $date   = parse_sv_date($cols[$colDate] ?? '');
        $desc   = clean_bank_desc($cols[$colDesc] ?? '');
        $amount = parse_sv_amount($cols[$colAmount] ?? '');
        if (!$date || !$desc || $amount === null || $amount == 0) { $skipped++; continue; }

        $type = $amount < 0 ? 'expense' : 'income';
        if ($colType !== null && isset($cols[$colType])) {
            $rt = mb_strtolower($cols[$colType]);
            if (preg_match('/ins[\xc3\xa4a]ttning|l[\xc3\xb6o]n|[\xc3\xb6o]verf[\xc3\xb6o]ring.*fr[\xc3\xa5a]n|kredit|bidrag|[\xc3\xa5a]terbetal/i', $rt)) $type = 'income';
            elseif (preg_match('/k[\xc3\xb6o]p|uttag|betalning|reserverat|debet/i', $rt)) $type = 'expense';
        }

        $abs = abs($amount);
        $key = $date.'|'.number_format($abs,2,'.','').'|'.$desc;
        $fileCount[$key] = ($fileCount[$key] ?? 0) + 1;
        $alreadyInDb = $existCount[$key] ?? 0;

        if ($alreadyInDb >= $fileCount[$key]) { $dupes++; continue; }

        $catId = auto_categorize($desc, $type, $budgetCats);
        $ins->execute([$fid, $u['id'], $catId, $type, $abs, $desc, null, $date, basename($f['name'])]);
        $existCount[$key] = $alreadyInDb + 1;
        $imported++;
    }

    jout(['imported' => $imported, 'skipped' => $skipped, 'duplicates' => $dupes]);
}

// ── Import helpers ─────────────────────────────────────────────────
function col_index(array $headers, array $candidates): ?int {
    foreach ($candidates as $c) { $idx = array_search($c, $headers); if ($idx !== false) return (int)$idx; }
    foreach ($headers as $i => $h) { foreach ($candidates as $c) { if (str_contains($h, $c)) return $i; } }
    return null;
}
function parse_sv_date(string $raw): ?string {
    $raw = trim($raw);
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $raw)) return $raw;
    if (preg_match('/^(\d{2})[\/\.](\d{2})[\/\.](\d{4})$/', $raw, $m)) return $m[3].'-'.$m[2].'-'.$m[1];
    return null;
}
function parse_sv_amount(string $raw): ?float {
    $raw = preg_replace('/\s*kr\s*$/ui', '', $raw);
    $raw = trim($raw, " \xC2\xA0\t");
    if ($raw === '' || $raw === '-') return null;
    $neg = str_starts_with($raw, '-') || str_starts_with($raw, "\xE2\x88\x92");
    $raw = ltrim($raw, "-\xE2\x88\x92");
    if (str_contains($raw, ',')) { $raw = str_replace([' ',"\xC2\xA0",'.'], '', $raw); $raw = str_replace(',', '.', $raw); }
    else { $raw = str_replace([' ',"\xC2\xA0"], '', $raw); }
    if (!is_numeric($raw)) return null;
    return $neg ? -(float)$raw : (float)$raw;
}
function clean_bank_desc(string $raw): string {
    $raw = preg_replace('/\s+/', ' ', trim($raw));
    if ($raw === mb_strtoupper($raw, 'UTF-8')) {
        $raw = mb_convert_case($raw, MB_CASE_TITLE, 'UTF-8');
    }
    return trim($raw);
}
function auto_categorize(string $desc, string $type, array $budgetCats): ?int {
    $d = mb_strtolower($desc);
    $rules = [
        'income'  => ['lön' => ['lön','salary'],'bidrag & ersättning' => ['försäkringskassan','arbetsförmedlingen','csn','skatteverket','a-kassa'],'övrig inkomst' => ['ränta','utdelning']],
        'expense' => [
            'mat & dagligvaror'  => ['ica','coop','willys','lidl','hemköp','netto','maxi','city gross','systembolaget'],
            'restaurang & café'  => ['mcdonalds','max burger','burger king','pizza','restaurang','sushi','kfc','starbucks','espresso house','waynes','café'],
            'transport'          => ['sl ','mtr','buss','tåg','taxi','uber','parkering','trängselskatt','ingo','preem','circle k','shell','st1','ok benzin'],
            'nöje & shopping'    => ['netflix','spotify','hbo','viaplay','disney','youtube','amazon','elgiganten','mediamarkt','webhallen','steam','clas ohlson','ikea','h&m','zara','klarna','paypal','claude'],
            'boende & hyra'      => ['hyra','vattenfall','eon ','fortum','telia','tele2','tre ','comhem','bahnhof','bredband'],
            'hälsa & apotek'     => ['apotek','apoteket','kronans','vårdcentral','tandläkar','folktandvård'],
            'försäkringar'       => ['folksam','trygg-hansa','if försäkring','länsförsäkring','gjensidige','skandia'],
            'barn & skola'       => ['förskola','dagis','fritids','skola','lekia'],
        ],
    ];
    foreach (($rules[$type] ?? []) as $catName => $keywords) {
        foreach ($keywords as $kw) {
            if (str_contains($d, $kw)) {
                foreach ($budgetCats as $cat) {
                    if ($cat['type'] === $type && mb_strtolower($cat['name']) === $catName) return (int)$cat['id'];
                }
            }
        }
    }
    return null;
}
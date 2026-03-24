<?php
// ── Items + Categories + Upload ────────────────────────────────────

function cat_list(): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT * FROM categories WHERE family_id=? ORDER BY sort_order,name');
    $s->execute([$u['active_family_id']]); jout($s->fetchAll());
}
function cat_create(): never {
    $u = require_auth(); $name = sf('name'); if (!$name) json_die(['error' => 'Namn krävs']);
    $db = get_db();
    $db->prepare('INSERT IGNORE INTO categories (family_id,name,icon,color) VALUES (?,?,?,?)')->execute([$u['active_family_id'], $name, sf('icon') ?: '📦', sf('color') ?: '#5B8EF0']);
    $id = $db->lastInsertId();
    if (!$id) { $s = $db->prepare('SELECT * FROM categories WHERE family_id=? AND name=?'); $s->execute([$u['active_family_id'], $name]); jout($s->fetch()); }
    $s = $db->prepare('SELECT * FROM categories WHERE id=?'); $s->execute([$id]); jout($s->fetch(), 201);
}
function cat_update(int $id): never {
    $u = require_auth();
    get_db()->prepare('UPDATE categories SET name=?,icon=?,color=? WHERE id=? AND family_id=?')->execute([sf('name'), sf('icon') ?: '📦', sf('color') ?: '#5B8EF0', $id, $u['active_family_id']]);
    $s = get_db()->prepare('SELECT * FROM categories WHERE id=?'); $s->execute([$id]); jout($s->fetch());
}
function cat_delete(int $id): never {
    $u = require_auth();
    get_db()->prepare('DELETE FROM categories WHERE id=? AND family_id=?')->execute([$id, $u['active_family_id']]);
    jout(['ok' => true]);
}

function item_list(): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT * FROM items WHERE family_id=? ORDER BY created_at DESC');
    $s->execute([$u['active_family_id']]); jout($s->fetchAll());
}
function item_get(int $id): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT * FROM items WHERE id=? AND family_id=?');
    $s->execute([$id, $u['active_family_id']]); $r = $s->fetch();
    if (!$r) json_die(['error' => 'Saknas'], 404); jout($r);
}
function item_create(): never {
    $u = require_auth(); $name = sf('name'); if (!$name) json_die(['error' => 'Namn krävs']);
    $db     = get_db();
    $status = sf('status') ?: 'ok';
    $db->prepare('INSERT INTO items (family_id,created_by,name,category,location,purchased,price,warranty,serial,notes,photo,tags,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)')
       ->execute([$u['active_family_id'], $u['id'], $name, sf('category') ?: 'Övrigt', sf('location'), df('purchased'), ff('price'), df('warranty'), sf('serial'), sf('notes'), sf('photo'), sf('tags'), $status]);
    $id = $db->lastInsertId();
    $s  = $db->prepare('SELECT * FROM items WHERE id=?'); $s->execute([$id]);
    $item = $s->fetch();
    update_snapshot($u['active_family_id']);
    log_act($u['active_family_id'], $u['id'], $u['username'], 'create', 'item', $id, $name);
    jout($item, 201);
}
function item_update(int $id): never {
    $u = require_auth(); $name = sf('name'); if (!$name) json_die(['error' => 'Namn krävs']);
    $db     = get_db();
    $status = sf('status') ?: 'ok';
    $db->prepare('UPDATE items SET name=?,category=?,location=?,purchased=?,price=?,warranty=?,serial=?,notes=?,photo=?,tags=?,status=? WHERE id=? AND family_id=?')
       ->execute([$name, sf('category') ?: 'Övrigt', sf('location'), df('purchased'), ff('price'), df('warranty'), sf('serial'), sf('notes'), sf('photo'), sf('tags'), $status, $id, $u['active_family_id']]);
    $s = $db->prepare('SELECT * FROM items WHERE id=?'); $s->execute([$id]);
    $item = $s->fetch();
    update_snapshot($u['active_family_id']);
    log_act($u['active_family_id'], $u['id'], $u['username'], 'update', 'item', $id, $name);
    jout($item);
}
function item_delete(int $id): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT name FROM items WHERE id=? AND family_id=?'); $s->execute([$id, $u['active_family_id']]); $row = $s->fetch();
    get_db()->prepare('DELETE FROM items WHERE id=? AND family_id=?')->execute([$id, $u['active_family_id']]);
    update_snapshot($u['active_family_id']);
    if ($row) log_act($u['active_family_id'], $u['id'], $u['username'], 'delete', 'item', $id, $row['name']);
    jout(['ok' => true]);
}

// ── CSV import ────────────────────────────────────────────────────
// Expected columns (header row required):
// name, category, location, purchased (YYYY-MM-DD), price, warranty (YYYY-MM-DD), serial, notes, tags, status
function item_csv_import(): never {
    $u = require_auth();
    if (!isset($_FILES['csv'])) json_die(['error' => 'Ingen fil']);
    $f = $_FILES['csv'];
    if ($f['error'] !== UPLOAD_ERR_OK) json_die(['error' => 'Fel ' . $f['error']]);
    if ($f['size'] > 2 * 1024 * 1024) json_die(['error' => 'Max 2MB']);

    $handle = fopen($f['tmp_name'], 'r');
    if (!$handle) json_die(['error' => 'Kunde ej läsa fil'], 500);

    $header = fgetcsv($handle, 0, ',');
    if (!$header) { fclose($handle); json_die(['error' => 'Tom CSV']); }
    $header = array_map('strtolower', array_map('trim', $header));

    $col = [];
    foreach ($header as $i => $h) $col[$h] = $i;
    if (!isset($col['name'])) { fclose($handle); json_die(['error' => 'Kolumn "name" saknas']); }

    $db      = get_db();
    $stmt    = $db->prepare('INSERT INTO items (family_id,created_by,name,category,location,purchased,price,warranty,serial,notes,tags,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    $inserted = 0;
    $errors   = [];

    while (($row = fgetcsv($handle, 0, ',')) !== false) {
        $g = fn(string $k) => isset($col[$k]) ? trim($row[$col[$k]] ?? '') : '';
        $name = $g('name'); if (!$name) continue;
        $price   = ($p = $g('price'))   ? (float)str_replace(',', '.', $p) : 0.0;
        $status  = in_array($g('status'), ['ok','broken','lent','for_sale']) ? $g('status') : 'ok';
        $purch   = preg_match('/^\d{4}-\d{2}-\d{2}$/', $g('purchased'))  ? $g('purchased')  : null;
        $warr    = preg_match('/^\d{4}-\d{2}-\d{2}$/', $g('warranty'))   ? $g('warranty')   : null;
        try {
            $stmt->execute([$u['active_family_id'], $u['id'], $name, $g('category') ?: 'Övrigt', $g('location') ?: null, $purch, $price, $warr, $g('serial') ?: null, $g('notes') ?: null, $g('tags') ?: null, $status]);
            $inserted++;
        } catch (\Throwable $e) {
            $errors[] = $name . ': ' . $e->getMessage();
        }
    }
    fclose($handle);
    update_snapshot($u['active_family_id']);
    log_act($u['active_family_id'], $u['id'], $u['username'], 'csv_import', 'item', null, "Importerade $inserted saker");
    jout(['inserted' => $inserted, 'errors' => $errors]);
}

function upload_file(): never {
    $u = require_auth();
    if (!isset($_FILES['photo'])) json_die(['error' => 'Ingen fil']);
    $f = $_FILES['photo'];
    if ($f['error'] !== UPLOAD_ERR_OK) json_die(['error' => 'Fel ' . $f['error']]);
    if ($f['size'] > MAX_UPLOAD_MB * 1024 * 1024) json_die(['error' => 'Max ' . MAX_UPLOAD_MB . 'MB']);
    $fi = finfo_open(FILEINFO_MIME_TYPE); $mime = finfo_file($fi, $f['tmp_name']); finfo_close($fi);
    $ok = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
    if (!isset($ok[$mime])) json_die(['error' => 'Tillåts: jpg,png,gif,webp']);
    $name = 'v_' . $u['id'] . '_' . bin2hex(random_bytes(8)) . '.' . $ok[$mime];
    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0755, true);
    if (!move_uploaded_file($f['tmp_name'], UPLOAD_DIR . $name)) json_die(['error' => 'Kunde ej spara'], 500);
    jout(['url' => UPLOAD_URL . $name], 201);
}

<?php
// ── Receipts ───────────────────────────────────────────────────────

function rec_list(): never {
    $u = require_auth();
    $s = get_db()->prepare('SELECT r.*,i.name AS item_name FROM receipts r LEFT JOIN items i ON i.id=r.item_id WHERE r.family_id=? ORDER BY r.receipt_date DESC,r.created_at DESC');
    $s->execute([$u['active_family_id']]); jout($s->fetchAll());
}

function rec_create(): never {
    $u = require_auth(); $title = sf('title'); if (!$title) json_die(['error' => 'Titel krävs']);
    $db = get_db(); $iid = intf('item_id') ?: null;
    $db->prepare('INSERT INTO receipts (family_id,created_by,item_id,title,amount,store,receipt_date,notes,photo) VALUES (?,?,?,?,?,?,?,?,?)')->execute([$u['active_family_id'], $u['id'], $iid, $title, ff('amount') ?: null, sf('store'), df('receipt_date'), sf('notes'), sf('photo')]);
    $id = $db->lastInsertId();
    $s = get_db()->prepare('SELECT r.*,i.name AS item_name FROM receipts r LEFT JOIN items i ON i.id=r.item_id WHERE r.id=?');
    $s->execute([$id]); jout($s->fetch(), 201);
}

function rec_update(int $id): never {
    $u = require_auth(); $db = get_db(); $iid = intf('item_id') ?: null;
    $db->prepare('UPDATE receipts SET item_id=?,title=?,amount=?,store=?,receipt_date=?,notes=?,photo=? WHERE id=? AND family_id=?')->execute([$iid, sf('title'), ff('amount') ?: null, sf('store'), df('receipt_date'), sf('notes'), sf('photo'), $id, $u['active_family_id']]);
    $s = get_db()->prepare('SELECT r.*,i.name AS item_name FROM receipts r LEFT JOIN items i ON i.id=r.item_id WHERE r.id=?');
    $s->execute([$id]); jout($s->fetch());
}

function rec_delete(int $id): never {
    $u = require_auth(); $db = get_db();
    $s = $db->prepare('SELECT photo FROM receipts WHERE id=? AND family_id=?'); $s->execute([$id, $u['active_family_id']]); $r = $s->fetch();
    if ($r && $r['photo']) {
        $file = UPLOAD_DIR . basename($r['photo']);
        if (file_exists($file)) unlink($file);
    }
    $db->prepare('DELETE FROM receipts WHERE id=? AND family_id=?')->execute([$id, $u['active_family_id']]);
    jout(['ok' => true]);
}
